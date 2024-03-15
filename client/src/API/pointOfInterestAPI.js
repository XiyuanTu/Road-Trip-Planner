const API_URL = process.env.NODE_ENV === 'production' ? 'https://road-trip-planner-server-orpin.vercel.app' : 'http://localhost:1337';

export async function listPointOfInterests() {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    console.log(headers)
    const response = await fetch(`${API_URL}/api/pointOfInterests`, { headers });
    return response.json();
}

export async function deletePointOfInterest(entryId) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const response = await fetch(`${API_URL}/api/pointOfInterests/${entryId}`, {
        method: 'DELETE',
        headers: headers
    });

    return response.json();
}

export async function createPointOfInterest(entry) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const response = await fetch(`${API_URL}/api/pointOfInterests`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(entry),
    });
    return response.json();
}

export const updatePointOfInterest = async (entryId, newTitle) => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
    };
    const response = await fetch(`${API_URL}/api/pointOfInterests/${entryId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ title: newTitle }),
    });
    return await response.json();
};
