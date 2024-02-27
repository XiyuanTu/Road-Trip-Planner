import React, { useState } from 'react';
import { useControl, Marker, Popup } from 'react-map-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { createPointOfInterest } from './API/pointOfInterestAPI';

export default function GeocoderControl(props) {
    const { getEntries } = props
    const [marker, setMarker] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const addToMyList = async () => {
        const latitude = marker.props.latitude
        const longitude = marker.props.longitude
        const title = selectedLocation.text
        await createPointOfInterest({ title, latitude, longitude, description: "" })
        setMarker(null);
        setShowPopup(false);
        getEntries();
    };

    const geocoder = useControl(() => {
        const ctrl = new MapboxGeocoder({
            ...props,
            marker: false,
            accessToken: props.mapboxAccessToken
        });
        ctrl.on('loading', props.onLoading);
        ctrl.on('results', props.onResults);
        ctrl.on('result', evt => {
            props.onResult(evt);

            const { result } = evt;
            const location =
                result &&
                (result.center || (result.geometry?.type === 'Point' && result.geometry.coordinates));
            if (location && props.marker) {
                console.log(result);
                setMarker(null);
                setMarker(<Marker
                    {...props.marker}
                    offset={[0, -40]}
                    anchor="top"
                    longitude={location[0]}
                    latitude={location[1]} />);
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
                    anchor="top"
                    onClose={() => {
                        setShowPopup(false);
                        setMarker(null);
                    }}
                >
                    <div>
                        <h5>{selectedLocation.text}</h5>
                        <p>Address: {selectedLocation.place_name}</p>
                        <button className="btn btn-primary btn-sm" onClick={addToMyList}>Add to Destinations</button>
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
