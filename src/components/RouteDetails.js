import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import PlacesModal from './PlacesModal';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function RouteDetails({ details, scrollRef }) {
  const [isSaved, setIsSaved] = useState(false);
  const { user } = useAuth();
  const [enhancedCallingPoints, setEnhancedCallingPoints] = useState(details.callingPoints);
  const [showModal, setShowModal] = useState(false);
  const [selectedStationName, setSelectedStationName] = useState(null);

  useEffect(() => {
    if (!details?.serviceID || !user) return;
    axios
      .get(`${API_BASE_URL}/itineraries/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then((res) => {
        const found = res.data.find((i) => i.service_id === details.serviceID);
        setIsSaved(!!found);
      })
      .catch((err) => console.error('Error checking if itinerary is saved:', err));
  }, [details, user]);

  useEffect(() => {
    if (!details?.callingPoints || !details.origin) return;

    const exists = details.callingPoints.some(
      (point) => point.locationName.toLowerCase() === details.origin.toLowerCase()
    );

    if (!exists) {
      const injected = {
        locationName: details.origin,
        scheduledTime: details.scheduledDepartureTime || 'Unknown',
        estimatedTime: details.estimatedDepartureTime || '—',
      };
      setEnhancedCallingPoints([injected, ...details.callingPoints]);
    } else {
      setEnhancedCallingPoints(details.callingPoints);
    }
  }, [details]);

  const saveItinerary = async () => {
    if (!user) {
      toast.error('You must be logged in to save itineraries.');
      return;
    }

    const toSave = {
      user_id: user.username,
      service_id: details.serviceID || Date.now().toString(),
      origin: details.origin,
      destination: details.destination,
      calling_points: enhancedCallingPoints,
      saved_at: new Date().toISOString(),
      name: '',
      tags: [],
      planned_date: null,
    };

    try {
      await axios.post(`${API_BASE_URL}/itineraries/`, toSave, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setIsSaved(true);
      toast.success('✅ Itinerary saved!');
    } catch (error) {
      console.error(error);
      toast.error('❌ Failed to save itinerary.');
    }
  };

  const removeItinerary = async () => {
    if (!user) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/itineraries/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const match = res.data.find((i) => i.service_id === details.serviceID);
      if (match?.id) {
        await axios.delete(`${API_BASE_URL}/itineraries/${match.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setIsSaved(false);
        toast.info('🗑️ Itinerary removed.');
      } else {
        toast.warn('⚠️ No itinerary found to delete.');
      }
    } catch (error) {
      console.error(error);
      toast.error('❌ Failed to remove itinerary.');
    }
  };

  const getCoordsByStationName = (name) => {
    const stations = require('../data/stations.json');
    const match = stations.find((s) => s.stationName === name);
    return match ? { lat: parseFloat(match.latitude), lng: parseFloat(match.longitude) } : null;
  };

  return (
    <motion.div
      ref={scrollRef}
      className="mt-6 border-t pt-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ToastContainer position="bottom-right" autoClose={3000} />
      <h2 className="text-xl font-semibold mb-2">Route Details</h2>
      <p><strong>From:</strong> {details.origin}</p>
      <p><strong>To:</strong> {details.destination}</p>

      {user && (
        <button
          onClick={isSaved ? removeItinerary : saveItinerary}
          className={`mt-3 mb-4 px-4 py-2 text-white rounded text-sm transition ${
            isSaved ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSaved ? '❌ Remove Itinerary' : '💾 Save Itinerary'}
        </button>
      )}

      <ul className="mt-2 space-y-1 text-sm text-gray-700">
        {enhancedCallingPoints?.map((point, idx) => (
          <li key={idx} className="flex items-center justify-between">
            <span>
              <strong>{point.locationName}</strong> — Scheduled: {point.scheduledTime}, Estimated: {point.estimatedTime || '—'}
            </span>
            <button
              onClick={() => {
                setSelectedStationName(point.locationName);
                setShowModal(true);
              }}
              className="ml-2 text-xs text-indigo-600 hover:underline"
            >
              Nearby
            </button>
          </li>
        ))}
      </ul>

      {showModal && selectedStationName && (
        <PlacesModal
          station={getCoordsByStationName(selectedStationName)}
          onClose={() => setShowModal(false)}
        />
      )}
    </motion.div>
  );
}

export default RouteDetails;