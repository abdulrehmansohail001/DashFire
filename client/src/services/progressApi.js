const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const USER_ID_KEY = 'dashfire_user_id';

function createUserId() {
  const id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(USER_ID_KEY, id);
  return id;
}

export function loadUserId() {
  const saved = localStorage.getItem(USER_ID_KEY);
  return saved || createUserId();
}

export function getUserId() {
  return loadUserId();
}

export async function getPlayerProgress(userId) {
  const response = await fetch(`${API_BASE}/api/progress/${encodeURIComponent(userId)}`);

  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }

  return response.json();
}

export async function saveLevelClear(userId, worldIndex, clearedIndex) {
  const response = await fetch(`${API_BASE}/api/progress/${encodeURIComponent(userId)}/level-clear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ worldIndex, clearedIndex }),
  });

  if (!response.ok) {
    throw new Error('Failed to save progress');
  }

  return response.json();
}
