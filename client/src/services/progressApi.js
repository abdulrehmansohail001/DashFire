const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const TOKEN_KEY = 'dashfire_auth_token';
const USER_KEY = 'dashfire_auth_user';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getAuthenticatedUser() {
  const savedUser = localStorage.getItem(USER_KEY);
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function saveAuth(payload) {
  localStorage.setItem(TOKEN_KEY, payload.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPlayerProgress(userId) {
  const response = await fetch(`${API_BASE}/api/progress/${encodeURIComponent(userId)}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }

  return response.json();
}

export async function saveLevelClear(userId, worldIndex, clearedIndex, stars = 0, coins = 0) {
  const response = await fetch(`${API_BASE}/api/progress/${encodeURIComponent(userId)}/level-clear`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ worldIndex, clearedIndex, stars, coins }),
  });

  if (!response.ok) {
    throw new Error('Failed to save progress');
  }

  return response.json();
}
