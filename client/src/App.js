import React, { useState, useEffect, useCallback, useRef } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';

import Map, {
    Marker,
    Popup,
    NavigationControl,
    FullscreenControl,
    ScaleControl,
    GeolocateControl,
    AttributionControl
} from 'react-map-gl';

import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";

import { listPointOfInterests, deletePointOfInterest } from "./API/pointOfInterestAPI";
import { deleteUser } from "./API/userAPI";
import ConfirmationModal from './API/confirmation-modal';

import AuthPage from './forms/auth-page';

import GeocoderControl from './geocoder-control';

import { jwtDecode } from "jwt-decode";

const App = () => {
    const [viewState, setViewState] = React.useState({
        longitude: -100.6,
        latitude: 37.6,
        zoom: 5,
    });

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
    const [pickOrigin, setPickOrigin] = useState(true);
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [waypoints, setWaypoints] = useState(null);

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
        resetDirections();
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
            accessToken: process.env.REACT_APP_MAPBOX_TOKEN,
            unit: 'metric',
            profile: 'mapbox/driving',
            interactive: false //disable the default point picking behavior. Need to refresh to see the change
        });
    }

    const getEntries = async () => {
        const pointEntries = await listPointOfInterests();
        setLocationEntries(pointEntries);
    }

    const resetDirections = () => {
        if (directionsRef.current) {
            directionsRef.current.removeRoutes();
        }
        setPickOrigin(true);
        setOrigin(null);
        setDestination(null);
        setWaypoints(null);
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
                    resetDirections();
                }
            } else {
                if (map.hasControl(directionsRef.current)) {
                    map.removeControl(directionsRef.current);
                    resetDirections();
                }
            }
        }
    }, [directionsEnabled]);

    useEffect(() => {
        setShowSidebar(directionsEnabled);
    }, [directionsEnabled]);

    return (
        <div>
            {!isAuthenticated ? (<AuthPage onSignIn={handleSignIn} />) : (
                <Map
                    ref={mapRef}
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                    style={{
                        width: showSidebar ? 'calc(100vw - 300px)' : '100vw',
                        height: '100vh',
                        position: 'absolute',
                        left: showSidebar ? '300px' : '0px',}}
                    mapStyle="mapbox://styles/junjiefang1996/clr9men5i000v01oca04nhrbz"
                    attributionControl={false}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    cursor={cursor}
                >
                    {directionsEnabled ? null :
                            <GeocoderControl
                                mapboxAccessToken={ process.env.REACT_APP_MAPBOX_TOKEN }
                                directionsEnabled={ directionsEnabled }
                                position="top-left"
                                getEntries={ getEntries }/>}

                    <AttributionControl
                        customAttribution="Map design by LocalBinNotFound, Xiyuan Tu, Airline-Wuhu, Antonyyqr"
                        position="bottom-right"/>
                    <GeolocateControl/>
                    <FullscreenControl/>
                    <NavigationControl/>
                    <ScaleControl/>

                    <div style={{
                        position: 'absolute',
                        top: showSidebar ? 150 : 70,
                        left: 10,
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <span style={{
                            marginRight: '10px',
                            fontSize: '18px',
                            color: 'white',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                        }}>Plan Your Trip!</span>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={directionsEnabled}
                                onChange={() => setDirectionsEnabled(!directionsEnabled)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {Array.isArray(locationEntries) && locationEntries.map(entry => (
                        <React.Fragment key={entry._id}>
                            <Marker
                                longitude={entry.longitude}
                                latitude={entry.latitude}
                                offset={[0, -40]}
                                anchor="top"
                                onClick={() => {
                                    if (directionsEnabled) {
                                        if (!pickOrigin) {
                                            directionsRef.current = directionsRef.current.setDestination(entry.address);
                                            setDestination({ name: entry.title, coordinates: [entry.longitude, entry.latitude] });
                                        } else {
                                            directionsRef.current = directionsRef.current.setOrigin(entry.address);
                                            setOrigin({name: entry.title, coordinates: [entry.longitude, entry.latitude]});
                                            setPickOrigin(false);
                                        }
                                    } else {
                                        setPopupInfo({
                                            ...popupInfo,
                                            [entry._id]: true,
                                        })
                                    }
                                }
                                }
                            >
                            </Marker>
                            {
                                popupInfo[entry._id] && !directionsEnabled ? (
                                    <Popup
                                        longitude={Number(entry.longitude)}
                                        latitude={Number(entry.latitude)}
                                        closeButton={true}
                                        closeOnClick={true}
                                        dynamicPosition={true}
                                        focusAfterOpen={true}
                                        onClose={() => setPopupInfo({
                                            ...popupInfo,
                                            [entry._id]: false,
                                        })}
                                        anchor="top"
                                        maxWidth="800px"
                                    >
                                        <div className="popup card ">
                                            <div className="card-body">
                                                <h5 className="card-title">{entry.title}</h5>
                                                {entry.address &&
                                                    <p className="card-text">Address: {entry.address}</p>}
                                                {entry.category &&
                                                    <p className="card-text">Category: {entry.category}</p>}
                                                <div className="button-container d-flex justify-content-between">
                                                    <button className="btn btn-primary btn-sm">Update</button>
                                                    <button className="btn btn-danger btn-sm" onClick={async () => {
                                                        const success = await deletePointOfInterest(entry._id);
                                                        if (success) {
                                                            getEntries();
                                                        }
                                                    }}>Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                ) : null
                            }
                        </React.Fragment>
                    ))}

                    <button style={{position: 'absolute', bottom: 60, right: 15}}
                            className="btn btn-sm btn-primary btn-login text-uppercase fw-bold mb-2"
                            onClick={handleSignOut}>
                        Logout
                    </button>
                    <div>
                        <button
                            style={{position: 'absolute', bottom: 20, right: 15}}
                            onClick={() => setShowConfirmModal(true)}
                            className="btn btn-sm btn-primary btn-danger text-uppercase fw-bold mb-2">
                            Wipe Data
                        </button>
                        <ConfirmationModal
                            show={showConfirmModal}
                            handleClose={() => setShowConfirmModal(false)}
                            handleConfirm={handleDeleteAccount}
                            message="Are you sure you want to delete your account and all related data? This action cannot be undone."
                        />
                    </div>
                </Map>
            )}

            {showSidebar && (
                <div className="p-3" style={ {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '300px',
                    height: '100%',
                    overflowY: 'auto',
                    background: '#f9f9f9'
                } }>
                    <h2 className="text-center mb-4">AI Trip Planner</h2>
                    <div className="button-container mb-4">
                    <button onClick={ resetDirections } className="clear-origin-btn btn btn-primary btn-sm">Clear Selection
                    </button>
                    </div>
                    <div className="card mb-3">
                        <div className="card-header">Origin</div>
                        <div className="card-body">
                            { origin ? <p className="text-success">{ origin.name }</p> :
                                <p className="text-danger">NOT SELECTED</p> }
                        </div>
                    </div>
                    <div className="card mb-3">
                        <div className="card-header">Waypoints</div>
                        <div className="card-body">
                            { waypoints && waypoints.length > 0 ? waypoints.map((wp, index) => (
                                <p key={ index } className="list-group-item">{ wp.name }</p>
                            )) : <p className="list-group-item text-danger">NOT SELECTED</p> }
                        </div>
                    </div>
                    <div className="card mb-4">
                        <div className="card-header">Destination</div>
                        <div className="card-body">
                            { destination ? <p className="text-success">{ destination.name }</p> :
                                <p className="text-danger">NOT SELECTED</p> }
                        </div>
                    </div>
                    <button className="btn btn-info w-100">Confirm Route</button>
                </div>
            ) }
        </div>
    );
};

export default App;