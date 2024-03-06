const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:1337' : 'https://travel-log-api.now.sh';

export async function signIn(username, password) {
    const headers = {
        'Content-Type': 'application/json',
    };
    const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({username, password}),
    });

    const data = await response.json();
    if (response.ok) {
        return data.token;
    } else {
        throw new Error(data.message);
    }
}

export async function register(username, password, email) {
    const headers = {
        'Content-Type': 'application/json',
    };
    const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({username, password, email}),
    });

    const data = await response.json();
    if (response.ok) {
        return data;
    } else {
        throw new Error(data.message);
    }
}

export async function deleteUser(userId) {
    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: headers
    });

    const data = await response.json();
    if (response.ok) {
        return data;
    } else {
        throw new Error(data.message);
    }
}