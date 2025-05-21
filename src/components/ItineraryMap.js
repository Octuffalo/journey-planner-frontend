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
  // Merging all callingPoints across legs if provided
  const allCallingPoints = legs
    ? legs.flatMap((leg) => leg.callingPoints || [])
    : callingPoints || [];

  const points = allCallingPoints
    .map((p) => stationCoords[p.locationName])
    .filter(Boolean);

  if (points.length === 0)
    return <p className="text-sm text-gray-500">No map available.</p>;

  const bounds = points.map((p) => [p.lat, p.lng]);
  const polyline = bounds;

  return (
    <MapContainer
      bounds={bounds}
      style={{
        height: '300px',
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

      <Polyline positions={polyline} color="#2e60f5" weight={4} />

      {points.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lng]}
          icon={L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          })}
        >
          <Tooltip>{allCallingPoints[i]?.locationName || 'Stop'}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ItineraryMap;