import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import stations from '../data/stations.json';

// Map station names to coordinates
const stationCoords = stations.reduce((acc, station) => {
  acc[station.stationName] = {
    lat: parseFloat(station.latitude),
    lng: parseFloat(station.longitude),
  };
  return acc;
}, {});

const ItineraryMap = ({ legs }) => {
  // Flatten calling points across legs and map to coordinates
  const coords = legs
    .flatMap((leg) => leg.callingPoints)
    .map((cp) => stationCoords[cp.locationName])
    .filter(Boolean); // remove any undefined entries

  if (coords.length === 0) {
    return <p className="text-sm text-gray-500">No map available.</p>;
  }

  return (
    <MapContainer
      bounds={coords.map((p) => [p.lat, p.lng])}
      boundsOptions={{ padding: [50, 50] }} // ✅ Zooms out to fit markers better
      style={{
        height: '200px',
        width: '100%',
        borderRadius: '0.5rem',
        zIndex: 0,
      }}
      scrollWheelZoom={false}
      zoomControl={false}
      dragging={false}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <Polyline positions={coords.map((p) => [p.lat, p.lng])} color="#2e60f5" weight={4} />

      {coords.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lng]}
          icon={L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconAnchor: [12, 41], // ✅ Anchor the bottom of the pin to the point
          })}
        >
          <Tooltip>{legs.flatMap((leg) => leg.callingPoints)[i]?.locationName}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ItineraryMap;