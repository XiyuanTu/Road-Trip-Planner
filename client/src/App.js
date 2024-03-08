import React, {useState, useEffect, useCallback, useRef} from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';

import Map, {
    Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, GeolocateControl, AttributionControl
} from 'react-map-gl';

import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";

import {listPointOfInterests, deletePointOfInterest} from "./API/pointOfInterestAPI";
import {deleteUser} from "./API/userAPI";
import ConfirmationModal from './API/confirmation-modal';

import AuthPage from './forms/auth-page';

import GeocoderControl from './geocoder-control';

import {jwtDecode} from "jwt-decode";

import ChatbotApp from './ChatbotApp.js';

const App = () => {
    const [viewState, setViewState] = React.useState({
        longitude : -100.6, latitude : 37.6, zoom : 5,
    });

    const mapStyles = [
        { label: "Streets", value: "mapbox://styles/mapbox/streets-v11" },
        { label: "Outdoors", value: "mapbox://styles/mapbox/outdoors-v11" },
        { label: "Light", value: "mapbox://styles/mapbox/light-v10" },
        { label: "Dark", value: "mapbox://styles/mapbox/dark-v10" },
        { label: "Satellite", value: "mapbox://styles/mapbox/satellite-v9" },
        { label: "Traffic", value: "mapbox://styles/junjiefang1996/clr9men5i000v01oca04nhrbz"}
    ];

    const [selectedStyle, setSelectedStyle] = useState(mapStyles[0].value);
    const handleStyleChange = (event) => {
        setSelectedStyle(event.target.value);
    };
    // auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // sidebar state
    const [showSidebar, setShowSidebar] = useState(false);

    // cursor state
    const [cursor, setCursor] = useState('auto');
    const onMouseEnter = useCallback(() => setCursor('pointer'), []);
    const onMouseLeave = useCallback(() => setCursor('auto'), []);

    const [locationEntries, setLocationEntries] = useState([]);
    const [popupInfo, setPopupInfo] = useState({});

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // mapbox-gl-directions api state
    const [directionsEnabled, setDirectionsEnabled] = useState(false);
    const mapRef = useRef(null);
    const directionsRef = useRef(null);
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [waypoints, setWaypoints] = useState([]);

    // track marker selection state
    const [selectedMarkers, setSelectedMarkers] = useState([]);

    // handle user logic
    const handleSignIn = (token) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
    };

    const handleSignOut = () => {
        localStorage.removeItem('token');
        setLocationEntries([]);
        setIsAuthenticated(false);
        setShowConfirmModal(false);
        setShowSidebar(false);
        setDirectionsEnabled(false);
        resetAllLocations();
    }

    const handleDeleteAccount = async () => {
        const token = localStorage.getItem('token');
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
            accessToken : process.env.REACT_APP_MAPBOX_TOKEN,
            unit : 'metric',
            profile : 'mapbox/driving',
            interactive : false,
            congestion : true,
            controls : {inputs : false},
        });
    }

    const getEntries = async () => {
        const pointEntries = await listPointOfInterests();
        setLocationEntries(pointEntries);
    }

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
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            getEntries();
        }
    }, [isAuthenticated]);

    // change mode based on toggle
    useEffect(() => {
        if (mapRef.current) {
            const map = mapRef.current.getMap();

            if (directionsEnabled) {
                if (!map.hasControl(directionsRef.current)) {
                    map.addControl(directionsRef.current, 'top-left');
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
        setShowSidebar(directionsEnabled);
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
    }, [destination, origin, waypoints]);

    const removeWaypoint = (indexToRemove) => {
        const waypointToRemove = waypoints[indexToRemove];
        if (waypointToRemove) {
            setSelectedMarkers(selectedMarkers.filter(id => id !== waypointToRemove._id));
            setWaypoints(waypoints.filter((_, index) => index !== indexToRemove));
        }
    }

    const removeOrigin = () => {
        if (origin) {
            setSelectedMarkers(selectedMarkers.filter(id => id !== origin._id));
            setOrigin(null);
            if (directionsRef.current) {
                directionsRef.current.removeRoutes();
            }
        }
    }

    const removeDestination = () => {
        if (destination) {
            setSelectedMarkers(selectedMarkers.filter(id => id !== destination._id));
            setDestination(null);
            if (directionsRef.current) {
                directionsRef.current.removeRoutes();
            }
        }
    }

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(waypoints);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setWaypoints(items);
    };

    return (<div>
        { !isAuthenticated ? (<AuthPage onSignIn={ handleSignIn }/>) : (<Map
            ref={ mapRef }
            { ...viewState }
            onMove={ evt => setViewState(evt.viewState) }
            mapboxAccessToken={ process.env.REACT_APP_MAPBOX_TOKEN }
            style={ {
                width : showSidebar ? 'calc(100vw - 350px)' : '100vw',
                height : '100vh',
                position : 'absolute',
                left : showSidebar ? '350px' : '0px',
            } }
            mapStyle={ selectedStyle }
            attributionControl={ false }
            onMouseEnter={ onMouseEnter }
            onMouseLeave={ onMouseLeave }
            cursor={ cursor }
        >
            { directionsEnabled ? null : <GeocoderControl
                mapboxAccessToken={ process.env.REACT_APP_MAPBOX_TOKEN }
                directionsEnabled={ directionsEnabled }
                position="top-left"
                getEntries={ getEntries }/> }

            <AttributionControl
                customAttribution="Map design by LocalBinNotFound, Xiyuan Tu, Airline-Wuhu, Antonyyqr"
                position="bottom-right"/>
            <GeolocateControl/>
            <FullscreenControl/>
            <NavigationControl/>
            <ScaleControl/>

            <select
                onChange={ handleStyleChange }
                value={ selectedStyle }
                style={ {
                    position : 'absolute',
                    top : 185,
                    right : 10,
                    padding: '5px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    outline: 'none',
                    zIndex: 1,
                } }>
                { mapStyles.map(style => (<option key={ style.label } value={ style.value }>{ style.label }</option>)) }
            </select>

            <div style={ {
                position : 'absolute',
                top : 20,
                left : '50%',
                transform : 'translateX(-50%)',
                zIndex : 1,
                display : 'flex',
                alignItems : 'center',
                backgroundColor : 'rgba(255, 255, 255, 0.8)',
                padding : '10px 20px',
                borderRadius : '20px',
                boxShadow : '0 2px 4px rgba(0,0,0,0.3)',
            } }>
              <span style={ {
                  marginRight : '10px', fontSize : '18px', color : '#333', textShadow : '1px 1px 2px rgba(0,0,0,0.1)',
              } }>AI Trip Planner</span>
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={ directionsEnabled }
                        onChange={ () => setDirectionsEnabled(!directionsEnabled) }
                    />
                    <span className="slider round"></span>
                </label>
            </div>


            { Array.isArray(locationEntries) && locationEntries.map(entry => (!selectedMarkers.includes(entry._id) && (
                <React.Fragment key={ entry._id }>
                    <Marker
                        longitude={ entry.longitude }
                        latitude={ entry.latitude }
                        offset={ [0, -40] }
                        anchor="top"
                        onClick={ () => {
                            if (!directionsEnabled) {
                                setPopupInfo({
                                    ...popupInfo, [entry._id] : true,
                                });
                                return;
                            }

                            const point = {
                                _id : entry._id,
                                name : entry.title,
                                coordinates : [entry.longitude, entry.latitude],
                                address : entry.address
                            };

                            if (!origin) {
                                setOrigin(point);
                                setSelectedMarkers([...selectedMarkers, entry._id]);
                            } else
                                if (!destination) {
                                    setDestination(point);
                                    setSelectedMarkers([...selectedMarkers, entry._id]);
                                } else {
                                    setWaypoints([...waypoints, point]);
                                    setSelectedMarkers([...selectedMarkers, entry._id]);
                                }
                        } }

                    >
                    </Marker>
                    { popupInfo[entry._id] && !directionsEnabled ? (<Popup
                        longitude={ Number(entry.longitude) }
                        latitude={ Number(entry.latitude) }
                        closeButton={ true }
                        closeOnClick={ true }
                        dynamicPosition={ true }
                        focusAfterOpen={ true }
                        onClose={ () => setPopupInfo({
                            ...popupInfo, [entry._id] : false,
                        }) }
                        anchor="top"
                        maxWidth="800px"
                    >
                        <div className="popup card ">
                            <div className="card-body">
                                <h5 className="card-title">{ entry.title }</h5>
                                { entry.address && <p className="card-text">Address: { entry.address }</p> }
                                { entry.category && <p className="card-text">Category: { entry.category }</p> }
                                <div className="button-container d-flex justify-content-between">
                                    <button className="btn btn-primary btn-sm">Update</button>
                                    <button className="btn btn-danger btn-sm"
                                            onClick={ async () => {
                                                const success = await deletePointOfInterest(entry._id);
                                                if (success) {
                                                    await getEntries();
                                                }
                                            } }>Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Popup>) : null }
                </React.Fragment>))) }

            <button style={ {position : 'absolute', bottom : 60, right : 15} }
                    className="btn btn-sm btn-primary btn-login text-uppercase fw-bold mb-2"
                    onClick={ handleSignOut }>
                Logout
            </button>
            <div>
                <button
                    style={ {position : 'absolute', bottom : 20, right : 15} }
                    onClick={ () => setShowConfirmModal(true) }
                    className="btn btn-sm btn-primary btn-danger text-uppercase fw-bold mb-2">
                    Wipe Data
                </button>
                <ConfirmationModal
                    show={ showConfirmModal }
                    handleClose={ () => setShowConfirmModal(false) }
                    handleConfirm={ handleDeleteAccount }
                    message="Are you sure you want to delete your account and all related data? This action cannot be undone."
                />
            </div>
        </Map>) }

        { showSidebar && (<div className="sidebar bg-light p-3" style={ {
            position : 'absolute', top : 0, left : 0, width : '350px', height : '100%', overflowY : 'auto'
        } }>
            <h2 className="text-center mb-4">AI Trip Planner</h2>
            <p>Follow these steps to plan your trip:</p>
            <ul className="list-group list-group-flush mb-4">
                    <li className="list-inline-item"><i className="fas fa-map-marker-alt"></i> Choose your <strong>
                        origin</strong> marker.</li>
                    <li className="list-inline-item"><i className="fas fa-map-marker-alt"></i> Choose your <strong>
                        destination</strong> marker.</li>
                    <li className="list-inline-item"><i className="fas fa-map-marker-alt"></i> Add any <strong>
                        waypoints</strong> you wish to include in your route.</li>
                    <li className="list-inline-item"><i className="fas fa-hand-pointer"></i> Adjust <strong>waypoints
                    </strong> as necessary by dragging and dropping.</li>
                    <li className="list-inline-item"><i className="fas fa-mouse-pointer"></i> Click on "<strong>AI
                        Recommendations</strong>" to generate your travel plan.</li>
                </ul>
                <div className="card mb-3">
                    <div className="card-header">Origin</div>
                    <div className="card-body d-flex justify-content-between align-items-center">
                        { origin ? (<>
                                <p className="mb-0 text-dark">{ origin.name }</p>
                                <button className="btn btn-outline-danger btn-sm" onClick={ () => removeOrigin() }>
                                    <i className="fas fa-minus"></i>
                                </button>
                            </>) : <p className="text-danger">NOT SELECTED</p> }
                    </div>
                </div>
                <div className="card mb-3">
                    <div className="card-header">Waypoints</div>
                    <div className="card-body">
                        { waypoints && waypoints.length > 0 ?
                            <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="waypoints">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        {waypoints.map((wp, index) => (
                                            <Draggable key={wp._id} draggableId={wp._id} index={index}>
                                                {(provided) => (<div
                                                        ref={ provided.innerRef } { ...provided.draggableProps } { ...provided.dragHandleProps }
                                                        className="d-flex justify-content-between align-items-center mb-2">
                                                    <i className="fas fa-grip-vertical" style={{paddingRight: '10px'}}></i>
                                                    <p className="mb-0 text-dark flex-grow-1">{ wp.name }
                                                        </p>
                                                        <button className="btn btn-outline-danger btn-sm"
                                                                onClick={ () => removeWaypoint(index) }>
                                                            <i className="fas fa-minus"></i>
                                                        </button>
                                                    </div>)}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext> : <p className="text-danger">NOT SELECTED</p> }
                    </div>
                </div>
                <div className="card mb-4">
                    <div className="card-header">Destination</div>
                    <div className="card-body d-flex justify-content-between align-items-center">
                        { destination ? (<>
                                <p className="mb-0 text-dark">{ destination.name }</p>
                                <button className="btn btn-outline-danger btn-sm" onClick={ () => removeDestination() }>
                                    <i className="fas fa-minus"></i>
                                </button>
                            </>) : <p className="text-danger">NOT SELECTED</p> }
                    </div>
                </div>
                <ChatbotApp origin={origin} destination={destination} timeLength={10} waypointSetter={[waypoints, setWaypoints]}/>
                
                <div className="clear-button-container text-center">
                    <button onClick={ resetAllLocations } className="btn btn-danger btn-sm">Clear Selection</button>
                </div>
            </div>) }

    </div>);
};

export default App;