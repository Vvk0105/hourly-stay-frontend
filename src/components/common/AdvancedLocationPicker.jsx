import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Fix icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Search Component
const SearchField = ({ provider }) => {
    const map = useMap();

    useEffect(() => {
        const searchControl = new GeoSearchControl({
            provider: provider,
            style: 'bar',
            showMarker: false, // We use our own center marker
            keepResult: true,
        });

        map.addControl(searchControl);
        return () => map.removeControl(searchControl);
    }, [map, provider]);

    return null;
};

const CenterMarker = ({ onCenterChange }) => {
    const map = useMap();
    const [position, setPosition] = useState(map.getCenter());
    const lastSentRef = useRef(null);

    useEffect(() => {
        const onMove = () => {
            const center = map.getCenter();
            setPosition(center);

            // 🔒 Prevent infinite loop
            const last = lastSentRef.current;
            if (
                !last ||
                last.lat !== center.lat ||
                last.lng !== center.lng
            ) {
                lastSentRef.current = {
                    lat: center.lat,
                    lng: center.lng
                };
                onCenterChange(center);
            }
        };

        map.on('moveend', onMove); 
        return () => map.off('moveend', onMove);
    }, [map, onCenterChange]);

    return <Marker position={position} interactive={false} />;
};


const AdvancedLocationPicker = ({ initialLat, initialLng, onLocationSelect }) => {
    const provider = new OpenStreetMapProvider();

    // Default to Bangalore if no init
    const center = (initialLat && initialLng)
        ? [initialLat, initialLng]
        : [12.9716, 77.5946];

    return (
        <div style={{ height: '400px', width: '100%', position: 'relative' }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <SearchField provider={provider} />
                <CenterMarker onCenterChange={(latlng) => onLocationSelect({ lat: Number(latlng.lat.toFixed(6)),   lng: Number(latlng.lng.toFixed(6)) })} />
            </MapContainer>
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -100%)', // Anchor at bottom center
                zIndex: 1000,
                pointerEvents: 'none' // Let clicks pass through to map? No, marker is visual.
            }}>
                {/* Visual indicator handled by CenterMarker, but we could add a custom UI element here if we wanted a static crosshair */}
            </div>
        </div>
    );
};

export default AdvancedLocationPicker;
