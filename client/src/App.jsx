import { useEffect, useState } from 'react';
import GameCanvas from './game/GameCanvas';
import LevelSelect from './game/LevelSelect';
import WorldSelect from './game/WorldSelect';
import { WORLDS } from './game/worlds';
import { getPlayerProgress, saveLevelClear, getUserId, loadUserId } from './services/progressApi';
import './App.css';

const DEFAULT_UNLOCKED_BY_WORLD = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 };

function App() {
  const [screen, setScreen] = useState('worldSelect');
  const [selectedWorldIndex, setSelectedWorldIndex] = useState(0);
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [unlockedByWorld, setUnlockedByWorld] = useState(DEFAULT_UNLOCKED_BY_WORLD);

  useEffect(() => {
    const userId = loadUserId();

    const loadProgress = async () => {
      try {
        const progress = await getPlayerProgress(userId);
        setUnlockedByWorld(progress.unlockedByWorld || DEFAULT_UNLOCKED_BY_WORLD);
      } catch {
        setUnlockedByWorld(DEFAULT_UNLOCKED_BY_WORLD);
      }
    };

    loadProgress();
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

  const handleLevelComplete = async (clearedIndex) => {
    const userId = getUserId();
    const currentUnlocked = unlockedByWorld[selectedWorldIndex] ?? 1;
    const newUnlocked = Math.max(currentUnlocked, clearedIndex + 2);

    if (newUnlocked !== currentUnlocked) {
      const next = { ...unlockedByWorld, [selectedWorldIndex]: newUnlocked };
      setUnlockedByWorld(next);

      try {
        await saveLevelClear(userId, selectedWorldIndex, clearedIndex);
      } catch {
        // keep local state so the session still feels responsive if the API is offline
      }
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