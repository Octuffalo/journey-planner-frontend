import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const typeIcons = {
  museum: '🏛️',
  cafe: '☕',
  restaurant: '🍽️',
  park: '🌳',
  art_gallery: '🖼️',
  library: '📚',
  church: '⛪',
  tourist_attraction: '📍',
  default: '📌',
};

function PlacesModal({ station, onClose }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placeType, setPlaceType] = useState('tourist_attraction');
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const { lat, lng } = station;

    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/places`, {
          params: { lat, lng, type: placeType },
        });

        setPlaces(res.data.results || []);
      } catch (err) {
        console.error('Failed to fetch places:', err);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [station, placeType]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const photoUrlFor = (place) => {
    const photoRef = place.photos?.[0]?.photo_reference;
    return photoRef
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}`
      : null;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-40 z-[1000] flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 20 }}
          className="bg-white rounded-lg p-4 max-w-lg w-full shadow-xl z-[1010]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Nearby Attractions</h2>
            <button onClick={onClose} className="text-red-500 text-lg">✖</button>
          </div>

          <div className="mb-3">
            <label className="text-sm mr-2">Filter by type:</label>
            <select
              value={placeType}
              onChange={(e) => setPlaceType(e.target.value)}
              className="border px-2 py-1 rounded text-sm"
            >
              <option value="tourist_attraction">Tourist Attractions</option>
              <option value="museum">Museums</option>
              <option value="cafe">Cafés</option>
              <option value="restaurant">Restaurants</option>
              <option value="park">Parks</option>
              <option value="art_gallery">Art Galleries</option>
              <option value="library">Libraries</option>
              <option value="church">Churches</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-sm text-gray-500">Loading nearby places...</span>
            </div>
          ) : places.length === 0 ? (
            <p className="text-gray-500">No results found for that type.</p>
          ) : (
            <ul className="space-y-3 max-h-[400px] overflow-y-auto">
              {places.map((place, i) => {
                const photoUrl = photoUrlFor(place);
                const type = place.types?.[0] || 'default';

                return (
                  <li key={i} className="border rounded p-2 flex gap-3">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={place.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center bg-gray-100 text-xs text-gray-500 rounded">
                        No Image
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="font-semibold text-sm flex items-center gap-1">
                        <span>{typeIcons[type]}</span>
                        <span>{place.name}</span>
                      </div>
                      {place.vicinity && (
                        <div className="text-xs text-gray-500">{place.vicinity}</div>
                      )}
                      {place.rating && (
                        <div className="text-xs text-yellow-600 mt-1">
                          ⭐ {place.rating} / 5
                        </div>
                      )}
                      <a
                        href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 block"
                      >
                        View on Google Maps →
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PlacesModal;