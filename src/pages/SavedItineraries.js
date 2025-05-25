import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import stations from '../data/stations.json';
import PlacesModal from '../components/PlacesModal';
import ItineraryMap from '../components/ItineraryMap';
import { getCoordsByStationName } from '../utils/getStationCoords';

import {
  fetchItinerariesFromBackend,
  saveItineraryToBackend,
  deleteItinerary,
  updateItinerary,
} from '../services/itineraryService';

const stationCoords = stations.reduce((acc, station) => {
  acc[station.stationName] = {
    lat: parseFloat(station.latitude),
    lng: parseFloat(station.longitude),
  };
  return acc;
}, {});

function calculateDuration(callingPoints) {
  if (!callingPoints || callingPoints.length < 2) return null;
  const [startH, startM] = callingPoints[0].scheduledTime.split(':').map(Number);
  const [endH, endM] = callingPoints[callingPoints.length - 1].scheduledTime.split(':').map(Number);
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  start.setHours(startH, startM, 0);
  end.setHours(endH, endM, 0);
  if (end < start) end.setDate(end.getDate() + 1);
  const diffMin = Math.floor((end - start) / 60000);
  return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
}

function SavedItineraries() {
  const [saved, setSaved] = useState([]);
  const [lastDeleted, setLastDeleted] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editingTags, setEditingTags] = useState(null);
  const [editedTags, setEditedTags] = useState('');
  const [editingDate, setEditingDate] = useState(null);
  const [editedDate, setEditedDate] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortMode, setSortMode] = useState('planned');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [selectedStationName, setSelectedStationName] = useState(null);

  const openModalForStation = (stationName) => {
    setSelectedStationName(stationName);
    setShowModal(true);
  };

  const refresh = () => {
    if (!user) return;
    fetchItinerariesFromBackend().then((res) => {
      const sorted = sortItineraries(res, sortMode);
      setSaved(sorted);
    });
  };

  useEffect(refresh, [sortMode, user]);

  const sortItineraries = (items, mode) => {
    return [...items].sort((a, b) => {
      if (mode === 'planned') {
        if (a.planned_date && b.planned_date) {
          return new Date(a.planned_date) - new Date(b.planned_date);
        }
        if (a.planned_date) return -1;
        if (b.planned_date) return 1;
      }
      return new Date(b.saved_at) - new Date(a.saved_at);
    });
  };

  const deleteItineraryHandler = (id) => {
    const deleted = saved.find((i) => i.id === id);
    deleteItinerary(id).then(() => {
      toast.info('🗑️ Itinerary removed.');
      setLastDeleted(deleted);
      refresh();
    });
  };

  const undoDelete = () => {
    if (lastDeleted) {
      saveItineraryToBackend(lastDeleted).then(() => {
        toast.success('✅ Itinerary restored.');
        setLastDeleted(null);
        refresh();
      });
    }
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all saved itineraries?')) {
      Promise.all(saved.map((item) => deleteItinerary(item.id))).then(() => {
        toast.success('🧹 All itineraries cleared.');
        setSaved([]);
      });
    }
  };

  const renameItinerary = (id, newName) => {
    const target = saved.find((i) => i.id === id);
    if (target) {
      updateItinerary(target.service_id, { name: newName }).then(() => {
        toast.success('✅ Name updated.');
        setEditingName(null);
        setEditedName('');
        refresh();
      });
    }
  };

  const editTags = (id, newTags) => {
    const tags = newTags.split(',').map((t) => t.trim()).filter(Boolean);
    const target = saved.find((i) => i.id === id);
    if (target) {
      updateItinerary(target.service_id, { tags }).then(() => {
        toast.success('✅ Tags updated.');
        setEditingTags(null);
        setEditedTags('');
        refresh();
      });
    }
  };

  const updateDate = (id, date) => {
    const target = saved.find((i) => i.id === id);
    if (target) {
      updateItinerary(target.service_id, { planned_date: date }).then(() => {
        toast.success('📅 Travel date updated.');
        setEditingDate(null);
        setEditedDate('');
        refresh();
      });
    }
  };

  const uniqueTags = Array.from(
    new Set(saved.flatMap((item) => item.tags || []))
  ).sort();

  const filteredItins = filterTag
    ? saved.filter((item) => item.tags?.includes(filterTag))
    : saved;

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6">
      <ToastContainer position="bottom-right" autoClose={3000} />
      <h1 className="text-2xl font-bold mb-4 text-indigo-600">💾 Saved Itineraries</h1>

      {lastDeleted && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-2 rounded bg-yellow-100 text-yellow-800 text-sm flex justify-between items-center">
          <span>Itinerary removed.</span>
          <button onClick={undoDelete} className="ml-4 text-indigo-600 underline hover:text-indigo-800">Undo</button>
        </motion.div>
      )}

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <label className="text-sm font-medium">Filter by tag:</label>
        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="border px-2 py-1 rounded text-sm">
          <option value="">All</option>
          {uniqueTags.map((tag) => (
            <option key={tag} value={tag}>#{tag}</option>
          ))}
        </select>

        <label className="text-sm font-medium ml-6">Sort by:</label>
        <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className="border px-2 py-1 rounded text-sm">
          <option value="planned">📅 Travel Date</option>
          <option value="saved">🕓 Saved Date</option>
        </select>

        {filterTag && (
          <button onClick={() => setFilterTag('')} className="text-xs text-blue-600 hover:underline">✖ Clear Tag</button>
        )}

        {saved.length > 0 && (
          <button onClick={clearAll} className="text-xs text-red-600 hover:underline ml-auto">🧹 Clear All</button>
        )}
      </div>

      {filteredItins.length === 0 ? (
        <p className="text-gray-600">No itineraries found.</p>
      ) : (
        <ul className="space-y-6">
          {filteredItins.map((item) => {
            const title = item.name || `${item.origin} → ${item.destination}`;
            const tags = item.tags || [];
            const duration = calculateDuration(item.calling_points);

            return (
              <motion.li key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-b pb-4">
                <div className="font-semibold flex justify-between items-center">
                  {editingName === item.id ? (
                    <div className="flex gap-2 w-full">
                      <input value={editedName} onChange={(e) => setEditedName(e.target.value)} className="border p-1 rounded w-full" placeholder="Trip name" />
                      <button onClick={() => renameItinerary(item.id, editedName)} className="text-sm text-green-600 hover:underline">✅</button>
                      <button onClick={() => setEditingName(null)} className="text-sm text-gray-500 hover:underline">❌</button>
                    </div>
                  ) : (
                    <>
                      <span>{title}</span>
                      <button onClick={() => { setEditingName(item.id); setEditedName(item.name || ''); }} className="text-xs text-indigo-500 hover:underline ml-2">✏️ Rename</button>
                    </>
                  )}
                </div>

                <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-2">
                  {tags.length > 0 ? tags.map((tag, i) => (
                    <span key={i} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">#{tag}</span>
                  )) : (
                    <span className="text-gray-400 italic">No tags</span>
                  )}
                  {editingTags === item.id ? (
                    <div className="w-full flex items-center mt-2 gap-2">
                      <input value={editedTags} onChange={(e) => setEditedTags(e.target.value)} className="border p-1 rounded w-full" placeholder="e.g. Holiday, Work" />
                      <button onClick={() => editTags(item.id, editedTags)} className="text-xs text-green-600 hover:underline">✅</button>
                      <button onClick={() => setEditingTags(null)} className="text-xs text-gray-500 hover:underline">❌</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingTags(item.id); setEditedTags(tags.join(', ')); }} className="text-xs text-indigo-500 hover:underline">✏️ Edit Tags</button>
                  )}
                </div>

                {editingDate === item.id ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input type="date" value={editedDate} onChange={(e) => setEditedDate(e.target.value)} className="border p-1 rounded text-sm" />
                    <button onClick={() => updateDate(item.id, editedDate)} className="text-xs text-green-600 hover:underline">✅</button>
                    <button onClick={() => setEditingDate(null)} className="text-xs text-gray-500 hover:underline">❌</button>
                  </div>
                ) : item.planned_date ? (
                  <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <span>🗓️ Travel date: {item.planned_date}</span>
                    <button onClick={() => { setEditingDate(item.id); setEditedDate(item.planned_date); }} className="text-xs text-indigo-500 hover:underline">✏️ Change</button>
                  </div>
                ) : (
                  <div className="text-sm mt-1">
                    <button onClick={() => { setEditingDate(item.id); setEditedDate(''); }} className="text-xs text-indigo-500 hover:underline">➕ Add travel date</button>
                  </div>
                )}

                {duration && (
                  <div className="text-sm text-gray-500 mt-1">Estimated duration: {duration}</div>
                )}

                <div className="my-3">
                  <ItineraryMap callingPoints={item.calling_points} />
                </div>

                <ul className="text-sm text-gray-600 mt-1">
                  {item.calling_points.map((p, i) => (
                    <li key={i} className="flex justify-between items-center">
                      <span>{p.locationName} — {p.scheduledTime}</span>
                      <button
                        onClick={() => openModalForStation(p.locationName)}
                        className="text-xs text-blue-600 hover:underline ml-2"
                      >
                        📍 Nearby
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex gap-4">
                  <button onClick={() => deleteItineraryHandler(item.id)} className="text-red-600 text-sm hover:underline">❌ Remove</button>
                </div>
              </motion.li>
            );
          })}
        </ul>
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

export default SavedItineraries;