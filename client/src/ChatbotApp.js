import { useState } from "react";
import OpenAI from "openai";

const ChatbotApp = ({ origin, destination, waypointSetter }) => {
  const [waypoints, setWaypoints] = waypointSetter;
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const addWaypoints = async (locations) => {
    // used to exclude dups
    const wikidataSet = new Set();
    const idSet = new Set();
    waypoints.forEach((point) => {
      wikidataSet.add(point.wikidata);
      idSet.add(point._id);
    });
    
    const promises = locations.map(async (location) => {
      const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        location
      )}.json?country=us&limit=1&language=en&autocomplete=false&access_token=${
        process.env.REACT_APP_MAPBOX_TOKEN
      }`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const features = data.features;

        if (features && features.length > 0) {
          const result = features[0];
          const wikidata = result.properties.wikidata;
          // exclude dups
          if (idSet.has(result.id)) return null;
          if (wikidata && wikidataSet.has(wikidata)) return null;

          const point = {
            // _id: result.properties.wikidata || "",
            _id: result.id,
            wikidata: result.properties.wikidata || "",
            name: result.text_en,
            coordinates:
              result?.center ||
              (result.geometry?.type === "Point" &&
                result.geometry.coordinates),
            address: result.place_name_en,
          };
          return point;
        } else {
          console.log("No results found for location: ", location);
          return null;
        }
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
    setLoading(true);
    // console.log(origin, destination, waypoints);
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
                description: "an array which has only 25 slots",
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
        content: `Create a compelling road trip itinerary from ${origin.coordinates} to ${destination.coordinates} for the user. 
        And here are additional information provided by the user: ${prompt}
        Suggest a concise list of must-visit landmarks, including ${waypoints},
        limiting the total number of waypoints to a maximum of 25. 
        Consider the user's preferences, and provide a balanced and diverse selection of landmarks.`,
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

      // console.log(response.choices[0].message.content);
      //   setApiResponse(response.choices[0].message.content);

      // get the plan and produce jsons as routing inputs
      messages.push(responseMessage);
      messages.push({
        role: "system",
        content: `Based on the provided itinerary, visualize all the landmarks/places to visit on a map, 
        excluding all the given places from user(origin, destination, and waypoints). 
        If possible, exclude city/state names—for instance, 
        'Hollywood Walk of Fame, Los Angeles' should be 'Hollywood Walk of Fame.' 
        Ensure the depiction adheres to a quantity limit of 25, focusing on the most prominent and significant landmarks.`,
        // content: `Based on the provided itinerary, visualize all the landmarks/places to visit on a map,
        // including the examples mentioned except origin and destination.
        // If possible, exclude city/state names—for instance,
        // 'Hollywood Walk of Fame, Los Angeles' should be 'Hollywood Walk of Fame.'
        // Ensure the depiction adheres to a quantity limit of 25`,
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
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
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
            type="text"
            value={prompt}
            placeholder="Specify additional preferences in natural language (max length 100)"
            onChange={(e) => setPrompt(e.target.value)}
          ></textarea>
        </div>
        <div className="clear-button-container text-center">
          {/* <button className="btn btn-success" type="submit">
            <i className="fa-solid fa-wand-magic-sparkles"></i>AI
            Recommendations
          </button> */}
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
