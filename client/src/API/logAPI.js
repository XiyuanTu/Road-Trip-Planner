const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:1337' : 'https://travel-log-api.now.sh';

export async function listLogEntries() {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const response = await fetch(`${API_URL}/api/logs`, { headers });
    return response.json();
}

export async function deleteLogEntry(entryId) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const response = await fetch(`${API_URL}/api/logs/${entryId}`, {
        method: 'DELETE',
        headers: headers
    });

    return response.json();
}

export async function createLogEntry(entry) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const response = await fetch(`${API_URL}/api/logs`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(entry),
    });
    return response.json();
}

