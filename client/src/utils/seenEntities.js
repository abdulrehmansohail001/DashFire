const STORAGE_KEY = 'dashfire_seen_entities';

export function hasSeenEntity(id) {
  try {
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(seen) && seen.includes(id);
  } catch {
    return false;
  }
}

export function markEntitySeen(id) {
  try {
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(seen)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([id]));
      return;
    }
    if (!seen.includes(id)) {
      seen.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    }
  } catch (e) {
    console.error('Failed to mark entity as seen:', e);
  }
}

// Debug function to clear all seen entities (for testing)
export function clearSeenEntities() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Cleared all seen entities');
  } catch (e) {
    console.error('Failed to clear seen entities:', e);
  }
}
