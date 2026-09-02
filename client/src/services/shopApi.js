const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('dashfire_auth_token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api/shop${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Shop request failed');
  }

  return response.json();
}

export function getInventory() {
  return request('/inventory');
}

export function purchaseItem(itemId) {
  return request('/purchase', {
    method: 'POST',
    body: JSON.stringify({ itemId }),
  });
}

export function equipItem(itemId) {
  return request('/equip', {
    method: 'POST',
    body: JSON.stringify({ itemId }),
  });
}