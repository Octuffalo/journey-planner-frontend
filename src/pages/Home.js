import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import stations from '../data/stations.json';
import TrainCard from '../components/TrainCard';
import RouteDetails from '../components/RouteDetails';
import PlacesModal from '../components/PlacesModal';
import Fuse from 'fuse.js';

function Home() {
  const [stationInput, setStationInput] = useState('');
  const [selectedCrs, setSelectedCrs] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [departures, setDepartures] = useState([]);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStationName, setSelectedStationName] = useState(null);

  const detailsRef = useRef(null);
  const suggestionsRef = useRef();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const fuse = new Fuse(stations, {
    keys: ['stationName'],
    threshold: 0.3,
    includeScore: true,
  });

  useEffect(() => {
    const loaded = localStorage.getItem('loadedItinerary');
    if (loaded) {
      const data = JSON.parse(loaded);
      setDetails(data);
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      localStorage.removeItem('loadedItinerary');
    }
  }, []);

  useEffect(() => {
    if (stationInput.trim() === '') {
      setSuggestions([]);
      setHighlightedIndex(-1);
      return;
    }
    const results = fuse.search(stationInput).map(r => r.item);
    setSuggestions(results.slice(0, 8));
    setHighlightedIndex(-1);
  }, [stationInput]);

  const handleStationSelect = (station) => {
    setStationInput(station.stationName);
    setSelectedCrs(station.crsCode);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0) {
        handleStationSelect(suggestions[highlightedIndex]);
      } else if (suggestions.length > 0) {
        handleStationSelect(suggestions[0]);
      } else {
        searchTrains();
      }
    }
  };

  const searchTrains = async () => {
    const crs =
      selectedCrs ||
      stations.find((s) => s.stationName.toLowerCase() === stationInput.toLowerCase())?.crsCode;
    if (!crs) {
      alert('Please select a valid station from the suggestions.');
      return;
    }

    setLoading(true);
    setDetails(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/trains/${crs}`);
      setDepartures(res.data.departures);
    } catch {
      alert('Failed to fetch departures.');
    }
    setLoading(false);
  };

  const fetchDetails = async (service) => {
    const { serviceID, origin, scheduledDeparture, estimatedDeparture, platform } = service;

    try {
      const res = await axios.get(`${API_BASE_URL}/trains/details/${serviceID}`, {
        params: {
          originName: origin,
          scheduledTime: scheduledDeparture,
          estimatedTime: estimatedDeparture,
          platform,
        },
      });
      setDetails({ ...res.data, serviceID });
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      alert('Could not load service details.');
    }
  };

  const getCoordsByStationName = (name) => {
    const match = stations.find(
      (s) => s.stationName.toLowerCase() === name.toLowerCase()
    );
    return match ? { lat: parseFloat(match.latitude), lng: parseFloat(match.longitude) } : null;
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6 relative">
      <h1 className="text-2xl font-bold mb-4 text-indigo-600">🚉 Journey Planner</h1>

      <div className="relative mb-4">
        <input
          type="text"
          value={stationInput}
          onChange={(e) => {
            setStationInput(e.target.value);
            setSelectedCrs('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter departure station name (e.g., Ipswich)"
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
        {suggestions.length > 0 && (
          <ul
            ref={suggestionsRef}
            className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded max-h-60 overflow-y-auto shadow"
          >
            {suggestions.map((station, idx) => (
              <li
                key={station.crsCode}
                onClick={() => handleStationSelect(station)}
                className={`px-3 py-2 cursor-pointer hover:bg-indigo-100 ${
                  idx === highlightedIndex ? 'bg-indigo-100' : ''
                }`}
              >
                {station.stationName} ({station.crsCode})
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={searchTrains}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mb-4"
      >
        Search
      </button>

      {loading && <p className="text-gray-500">Loading...</p>}

      {departures.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Live Departures</h2>
          <ul>
            {departures.map((train, idx) => (
              <TrainCard
                key={idx}
                train={train}
                onViewDetails={() => fetchDetails(train)}
              />
            ))}
          </ul>
        </div>
      )}

      {details && (
        <div ref={detailsRef} className="mt-6">
          <RouteDetails
            details={details}
            scrollRef={detailsRef}
            extraRender={({ callingPoints }) => (
              <ul className="text-sm text-gray-700 space-y-1 mt-4">
                {callingPoints?.map((cp, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {cp.locationName} — {cp.scheduledTime}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedStationName(cp.locationName);
                        setShowModal(true);
                      }}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Nearby
                    </button>
                  </li>
                ))}
              </ul>
            )}
          />
        </div>
      )}

      {showModal && selectedStationName && (
        <PlacesModal
          station={getCoordsByStationName(selectedStationName)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default Home;