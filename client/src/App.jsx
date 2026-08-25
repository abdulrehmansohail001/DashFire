import { useEffect, useState } from 'react';
import GameCanvas from './game/GameCanvas';
import LevelSelect from './game/LevelSelect';
import './App.css';

const UNLOCKED_KEY = 'dashfire_unlocked_level';

function App() {
  const [screen, setScreen] = useState('menu'); // 'menu' | 'game'
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0); // 0-based
  const [unlockedCount, setUnlockedCount] = useState(1); // how many levels are playable, 1 = only Level 1

  // Load saved progress once on mount. No backend yet — localStorage is a
  // fine stand-in until the server/database side is built out; swapping
  // this for a real API call later only touches this effect + the setter
  // below, nothing else in the app needs to change.
  useEffect(() => {
    const saved = localStorage.getItem(UNLOCKED_KEY);
    const parsed = saved ? parseInt(saved, 10) : NaN;
    if (!Number.isNaN(parsed) && parsed >= 1) {
      setUnlockedCount(parsed);
    }
  }, []);

  const handleSelectLevel = (index) => {
    setSelectedLevelIndex(index);
    setScreen('game');
  };

  // Called by GameCanvas when the player clears `clearedIndex` (0-based).
  // Unlocks the next level (if it wasn't already) and returns to the menu.
  const handleLevelComplete = (clearedIndex) => {
    const newUnlocked = Math.max(unlockedCount, clearedIndex + 2);
    if (newUnlocked !== unlockedCount) {
      setUnlockedCount(newUnlocked);
      localStorage.setItem(UNLOCKED_KEY, String(newUnlocked));
    }
    setScreen('menu');
  };

  const handleExitToMenu = () => {
    setScreen('menu');
  };

  return (
    <div className="app-container">
      {screen === 'menu' && (
        <LevelSelect unlockedCount={unlockedCount} onSelectLevel={handleSelectLevel} />
      )}
      {screen === 'game' && (
        <GameCanvas
          initialLevelIndex={selectedLevelIndex}
          onLevelComplete={handleLevelComplete}
          onExitToMenu={handleExitToMenu}
        />
      )}
    </div>
  );
}

export default App;