const API_BASE = 'http://localhost:8000/itineraries';

export async function saveItineraryToBackend(itinerary) {
  try {
    const response = await fetch(`${API_BASE}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itinerary),
    });
    if (!response.ok) {
      throw new Error(`Failed to save itinerary: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Error saving itinerary:', err);
    return null;
  }
}

export async function fetchItinerariesFromBackend(userId) {
  try {
    const response = await fetch(`${API_BASE}/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch itineraries: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Error fetching itineraries:', err);
    return [];
  }
}