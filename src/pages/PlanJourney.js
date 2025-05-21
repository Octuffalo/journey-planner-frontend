import React, { useState } from 'react';
import axios from 'axios';
import stations from '../data/stations.json';
import ItineraryMap from '../components/ItineraryMap';
import { useAuth } from '../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = 'http://localhost:8000';
const stationNames = stations.map((s) => s.stationName).sort();

function PlanJourney() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const [customName, setCustomName] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [customDate, setCustomDate] = useState('');

  const { user } = useAuth();

  const getCRS = (name) => {
    const match = stations.find(
      (s) => s.stationName.toLowerCase() === name.toLowerCase()
    );
    return match ? match.crsCode : null;
  };

  const getStationName = (crs) => {
    const match = stations.find((s) => s.crsCode === crs);
    return match ? match.stationName : crs;
  };

  const trimCallingPoints = (callingPoints, fromCRS, toCRS) => {
    const fromIndex = callingPoints.findIndex((cp) => cp.crs === fromCRS);
    const toIndex = callingPoints.findIndex((cp) => cp.crs === toCRS);

    if (fromIndex === -1 || toIndex === -1 || fromIndex > toIndex) {
      return callingPoints;
    }

    return callingPoints.slice(fromIndex, toIndex + 1);
  };

  const handlePlan = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setIsSaved(false);
    setCustomName('');
    setCustomTags('');
    setCustomDate('');

    const fromCRS = getCRS(from);
    const toCRS = getCRS(to);

    if (!fromCRS || !toCRS) {
      setError('Invalid station name(s). Please select from the list.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/optimal-route`, {
        params: { from: fromCRS, to: toCRS },
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Unable to find a route.');
    } finally {
      setLoading(false);
    }
  };

  const saveJourney = async () => {
    if (!user || !result) {
      toast.error('You must be logged in to save a journey.');
      return;
    }

    const combinedCallingPoints = result.legs.flatMap((leg) =>
      trimCallingPoints(leg.callingPoints, leg.from, leg.to)
    );
    const firstLeg = result.legs[0];
    const lastLeg = result.legs.at(-1);

    const itinerary = {
      user_id: user.username,
      service_id: `multi_${Date.now()}`,
      origin: firstLeg.from,
      destination: lastLeg.to,
      calling_points: combinedCallingPoints,
      saved_at: new Date().toISOString(),
      name: customName,
      tags: customTags.split(',').map((t) => t.trim()).filter(Boolean),
      planned_date: customDate || null,
    };

    try {
      await axios.post(`${API_BASE_URL}/itineraries/`, itinerary);
      setIsSaved(true);
      toast.success('✅ Journey saved!');
      setCustomName('');
      setCustomTags('');
      setCustomDate('');
    } catch (error) {
      console.error(error);
      toast.error('❌ Failed to save journey.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 p-6 bg-white shadow-md rounded-xl">
      <h1 className="text-xl font-bold text-indigo-600 mb-4">📍 Plan a Journey</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">From:</label>
          <input
            list="stations"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full border rounded p-2 text-sm"
            placeholder="Start station"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To:</label>
          <input
            list="stations"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border rounded p-2 text-sm"
            placeholder="Destination station"
          />
        </div>
      </div>

      <datalist id="stations">
        {stationNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <button
        onClick={handlePlan}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Planning...' : 'Plan Journey'}
      </button>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {result && (
        <div className="mt-6 border-t pt-4">
          <ToastContainer position="bottom-right" autoClose={3000} />

          <h2 className="text-lg font-semibold mb-2">🗺️ Route Details</h2>
          <p className="text-sm text-gray-600 mb-2">
            Departure: {result.legs[0].departure} | Arrival:{' '}
            {result.legs.at(-1).arrival}
            <br />
            Operators: {result.legs.map((l) => l.operator).join(', ')}
          </p>

          <div className="my-4">
            <h3 className="text-sm font-semibold mb-2">
              Full Journey Map: {getStationName(result.legs[0].from)} →{' '}
              {getStationName(result.legs.at(-1).to)}
            </h3>
            <ItineraryMap
              legs={result.legs.map((leg) => ({
                ...leg,
                callingPoints: trimCallingPoints(
                  leg.callingPoints,
                  leg.from,
                  leg.to
                ),
              }))}
            />
          </div>

          {user && (
            <div className="bg-indigo-50 p-4 rounded mb-4">
              <h4 className="text-sm font-semibold mb-2 text-indigo-800">
                Save Journey Details
              </h4>

              <div className="mb-2">
                <label className="block text-sm font-medium">Name:</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                  placeholder="e.g. Weekend Trip"
                />
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium">Tags:</label>
                <input
                  type="text"
                  value={customTags}
                  onChange={(e) => setCustomTags(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                  placeholder="e.g. scenic, work"
                />
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium">Planned Travel Date:</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>

              <button
                onClick={saveJourney}
                disabled={isSaved}
                className={`w-full mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm ${
                  isSaved ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isSaved ? '✅ Journey Saved' : '💾 Save This Journey'}
              </button>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {result.legs.map((leg, legIndex) => (
              <div key={legIndex}>
                <h3 className="text-sm font-semibold mb-1">
                  Leg {legIndex + 1}: {getStationName(leg.from)} → {getStationName(leg.to)}
                </h3>
                <ul className="text-sm text-gray-700">
                  {trimCallingPoints(leg.callingPoints, leg.from, leg.to).map(
                    (cp, i) => (
                      <li key={i}>
                        {cp.locationName} — {cp.scheduledTime}{' '}
                        {cp.platform ? `(Platform ${cp.platform})` : ''}
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanJourney;