import { useEffect, useState } from 'react';
import GameCanvas from './game/GameCanvas';
import LevelSelect from './game/LevelSelect';
import WorldSelect from './game/WorldSelect';
import { WORLDS } from './game/worlds';
import './App.css';

const UNLOCKED_KEY = 'dashfire_unlocked_by_world';

function App() {
  const [screen, setScreen] = useState('worldSelect'); // 'worldSelect' | 'menu' | 'game'
  const [selectedWorldIndex, setSelectedWorldIndex] = useState(0);
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0); // 0-based
  // Per-world unlock counts: { 0: 6, 1: 1 } means World 1 has levels 1-6
  // unlocked, World 2 only has level 1. Defaults to 1 for any world not
  // yet in the saved object (i.e. only its first level is playable).
  const [unlockedByWorld, setUnlockedByWorld] = useState({ 0: 10, 1: 10, 2: 10 }); // TESTING: all levels unlocked — revert to { 0: 1 } before shipping

  // Load saved progress once on mount. No backend yet — localStorage is a
  // fine stand-in until the server/database side is built out; swapping
  // this for a real API call later only touches this effect + the setter
  // below, nothing else in the app needs to change.
  useEffect(() => {
    const saved = localStorage.getItem(UNLOCKED_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        setUnlockedByWorld(parsed);
      }
    } catch {
      // ignore malformed/old-format save data
    }
  }, []);

  const handleSelectWorld = (index) => {
    setSelectedWorldIndex(index);
    setScreen('menu');
  };

  const handleSelectLevel = (index) => {
    setSelectedLevelIndex(index);
    setScreen('game');
  };

  const handleBackToWorlds = () => {
    setScreen('worldSelect');
  };

  // Called by GameCanvas when the player clears `clearedIndex` (0-based)
  // in the currently-selected world. Unlocks the next level in THAT world
  // (if it wasn't already) and returns to the level-select menu.
  const handleLevelComplete = (clearedIndex) => {
    const currentUnlocked = unlockedByWorld[selectedWorldIndex] ?? 1;
    const newUnlocked = Math.max(currentUnlocked, clearedIndex + 2);
    if (newUnlocked !== currentUnlocked) {
      const next = { ...unlockedByWorld, [selectedWorldIndex]: newUnlocked };
      setUnlockedByWorld(next);
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(next));
    }
    setScreen('menu');
  };

  const handleExitToMenu = () => {
    setScreen('menu');
  };

  const currentWorld = WORLDS[selectedWorldIndex] ?? WORLDS[0];

  return (
    <div className="app-container">
      {screen === 'worldSelect' && <WorldSelect onSelectWorld={handleSelectWorld} />}
      {screen === 'menu' && (
        <LevelSelect
          levels={currentWorld.levels}
          unlockedCount={unlockedByWorld[selectedWorldIndex] ?? 1}
          missionTitle={currentWorld.missionTitle}
          backgroundPath={currentWorld.sprites.background?.path}
          backgroundColumns={currentWorld.sprites.background?.columns ?? 8}
          backgroundRows={currentWorld.sprites.background?.rows ?? 1}
          onSelectLevel={handleSelectLevel}
          onBack={handleBackToWorlds}
        />
      )}
      {screen === 'game' && (
        <GameCanvas
          worldIndex={selectedWorldIndex}
          initialLevelIndex={selectedLevelIndex}
          onLevelComplete={handleLevelComplete}
          onExitToMenu={handleExitToMenu}
        />
      )}
    </div>
  );
}

export default App;