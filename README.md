# Road Trip Planner

## Introduction
Road Trip Planner is a full-stack web application designed to enhance your travel planning experience. Leveraging AI recommendations, it suggests cities to visit, shows directions on the map, and creates an optimized road trip itinerary. Built with a React frontend and an Express and MongoDB backend, this app incorporates advanced mapping features and security measures to ensure a user-friendly and safe planning process.

## Features
- **AI City Recommendations:** Receive suggestions on cities to visit based on your preferences and interests.
- **Interactive Map View:** Utilize React-Map-GL/Mapbox-GL to explore cities, routes, and points of interest on an interactive map.
- **Secure User Authentication:** Register and log in securely with JSON Web Tokens (JWT) and bcrypt.js for hashing passwords.
- **Responsive Design:** A responsive user interface that fits user needs, built with React Bootstrap and FontAwesome for a sleek look.
- **Travel Itinerary Management:** Create, edit, and save your travel itineraries with ease.

## Technologies
### Backend
- **MongoDB:** A NoSQL database used to store user and itinerary data.
- **Express.js:** A web application framework for Node.js, designed for building web applications and APIs.
- **Cors:** A node.js package for providing an Express middleware that can be used to enable CORS with various options.
- **Morgan:** HTTP request logger middleware for node.js.
- **Helmet:** Helps secure your Express apps by setting various HTTP headers.
- **JSON web token:** An implementation of JSON Web Tokens for authentication.
- **bcryptjs:** A password hashing library.

### Frontend
- **React:** A JavaScript library for building user interfaces.
- **Bootstrap & React-Bootstrap:** Front-end frameworks for developing responsive and mobile-first websites.
- **FontAwesome:** A font and icon toolkit based on CSS and Less.
- **Mapbox-GL & React-Map-GL:** JavaScript libraries for interactive, customizable vector maps on the web.
- **jwt-decode:** A small browser library that helps decode JWTs tokens which are Base64Url encoded.
- **@mapbox/mapbox-gl-decoder:** Provides utilities for decoding Mapbox GL styles and other Mapbox-specific formats.
- **@mapbox/mapbox-gl-directions:** Directions API for finding paths between coordinates.
- **Foursquare/Wikidata:** Unique place identifiers to fetch images and location details.

### AI Integration
- **OpenAI API:** Recommend tourist attractions along the route and hotels/stays, with a chat window for search improvements.

### Deployment
- **Firebase:** A Google platform for project deployment.

## Data Models
### PointOfInterest
- **title:** name of the place
- **place_type:** place type, ***address*** or ***poi***
- **address:** full address
- **latitude:** latitude of place
- **longitude:** longitude of place
- **id:** ID of place, ***poi.###*** if poi, ***address.###*** if address
- **relevance:** how relevant thd place is
- **category:** what category this place belongs to
- **landmark:** boolean, true if it is a landmark
- **wikidata:** universal poi reference
- **imageUrl:** url of a representative image

### User
- **username:** username
- **email:** email
- **hashPassword:** hashed password
- **pointOfInterest:** array of POIs saved by user


## Getting Started
### Prerequisites
- Node.js
- npm or yarn
- MongoDB

### Setting Up the Project

#### Backend
1. Go to 'server' directory
2. Install dependencies: `npm install`
3. Configure your environment variables in `.env`
4. Start the server: `npm run dev`

#### Frontend
1. Go to 'client' directory
2. Install dependencies: `npm install`
3. Configure Mapbox token, OpenTripMap token, Firebase token and Foursquare token in `.env`
4. Start the React app: `npm start`

Open your browser and navigate to `http://localhost:3000`.

## Authors
This project is created by @LocalBinNotFound, @Xiyuan Tu, @Airline-Wuhu, and @Antonyyqr

