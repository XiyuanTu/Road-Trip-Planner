import React, { useState, useEffect, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
import { CgProfile } from "react-icons/cg";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import Map, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
  AttributionControl,
} from "react-map-gl";

import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";

import {
  listPointOfInterests,
  deletePointOfInterest,
  updatePointOfInterest,
} from "./API/pointOfInterestAPI";
import { deleteUser, getUser } from "./API/userAPI";

import AuthPage from "./forms/auth-page";

import GeocoderControl from "./geocoder-control";

import { jwtDecode } from "jwt-decode";
import { LngLatBounds } from "mapbox-gl";

import ChatbotApp from "./ChatbotApp.js";
import Profile from "./forms/profile.js";

const App = () => {
  const [viewState, setViewState] = React.useState({
    longitude: -100.6,
    latitude: 37.6,
    zoom: 4,
  });

  const mapStyles = [
    { label: "Streets", value: "mapbox://styles/mapbox/streets-v12" },
    {
      label: "Cityscape",
      value: "mapbox://styles/mapbox/standard",
    },
    { label: "Light", value: "mapbox://styles/mapbox/light-v11" },
    {
      label: "Dark",
      value: "mapbox://styles/mapbox/dark-v11",
    },
    {
      label: "Satellite",
      value: "mapbox://styles/mapbox/satellite-streets-v12",
    },
    {
      label: "Traffic Day",
      value: "mapbox://styles/mapbox/navigation-day-v1",
    },
    {
      label: "Traffic Night",
      value: "mapbox://styles/mapbox/navigation-night-v1",
    },
  ];

  const [selectedStyle, setSelectedStyle] = useState(mapStyles[0].value);
  const handleStyleChange = (event) => {
    setSelectedStyle(event.target.value);
  };
  // auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  // cursor state
  const [cursor, setCursor] = useState("auto");
  const onMouseEnter = useCallback(() => setCursor("pointer"), []);
  const onMouseLeave = useCallback(() => setCursor("auto"), []);

  const [locationEntries, setLocationEntries] = useState([]);
  const [popupInfo, setPopupInfo] = useState({});

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // mapbox-gl-directions api state
  const [directionsEnabled, setDirectionsEnabled] = useState(false);
  const mapRef = useRef(null);
  const directionsRef = useRef(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [waypoints, setWaypoints] = useState([]);

  // track marker selection state
  const [selectedMarkers, setSelectedMarkers] = useState([]);

  const [isEditing, setIsEditing] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");

  // Function to handle title change
  const handleTitleChange = (e, id) => {
    if (id === isEditing) {
      setEditedTitle(e.target.value);
    }
  };

  // Function to save the edited title
  const saveEditedTitle = async (entryId, newTitle) => {
    try {
      await updatePointOfInterest(entryId, newTitle);
      setLocationEntries(
        locationEntries.map((entry) =>
          entry._id === entryId ? { ...entry, title: newTitle } : entry
        )
      );
      setIsEditing(null);
      setEditedTitle("");
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  // handle user logic
  const handleSignIn = (token) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setLocationEntries([]);
    setIsAuthenticated(false);
    setShowConfirmModal(false);
    setShowProfileModal(false);
    setDirectionsEnabled(false);
    resetAllLocations();
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      const userId = decoded.id;
      try {
        const success = await deleteUser(userId);
        if (success) {
          handleSignOut();
        }
      } catch (error) {
        console.error("Error deleting account:", error.message);
      }
    }
  };

  // add MapboxDirections control
  if (!directionsRef.current) {
    directionsRef.current = new MapboxDirections({
      accessToken: process.env.REACT_APP_MAPBOX_TOKEN,
      unit: "metric",
      profile: "mapbox/driving",
      interactive: false,
      congestion: true,
      controls: { inputs: false },
    });
  }

  const getEntries = async () => {
    const pointEntries = await listPointOfInterests();
    setLocationEntries(pointEntries);
  };

  const getCurrentUser = async (userId) => {
    const user = await getUser(userId);
    setUser(user);
  };

  // used to reset selections on map
  const resetAllLocations = () => {
    if (directionsRef.current) {
      directionsRef.current.removeRoutes();
    }
    setOrigin(null);
    setDestination(null);
    setWaypoints([]);
    setSelectedMarkers([]);
  };

  // list location entries upon login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      getEntries();
    }
    if (isAuthenticated) {
      const decoded = jwtDecode(token);
      const userId = decoded.id;
      getCurrentUser(userId);
    }
  }, [isAuthenticated]);

  // change mode based on toggle
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();

      if (directionsEnabled) {
        if (!map.hasControl(directionsRef.current)) {
          map.addControl(directionsRef.current, "top-left");
          resetAllLocations();
        }
      } else {
        if (map.hasControl(directionsRef.current)) {
          map.removeControl(directionsRef.current);
          resetAllLocations();
          setSelectedMarkers([]);
        }
      }
    }
  }, [directionsEnabled]);

  // sidebar toggle
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.resize();
    }
  }, [directionsEnabled]);

  // recalculate route with updates
  useEffect(() => {
    if (!directionsRef.current || !origin) return;
    directionsRef.current.removeRoutes();
    if (origin) {
      directionsRef.current.setOrigin(origin.coordinates);
    }
    if (destination) {
      directionsRef.current.setDestination(destination.coordinates);
    }
    waypoints.forEach((wp, index) => {
      if (wp && wp.coordinates) {
        directionsRef.current.addWaypoint(index, wp.coordinates);
      }
    });

    const map = mapRef.current.getMap();
    if (origin && destination) {
      let bounds = new LngLatBounds();
      [origin, destination, ...waypoints].forEach((point) => {
        if (point && point.coordinates) {
          bounds.extend(point.coordinates);
        }
      });

      map.fitBounds(bounds, {
        padding: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
        duration: 2000,
      });
    }
  }, [destination, origin, waypoints]);

  const removeWaypoint = (indexToRemove) => {
    const waypointToRemove = waypoints[indexToRemove];
    if (waypointToRemove) {
      setSelectedMarkers(
        selectedMarkers.filter((id) => id !== waypointToRemove._id)
      );
      setWaypoints(waypoints.filter((_, index) => index !== indexToRemove));
    }
  };

  const removeOrigin = () => {
    if (origin) {
      setSelectedMarkers(selectedMarkers.filter((id) => id !== origin._id));
      setOrigin(null);
      if (directionsRef.current) {
        directionsRef.current.removeRoutes();
      }
    }
  };

  const removeDestination = () => {
    if (destination) {
      setSelectedMarkers(
        selectedMarkers.filter((id) => id !== destination._id)
      );
      setDestination(null);
      if (directionsRef.current) {
        directionsRef.current.removeRoutes();
      }
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(waypoints);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWaypoints(items);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <AuthPage onSignIn={handleSignIn} />
      ) : (
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          style={{
            width: directionsEnabled ? "80vw" : "100vw",
            height: "100vh",
            position: "absolute",
            left: directionsEnabled ? "20vw" : "0px",
          }}
          mapStyle={selectedStyle}
          attributionControl={false}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          cursor={cursor}
        >
          {directionsEnabled ? null : (
            <GeocoderControl
              mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
              directionsEnabled={directionsEnabled}
              position="top-left"
              getEntries={getEntries}
            />
          )}

          <AttributionControl
            customAttribution="App by LocalBinNotFound, Xiyuan Tu, Airline-Wuhu, Antonyyqr"
            position="bottom-right"
          />
          <GeolocateControl />
          <FullscreenControl />
          <NavigationControl />
          <ScaleControl />

          <select
            onChange={handleStyleChange}
            value={selectedStyle}
            style={{
              position: "absolute",
              top: 10,
              right: 90,
              padding: "5px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              background: "rgba(255, 255, 255, 0.8)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              cursor: "pointer",
              outline: "none",
              zIndex: 1,
            }}
          >
            {mapStyles.map((style) => (
              <option key={style.label} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>

          <div
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: "10px 20px",
              borderRadius: "20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                marginRight: "10px",
                fontSize: "18px",
                color: "#333",
                textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              AI Trip Planner
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={directionsEnabled}
                onChange={() => setDirectionsEnabled(!directionsEnabled)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {Array.isArray(locationEntries) &&
            locationEntries.map(
              (entry) =>
                !selectedMarkers.includes(entry._id) && (
                  <React.Fragment key={entry._id}>
                    <Marker
                      longitude={entry.longitude}
                      latitude={entry.latitude}
                      offset={[0, -40]}
                      anchor="top"
                      onClick={() => {
                        if (!directionsEnabled) {
                          setPopupInfo({
                            ...popupInfo,
                            [entry._id]: true,
                          });
                          return;
                        }

                        const point = {
                          _id: entry._id,
                          name: entry.title,
                          coordinates: [entry.longitude, entry.latitude],
                          address: entry.address,
                        };

                        if (!origin) {
                          setOrigin(point);
                          setSelectedMarkers([...selectedMarkers, entry._id]);
                        } else if (!destination) {
                          setDestination(point);
                          setSelectedMarkers([...selectedMarkers, entry._id]);
                        } else {
                          setWaypoints([...waypoints, point]);
                          setSelectedMarkers([...selectedMarkers, entry._id]);
                        }
                      }}
                    ></Marker>
                    {popupInfo[entry._id] && !directionsEnabled ? (
                      <Popup
                        longitude={Number(entry.longitude)}
                        latitude={Number(entry.latitude)}
                        closeButton={true}
                        closeOnClick={true}
                        dynamicPosition={true}
                        focusAfterOpen={true}
                        onClose={() =>
                          setPopupInfo({
                            ...popupInfo,
                            [entry._id]: false,
                          })
                        }
                        anchor="top"
                        maxWidth="600px"
                      >
                        <div className="popup card ">
                          <div className="card-body">
                            {isEditing === entry._id ? (
                              <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) =>
                                  handleTitleChange(e, entry._id)
                                }
                                onBlur={() =>
                                  saveEditedTitle(entry._id, editedTitle)
                                }
                                className="form-control"
                              />
                            ) : (
                              <h5 className="card-title">
                                {entry.title}
                                <i
                                  className="fas fa-pencil-alt"
                                  style={{
                                    marginLeft: "10px",
                                    cursor: "pointer",
                                  }}
                                  onClick={() => {
                                    setIsEditing(entry._id);
                                    setEditedTitle(entry.title);
                                  }}
                                />
                              </h5>
                            )}

                            {entry.address && (
                              <p className="card-text">
                                Address: {entry.address}
                              </p>
                            )}
                            {entry.category && (
                              <p className="card-text">
                                Category: {entry.category}
                              </p>
                            )}
                            {entry.imageURL && (
                              <div
                                className="image-container mb-4"
                                style={{
                                  maxWidth: "600px",
                                  height: "300px",
                                  overflow: "hidden",
                                }}
                              >
                                <img
                                  src={entry.imageURL}
                                  alt="Location"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                  }}
                                />
                              </div>
                            )}
                            <div
                              className="delete-container"
                              style={{ textAlign: "right" }}
                            >
                              <button
                                className="btn btn-outline-danger btn-sm"
                                style={{ padding: "0.25rem 0.5rem" }}
                                onClick={async () => {
                                  // Add your confirmation logic here
                                  const confirmDeletion = window.confirm(
                                    "Are you sure you want to delete this?"
                                  );
                                  if (confirmDeletion) {
                                    const success = await deletePointOfInterest(
                                      entry._id
                                    );
                                    if (success) {
                                      await getEntries();
                                    }
                                  }
                                }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    ) : null}
                  </React.Fragment>
                )
            )}

          <Profile
            show={showProfileModal}
            handleClose={() => setShowProfileModal(false)}
            user={user}
            setUser={setUser}
            showConfirmModal={showConfirmModal}
            setShowConfirmModal={setShowConfirmModal}
            locationEntries={locationEntries}
            handleDeleteAccount={handleDeleteAccount}
            handleSignOut={handleSignOut}
          />
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>Profile</Tooltip>}
          >
            <button
              style={{
                position: "absolute",
                top: 10,
                right: 50,
                padding: 0,
                height: 29,
                width: 29,
                backgroundColor: "white",
              }}
              onClick={() => setShowProfileModal(true)}
              className="btn"
            >
              <CgProfile style={{ height: 20, width: 20 }} />
            </button>
          </OverlayTrigger>
        </Map>
      )}

      {directionsEnabled && (
        <div
          className="sidebar bg-light p-3 gradient-background"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "20vw",
            height: "100%",
            overflowY: "auto",
          }}
        >
          <h2 className="text-center mb-4">AI Trip Planner</h2>
          <p>Follow these steps to plan your trip:</p>
          <ul className="list-group list-group-flush mb-4">
            <li className="list-inline-item">
              <i className="fas fa-map-marker-alt"></i> Choose your{" "}
              <strong>origin</strong> marker.
            </li>
            <li className="list-inline-item">
              <i className="fas fa-map-marker-alt"></i> Choose your{" "}
              <strong>destination</strong> marker.
            </li>
            <li className="list-inline-item">
              <i className="fas fa-map-marker-alt"></i> Add any{" "}
              <strong>waypoints</strong> you wish to include in your route.
            </li>
            <li className="list-inline-item">
              <i className="fas fa-hand-pointer"></i> Adjust{" "}
              <strong>waypoints</strong> as necessary by dragging and dropping.
            </li>
            <li className="list-inline-item">
              <i className="fas fa-mouse-pointer"></i> Click on "
              <strong>AI Recommendations</strong>" to generate your travel plan.
            </li>
          </ul>
          <div className="card mb-3">
            <div className="card-header">Origin</div>
            <div className="card-body d-flex justify-content-between align-items-center">
              {origin ? (
                <>
                  <p className="mb-0 text-dark">{origin.name}</p>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removeOrigin()}
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                </>
              ) : (
                <p className="text-danger">NOT SELECTED</p>
              )}
            </div>
          </div>
          <div className="card mb-3">
            <div className="card-header">Waypoints</div>
            <div className="card-body">
              {waypoints && waypoints.length > 0 ? (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="waypoints">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {waypoints.map((wp, index) => (
                          <Draggable
                            key={wp._id}
                            draggableId={wp._id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="d-flex justify-content-between align-items-center mb-2"
                              >
                                <i
                                  className="fas fa-grip-vertical"
                                  style={{ paddingRight: "10px" }}
                                ></i>
                                <p className="mb-0 text-dark flex-grow-1">
                                  {wp.name}
                                </p>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => removeWaypoint(index)}
                                >
                                  <i className="fas fa-minus"></i>
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <p className="text-danger">NOT SELECTED</p>
              )}
            </div>
          </div>
          <div className="card mb-3">
            <div className="card-header">Destination</div>
            <div className="card-body d-flex justify-content-between align-items-center">
              {destination ? (
                <>
                  <p className="mb-0 text-dark">{destination.name}</p>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removeDestination()}
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                </>
              ) : (
                <p className="text-danger">NOT SELECTED</p>
              )}
            </div>
          </div>
          <ChatbotApp
            origin={origin}
            destination={destination}
            waypointSetter={[waypoints, setWaypoints]}
          />

          <div className="clear-button-container text-center">
            <button
              onClick={resetAllLocations}
              className="btn btn-danger btn-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
