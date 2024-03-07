// import { useState } from "react";
import OpenAI from "openai";

const ChatbotApp = ({ origin, destination, timeLength, waypointSetter }) => {
  const [waypoints, setWaypoints] = waypointSetter;
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  //   const [apiResponse, setApiResponse] = useState("");

  // const dummyInput = {
  //   origin: "Mccandless Drive",
  //   Waypoints: ["Salt Lake City", "Twin Falls"],
  //   Destination: "Seattle Aquarium",
  //   timeLegth: 10,
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    const messages = [
      {
        role: "system",
        content: `you are an assistant helping users to plan their trip. 
          Here are some requirements: 
          the user will travel by driving. 
          the time length of the trip is: ${timeLength} days.
          the origin is: ${origin}, and the destination is: ${destination}.
          want-yo-go landmarks include: ${waypoints}.
          no further information from user can be acquired.
          please schedule an interesting travelling plan for the user with popular must-visit places
           `,
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
        content: `according to this itinerary please depict all the landmarks/places to visit on map including all the examples mentioned`,
      });
      const secondRes = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: messages,
        tools: tools,
      });
      const secondResMessage = secondRes.choices[0].message;
      console.log(secondResMessage);
      // Step 2: check if the model wanted to call a function
      const toolCalls = secondResMessage.tool_calls;
      if (toolCalls) {
        for (const toolCall of toolCalls) {
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(functionArgs);
          for (const location of functionArgs.locations) {
            console.log(location);
          //   if (
          //     location === origin ||
          //     location === destination ||
          //     location in waypoints
          //   )
          //     continue;
            
          //   const point = {
          //     _id: entry._id,
          //     name: entry.title,
          //     coordinates: [entry.longitude, entry.latitude],
          //     address: entry.address,
          //   };
          //   setWaypoints(...waypoints, location);
          }
        }
      }
    } catch (e) {
      console.log(e);
      //   setApiResponse("Something is going wrong, Please try again.");
    }
  };

  return (
    <>
      <button className="btn btn-success" onClick={handleSubmit}>
        <i className="fa-solid fa-wand-magic-sparkles"></i>AI Recommendations{" "}
      </button>
    </>
  );
};

export default ChatbotApp;
