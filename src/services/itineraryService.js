const API_BASE = process.env.REACT_APP_API_BASE_URL + "/itineraries";

// Get auth headers including JWT from localStorage
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Save a new itinerary or update if exists
export async function saveItineraryToBackend(itinerary) {
  try {
    const res = await fetch(`${API_BASE}/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itinerary),
    });
    if (!res.ok) throw new Error('Failed to save itinerary');
    return await res.json();
  } catch (err) {
    console.error('Error saving itinerary:', err);
    return null;
  }
}

// Fetch all itineraries for the current authenticated user
export async function fetchItinerariesFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch itineraries');
    return await res.json();
  } catch (err) {
    console.error('Error fetching itineraries:', err);
    return [];
  }
}

// Delete itinerary by ID
export async function deleteItinerary(itineraryId) {
  try {
    const res = await fetch(`${API_BASE}/${itineraryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete itinerary');
    return await res.json();
  } catch (err) {
    console.error('Error deleting itinerary:', err);
    return null;
  }
}

// Update an existing itinerary by service ID
export async function updateItinerary(serviceId, updatedFields) {
  try {
    const res = await fetch(`${API_BASE}/${serviceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedFields),
    });
    if (!res.ok) throw new Error('Failed to update itinerary');
    return await res.json();
  } catch (err) {
    console.error('Error updating itinerary:', err);
    return null;
  }
}