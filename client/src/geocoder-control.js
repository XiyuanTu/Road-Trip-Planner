import React, {useState} from 'react';
import {Marker, Popup, useControl} from 'react-map-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import {createPointOfInterest} from './API/pointOfInterestAPI';

export default function GeocoderControl(props) {
    const { getEntries } = props
    const [marker, setMarker] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [imageURL, setImageURL] = useState(null);

    const [additionalInfo, setAdditionalInfo] = useState({
        title: '',
        place_type: '',
        address: '',
        id: '',
        relevance: 0,
        category: '',
        landmark: false,
        wikidata: '',
    });

    const addToMyList = async () => {
        const latitude = marker.props.latitude;
        const longitude = marker.props.longitude;

        await createPointOfInterest({latitude, longitude, imageURL: imageURL, ...additionalInfo });
        setMarker(null);
        setShowPopup(false);
        setImageURL(null);
        getEntries();
    };

    const fetchWikidataImage = async (wikidataId) => {
        if (!wikidataId) return null;

        const url = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const entities = data.entities[wikidataId];
            if (!entities || !entities.claims || !entities.claims.P18) {
                return null;
            }

            const imageProperty = entities.claims.P18;
            const imageFileName = imageProperty[0].mainsnak.datavalue.value;
            return `https://commons.wikimedia.org/wiki/Special:FilePath/${ encodeURIComponent(imageFileName) }`;
        } catch (error) {
            console.error('Error fetching Wikidata image:', error);
            return null;
        }
    };

    const fetchFoursquarePhoto = async (fsqId) => {
        const API_KEY = process.env.REACT_APP_FOURSQUARE_API_KEY;
        const url = `https://api.foursquare.com/v3/places/${fsqId}/photos?sort=POPULAR`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': API_KEY
                }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                const firstPhoto = data[0];
                return `${ firstPhoto.prefix }original${ firstPhoto.suffix }`;
            }
        } catch (error) {
            console.error('Error fetching photo:', error);
        }
        return null;
    };

    const geocoder = useControl(() => {
        const ctrl = new MapboxGeocoder({
            ...props,
            marker: false,
            accessToken: props.mapboxAccessToken
        });
        ctrl.on('loading', props.onLoading);
        ctrl.on('results', props.onResults);
        ctrl.on('result', async evt => {
            props.onResult(evt);

            const {result} = evt;
            const location = result?.center || (result.geometry?.type === 'Point' && result.geometry.coordinates);
            if (result) {
                setAdditionalInfo({
                    title : result.text,
                    place_type : result.place_type[0],
                    address : result.place_name,
                    id : result.id,
                    relevance : result.relevance,
                    category : result.properties.category || '',
                    landmark : result.properties.landmark || false,
                    wikidata : result.properties.wikidata || '',
                    foursquare: result.properties.foursquare || '',
                });

                let fetchedImageUrl = null;
                if (result.properties.wikidata) {
                    fetchedImageUrl = await fetchWikidataImage(result.properties.wikidata);
                } else if (result.properties.foursquare) {
                    fetchedImageUrl = await fetchFoursquarePhoto(result.properties.foursquare);
                }
                setImageURL(fetchedImageUrl);
            }

            if (location && props.marker) {
                console.log(result);
                setMarker(null);
                setMarker(<Marker
                    { ...props.marker }
                    offset={ [0, -40] }
                    anchor="top"
                    longitude={ location[0] }
                    latitude={ location[1] }/>);
                setSelectedLocation(result);
                setShowPopup(true);
            } else {
                setMarker(null);
                setShowPopup(false);
            }
        });
        ctrl.on('error', props.onError);
        return ctrl;
    },
        {
            position: props.position
        }
    );

    if (geocoder._map) {
        if (geocoder.getProximity() !== props.proximity && props.proximity !== undefined) {
            geocoder.setProximity(props.proximity);
        }
        if (geocoder.getRenderFunction() !== props.render && props.render !== undefined) {
            geocoder.setRenderFunction(props.render);
        }
        if (geocoder.getLanguage() !== props.language && props.language !== undefined) {
            geocoder.setLanguage(props.language);
        }
        if (geocoder.getZoom() !== props.zoom && props.zoom !== undefined) {
            geocoder.setZoom(props.zoom);
        }
        if (geocoder.getFlyTo() !== props.flyTo && props.flyTo !== undefined) {
            geocoder.setFlyTo(props.flyTo);
        }
        if (geocoder.getPlaceholder() !== props.placeholder && props.placeholder !== undefined) {
            geocoder.setPlaceholder(props.placeholder);
        }
        if (geocoder.getCountries() !== props.countries && props.countries !== undefined) {
            geocoder.setCountries(props.countries);
        }
        if (geocoder.getTypes() !== props.types && props.types !== undefined) {
            geocoder.setTypes(props.types);
        }
        if (geocoder.getMinLength() !== props.minLength && props.minLength !== undefined) {
            geocoder.setMinLength(props.minLength);
        }
        if (geocoder.getLimit() !== props.limit && props.limit !== undefined) {
            geocoder.setLimit(props.limit);
        }
        if (geocoder.getFilter() !== props.filter && props.filter !== undefined) {
            geocoder.setFilter(props.filter);
        }
        if (geocoder.getOrigin() !== props.origin && props.origin !== undefined) {
            geocoder.setOrigin(props.origin);
        }
    }
    return (
        <>
            {marker}
            {showPopup && selectedLocation && (
                <Popup
                    longitude={selectedLocation.center[0]}
                    latitude={selectedLocation.center[1]}
                    closeButton={true}
                    closeOnClick={true}
                    dynamicPosition={true}
                    focusAfterOpen={true}
                    anchor="top"
                    maxWidth="600px"
                    onClose={() => {
                        setShowPopup(false);
                        setMarker(null);
                    }}
                >
                    <div className="popup card">
                        <div className="card-body">
                            <h5 className="card-title">{selectedLocation.text}</h5>
                            <p className="card-text">Address: {selectedLocation.place_name}</p>
                            {imageURL && (
                                <div className="image-container mb-4" style={{ maxWidth: '600px', height: '300px', overflow: 'hidden' }}>
                                    <img src={imageURL} alt="Location" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                            )}
                            <div className="button-container d-flex justify-content-between">
                                <button className="btn btn-primary btn-sm" onClick={addToMyList}>Add to Destinations</button>
                            </div>
                        </div>
                    </div>
                </Popup>
            )}
        </>
    );

}

const noop = () => {
};

GeocoderControl.defaultProps = {
    marker: true,
    onLoading: noop,
    onResults: noop,
    onResult: noop,
    onError: noop
};
