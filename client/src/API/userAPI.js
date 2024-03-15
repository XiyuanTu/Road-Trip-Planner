const API_URL = process.env.NODE_ENV === 'production' ? 'https://road-trip-planner-server-orpin.vercel.app' : 'http://localhost:1337';

export async function signIn(username, password) {
    const headers = {
        'Content-Type': 'application/json',
    };
    const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
        return data.token;
    } else {
        throw new Error(data.message);
    }
}

export async function register(username, password, email, invitationCode) {
    const headers = {
        'Content-Type': 'application/json',
    };
    const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ username, password, email, invitationCode }),
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

export async function getUser(userId) {
    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'GET',
        headers: headers
    });

    const data = await response.json();
    if (response.ok) {
        return data;
    } else {
        throw new Error(data.message);
    }
}

export async function updateUser(id, updatedFields) {
    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(updatedFields),
    });

    const data = await response.json();
    if (response.ok) {
        return data;
    } else {
        throw new Error(data.message);
    }
}