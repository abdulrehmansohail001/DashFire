const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function getLeaderboard() {
  const token = localStorage.getItem('dashfire_auth_token') || '';
  const response = await fetch(`${API_BASE}/api/leaderboard`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }

  return response.json();
}