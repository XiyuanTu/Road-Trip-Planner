import { useState } from "react";
import OpenAI from "openai";

import { notification } from "antd";

const LAT = 1;
const LON = 0;

const ChatbotApp = ({ origin, destination, waypointSetter, AILogSetter }) => {
  const [api, contextHolder] = notification.useNotification();
  const [AIres, setAIres] = AILogSetter;
  const openNotification = (placement) => {
    api.info({
      message: `Information needed`,
      description: "Please choose your Origin AND your Destination!",
      placement,
    });
  };

  const [waypoints, setWaypoints] = waypointSetter;
  // extract all the waypoints
  const waypointsSet = new Set();
  waypoints.forEach((waypoint) => waypointsSet.add(waypoint.name));

  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const addWaypoints = async (locations) => {
    let maxLat = Math.max(
      origin.coordinates[LAT],
      destination.coordinates[LAT]
    );
    let minLat = Math.min(
      origin.coordinates[LAT],
      destination.coordinates[LAT]
    );
    let maxLon = Math.max(
      origin.coordinates[LON],
      destination.coordinates[LON]
    );
    let minLon = Math.min(
      origin.coordinates[LON],
      destination.coordinates[LON]
    );

    // used to exclude dups
    const wikidataSet = new Set();
    const idSet = new Set();
    waypoints.forEach((point) => {
      wikidataSet.add(point.wikidata);
      idSet.add(point._id);
      maxLat = Math.max(point.coordinates[LAT], maxLat);
      minLat = Math.min(point.coordinates[LAT], minLat);
      maxLon = Math.max(point.coordinates[LON], maxLon);
      minLon = Math.min(point.coordinates[LON], minLon);
    });
    console.log(wikidataSet, idSet);
    maxLat += 1;
    minLat -= 1;
    maxLon += 2;
    minLon -= 2;
    const promises = locations.map(async (location) => {

      const apiUrl = `https://secure.geonames.org/searchJSON?name=${encodeURIComponent(
        location
      )}&maxRows=1&country=US&username=${process.env.REACT_APP_GEONAMES_USERNAME
        }`;
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const features = data.geonames;

        if (features && features.length > 0) {
          const result = features[0];

          const { lng, lat, geonameId, toponymName } = result;

          if (idSet.has(geonameId)) return null; // exclude dups

          if (lng < maxLon && lng > minLon && lat < maxLat && lat > minLat) {
            return {
              _id: String(geonameId), wikidata: "", //TODO: FIND WIKIDATA
              name: toponymName, coordinates: [lng, lat], address: "address", // TODO: FIND ADDRESS
            };
          }
        }

        const mapboxiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          location
        )}.json?country=us&fuzzyMatch=true&bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}limit=1&language=en&autocomplete=true&worldview=us&access_token=${process.env.REACT_APP_MAPBOX_TOKEN
          }`;
        const responseM = await fetch(mapboxiUrl);
        if (!responseM.ok) {
          throw new Error(`HTTP error! Status: ${responseM.status}`);
        }

        const dataM = await responseM.json();
        const featuresM = dataM.features;

        if (featuresM && featuresM.length > 0) {
          const result = featuresM[0];
          const wikidata = result.properties.wikidata;
          const name = result.text_en;

          if (
            idSet.has(result.id) || // exclude dups
            (wikidata && wikidataSet.has(wikidata)) // exclude dups
            // name !== location
          )
            return null; // exclude nonematch

          return {
            _id: result.id,
            wikidata: result.properties.wikidata || "",
            name: name,
            coordinates: result?.center || (result.geometry?.type === "Point" && result.geometry.coordinates),
            address: result.place_name_en,
          };
        } else {
          console.log("No results found for location: ", location);
          return null;
        }
        // }
      } catch (error) {
        console.error("Fetch error:", error);
        return null;
      }
    });

    try {
      const newWaypoints = await Promise.all(promises);
      const filteredWaypoints = newWaypoints.filter(
        (point) => point !== null && point
      );
      setWaypoints([...waypoints, ...filteredWaypoints]);
    } catch (error) {
      console.error("Error adding waypoints:", error);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!origin || !destination) {
      openNotification("top");
      return;
    }
    setLoading(true);
    console.log(origin, destination, waypoints);
    const tools = [
      {
        type: "function",
        function: {
          name: "depict",
          description: "a function which takes in places and depict on map",
          parameters: {
            type: "object",
            properties: {
              locations: {
                type: "array",
                description: `an array which has only ${Math.max(
                  23 - waypoints.length,
                  0
                )} slots`,
                items: {
                  type: "string",
                  description:
                    "a landmark, e.g., Times Square, Harvard University, ABC restaurant",
                },
              },
            },
            required: ["locations"],
          },
        },
      },
    ];
    // console.log(prompt);
    const messages = [
      {
        role: "system",
        content: `You are a virtual road trip planner. 
        Your task is to help users plan a road trip from the provided origin to the destination, 
        passing through specified waypoints. The road trip should include all provided waypoints, 
        and additional waypoints must be suggested to offer a balanced and diverse selection of landmarks. 
        Do NOT include waypoints within 100 miles from ${origin.address}, but do include waypoints for destination.
        List the waypoints in order to avoid retrogression as much as possible.
        Keep in mind that the total number of waypoints (including both provided and generated ones) should not exceed 20. 
        Provide a detailed itinerary with interesting points of interest for the user's journey.`,


      },
      {
        role: "user",
        content: `from ${origin.address} to ${destination.address}
          waypoints: ${waypointsSet}
          extra requirements: ${prompt}
          `,

        // `Create a compelling road trip itinerary from ${
        //   origin.name
        // } to ${destination.name} for the user.
        // ignore those in ${
        //   origin.name
        // }, suggest a concise list of must-visit landmarks along the way, including ${waypoints}.
        // And here are additional information/requirements provided by the user: ${prompt}
        // Consider the user's preferences, and provide a balanced and diverse selection of landmarks.
        // stricly limit the total number of places (x) to a maximum of ${Math.max(
        //   23 - waypoints.length,
        //   0
        // )}. `,
        // content: `Create a compelling road trip itinerary for the user from ${origin} to ${destination}.
        // And here are additional information provided by the user: ${prompt}
        // Suggest a concise list of must-visit landmarks, including ${waypoints},
        // with the total number of places (x) flexible and within the range of 0 to 25.
        // Consider the user's preferences, as no additional information is available.`,
      },
    ];
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: messages,
        temperature: 0,
        max_tokens: 4000,
      });

      const responseMessage = response.choices[0].message;

      console.log(response.choices[0].message.content);
      //   setApiResponse(response.choices[0].message.content);

      // get the plan and produce jsons as routing inputs
      messages.push(responseMessage);
      messages.push({
        role: "system",
        content: `Based on the provided itinerary, visualize all the landmarks/places to visit on a map, 
        excluding all the given places from user(origin, destination, and waypoints). 
        If possible, exclude city/state names—for instance, 
        'Hollywood Walk of Fame, Los Angeles' should be 'Hollywood Walk of Fame.' `,

      });
      const secondRes = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: messages,
        tools: tools,
      });
      const secondResMessage = secondRes.choices[0].message;
      // console.log(secondResMessage);
      // Step 2: check if the model wanted to call a function
      const toolCalls = secondResMessage.tool_calls;
      if (toolCalls) {
        for (const toolCall of toolCalls) {
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(functionArgs);
          await addWaypoints(functionArgs.locations);
        }
      }
      setLoading(false);
      setAIres(responseMessage.content);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      {contextHolder}
      {loading && (
        <div className="full-page-overlay">
          <div className="loading-message">
            <div className="loading-bar" role="status">
              <div className="bar"></div>
            </div>
            AI is on the way...
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="card-header">Additional Details for AI</div>
          <textarea
            maxLength="100"
            className="form-control"
            typeof="text"
            value={prompt}
            placeholder="Specify additional preferences in natural language (max length 100)"
            onChange={(e) => setPrompt(e.target.value)}
          ></textarea>
        </div>
        <div className="clear-button-container text-center">

          <button className="btn btn-success" type="submit" disabled={loading}>
            {loading ? (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i>AI
                Recommendations
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default ChatbotApp;
