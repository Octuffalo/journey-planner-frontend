import stations from '../data/stations.json';

export function getCoordsByStationName(name) {
  const match = stations.find(
    s => s.stationName.toLowerCase() === name.toLowerCase()
  );
  return match
    ? { lat: parseFloat(match.latitude), lng: parseFloat(match.longitude) }
    : null;
}