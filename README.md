# Road Trip Planner

## Introduction
Road Trip Planner is a full-stack web application designed to enhance your travel planning experience. Leveraging AI recommendations, it suggests cities to visit, show directions on the map and creating an optimized road trip itinerary. Built with a React frontend and an Express and MongoDB backend, this app incorporates advanced mapping features and security measures to ensure a user-friendly and safe planning process.

## Features
- **AI City Recommendations:** Receive suggestions on cities to visit based on your preferences and interests.
- **Interactive Map View:** Utilize Mapbox to explore cities, routes, and points of interest on an interactive map.
- **Secure User Authentication:** Register and log in securely with JSON Web Tokens (JWT) and bcrypt.js for hashing passwords.
- **Responsive Design:** A mobile-friendly interface that adapts seamlessly across devices, built with React Bootstrap and FontAwesome for a sleek look.
- **Travel Itinerary Management:** Create, edit, and save your travel itineraries with ease.

## Technologies
### Backend
- **MongoDB:** A NoSQL database used to store user and itinerary data.
- **Express.js:** A web application framework for Node.js, designed for building web applications and APIs.
- **Cors:** A node.js package for providing an Express middleware that can be used to enable CORS with various options.
- **Morgan:** HTTP request logger middleware for node.js.
- **Helmet:** Helps secure your Express apps by setting various HTTP headers.
- **jsonwebtoken:** An implementation of JSON Web Tokens for authentication.
- **bcryptjs:** A library to help you hash passwords.

### Frontend
- **React:** A JavaScript library for building user interfaces.
- **Bootstrap & React-Bootstrap:** Front-end frameworks for developing responsive and mobile-first websites.
- **FontAwesome:** A font and icon toolkit based on CSS and Less.
- **Mapbox GL & react-map-gl:** JavaScript libraries for interactive, customizable vector maps on the web.
- **jwt-decode:** A small browser library that helps decoding JWTs token which are Base64Url encoded.
- **@mapbox/mapbox-gl-decoder:** Provides utilities for decoding Mapbox GL styles and other Mapbox-specific formats.

## Getting Started

### Prerequisites
- Node.js
- npm or yarn
- MongoDB

### Setting Up the Project

#### Backend
1. Install dependencies: `npm install`
2. Configure your environment variables:
- Create a `.env` file in the root of the backend directory.
- Add your MongoDB URI, JWT secret, and any other config variables required.
3. Start the server: `npm run dev`

#### Frontend
1. Install dependencies: `npm install`
2. Configure Mapbox access token in your environment variables or directly in the application.
3. Start the React app: `npm start`

Open your browser and navigate to `http://localhost:3000`.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## License


This README provides a basic overview of the Road Trip Planner project. 


