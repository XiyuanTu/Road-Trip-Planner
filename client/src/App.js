import React, { useState, useEffect, useCallback } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import Map, {
    Marker,
    Popup,
    NavigationControl,
    FullscreenControl,
    ScaleControl,
    GeolocateControl,
    AttributionControl
} from 'react-map-gl';

import { listPointOfInterests, deletePointOfInterest } from "./API/pointOfInterestAPI";
import { deleteUser } from "./API/userAPI";
import ConfirmationModal from './API/confirmation-modal';

import AuthPage from './forms/auth-page';

import GeocoderControl from './geocoder-control';

import { jwtDecode } from "jwt-decode";

import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: "travel-log-and-planner.firebaseapp.com",
    projectId: "travel-log-and-planner",
    storageBucket: "travel-log-and-planner.appspot.com",
    messagingSenderId: "913884825153",
    appId: "1:913884825153:web:dad3ef0616385c2ae5a8c0",
    measurementId: "G-173PCE5BBC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const App = () => {
    const [viewState, setViewState] = React.useState({
        longitude: -100.6,
        latitude: 37.6,
        zoom: 5,
        bearing: 0,
        pitch: 0
    });

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [cursor, setCursor] = useState('auto');
    const onMouseEnter = useCallback(() => setCursor('pointer'), []);
    const onMouseLeave = useCallback(() => setCursor('auto'), []);

    const [logEntries, setLogEntries] = useState([]);
    const [popupInfo, setPopupInfo] = useState({});
    const [addEntryLocation, setAddEntryLocation] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const getEntries = async () => {
        const logEntries = await listPointOfInterests();
        setLogEntries(logEntries);
    }

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            getEntries();
        }
    }, [isAuthenticated]);

    const showAddMarkerPopup = (event) => {
        event.preventDefault();

        const latitude = event.lngLat.lat;
        const longitude = event.lngLat.lng;
        setAddEntryLocation({
            latitude,
            longitude,
        })
    }

    const handleSignIn = (token) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
    };

    const handleSignOut = () => {
        localStorage.removeItem('token');
        setLogEntries([]);
        setIsAuthenticated(false);
        setShowConfirmModal(false);
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

    return (
        <div>
            {!isAuthenticated ? (<AuthPage onSignIn={handleSignIn} />) : (
                <Map
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                    style={{ width: '100vw', height: '100vh' }}
                    mapStyle="mapbox://styles/junjiefang1996/clr9men5i000v01oca04nhrbz"
                    attributionControl={false}
                    onContextMenu={showAddMarkerPopup}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    cursor={cursor}
                >
                    <GeocoderControl mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN} position="top-left" />
                    <AttributionControl customAttribution="Map design by LocalBinNotFound" position="bottom-right" />
                    <GeolocateControl />
                    <FullscreenControl />
                    <NavigationControl />
                    <ScaleControl />

                    {Array.isArray(logEntries) && logEntries.map(entry => (
                        <React.Fragment key={entry._id}>
                            <Marker
                                longitude={entry.longitude}
                                latitude={entry.latitude}
                                offset={[0, -40]}
                                anchor="top"
                                onClick={() => setPopupInfo({
                                    ...popupInfo,
                                    [entry._id]: true,
                                })}
                            >
                            </Marker>
                            {
                                popupInfo[entry._id] ? (
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
                                                {entry.description &&
                                                    <p className="card-text">Description: {entry.description}</p>}
                                                {entry.comments &&
                                                    <p className="card-text">Comments: {entry.comments}</p>}

                                                {entry.image && <img src={entry.image} alt={entry.title}
                                                    className="img-fluid my-2" />}
                                                <small className="text-muted">Visited
                                                    on: {new Date(entry.visitDate).toLocaleDateString()}</small>
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
                    {
                        addEntryLocation ? (
                            <>
                                <Marker
                                    longitude={addEntryLocation.longitude}
                                    latitude={addEntryLocation.latitude}
                                    offset={[0, -40]}
                                    anchor="top"
                                >
                                </Marker>

                            </>
                        ) : null
                    }
                    <button style={{ position: 'absolute', bottom: 60, right: 15 }}
                        className="btn btn-sm btn-primary btn-login text-uppercase fw-bold mb-2"
                        onClick={handleSignOut}>
                        Logout
                    </button>
                    <div>
                        <button
                            style={{ position: 'absolute', bottom: 20, right: 15 }}
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
        </div>
    );
};

export default App;