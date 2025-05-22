import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import stations from '../data/stations.json';

const stationCoords = stations.reduce((acc, station) => {
  acc[station.stationName] = {
    lat: parseFloat(station.latitude),
    lng: parseFloat(station.longitude),
  };
  return acc;
}, {});

const ItineraryMap = ({ callingPoints, legs }) => {
  // Merge calling points from multiple legs if provided
  const allPoints = callingPoints
    || (legs ? legs.flatMap((leg) => leg.callingPoints || []) : []);

  const coords = allPoints
    .map((cp) => stationCoords[cp.locationName])
    .filter(Boolean);

  if (coords.length === 0) return <p className="text-sm text-gray-500">No map available.</p>;

  return (
    <MapContainer
      bounds={coords.map((p) => [p.lat, p.lng])}
      style={{
        height: '400px',
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

      <Polyline
        positions={coords.map((p) => [p.lat, p.lng])}
        color="#2e60f5"
        weight={4}
      />

      {coords.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lng]}
          icon={L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            shadowSize: [41, 41],
            shadowAnchor: [12, 41],
          })}
        >
          <Tooltip offset={[0, -30]}>
            {allPoints[i].locationName}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ItineraryMap;