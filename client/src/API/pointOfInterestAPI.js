const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:1337' : 'https://travel-log-api.now.sh';

export async function listPointOfInterests() {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const response = await fetch(`${API_URL}/api/point-of-interests`, { headers });
    return response.json();
}

export async function deletePointOfInterest(entryId) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const response = await fetch(`${API_URL}/api/point-of-interests/${entryId}`, {
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
    const response = await fetch(`${API_URL}/api/point-of-interests`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(entry),
    });
    return response.json();
}

