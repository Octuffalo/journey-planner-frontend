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

const ItineraryMap = ({ callingPoints }) => {
  // Build a unified list of valid calling points with coordinates
  const geoPoints = callingPoints
    .map(cp => {
      const coords = stationCoords[cp.locationName];
      return coords ? { ...cp, ...coords } : null;
    })
    .filter(Boolean);

  if (geoPoints.length === 0) {
    return <p className="text-sm text-gray-500">No map available.</p>;
  }

  const bounds = geoPoints.map(p => [p.lat, p.lng]);

  return (
    <MapContainer
      bounds={bounds}
      style={{ height: '250px', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
      scrollWheelZoom={false}
      zoomControl={false}
      dragging={false}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <Polyline positions={bounds} color="#2e60f5" weight={4} />

      {geoPoints.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lng]}
          icon={L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          })}
        >
          <Tooltip>{p.locationName}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ItineraryMap;