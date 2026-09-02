import { useEffect, useState } from 'react';
import GameCanvas from './game/GameCanvas';
import LevelSelect from './game/LevelSelect';
import WorldSelect from './game/WorldSelect';
import { WORLDS } from './game/worlds';
import { getPlayerProgress, saveLevelClear, getAuthenticatedUser, saveAuth, clearAuth } from './services/progressApi';
import { registerUser, loginUser } from './services/authApi';
import './App.css';

const DEFAULT_UNLOCKED_BY_WORLD = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 };

function App() {
  const [screen, setScreen] = useState('auth');
  const [selectedWorldIndex, setSelectedWorldIndex] = useState(0);
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [unlockedByWorld, setUnlockedByWorld] = useState(DEFAULT_UNLOCKED_BY_WORLD);
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getAuthenticatedUser());

  useEffect(() => {
    if (!currentUser) {
      setScreen('auth');
      return;
    }

    const loadProgress = async () => {
      try {
        const progress = await getPlayerProgress(currentUser.username);
        setUnlockedByWorld(progress.unlockedByWorld || DEFAULT_UNLOCKED_BY_WORLD);
      } catch {
        setUnlockedByWorld(DEFAULT_UNLOCKED_BY_WORLD);
      }
    };

    loadProgress();
    setScreen('worldSelect');
  }, [currentUser]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const request = authMode === 'login'
        ? loginUser(username.trim(), password)
        : registerUser(username.trim(), password);

      const response = await request;
      saveAuth(response);
      setCurrentUser(response.user);
      setUsername('');
      setPassword('');
    } catch (error) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    setScreen('auth');
    setAuthError('');
    setUsername('');
    setPassword('');
  };

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
    if (!currentUser) {
      setScreen('auth');
      return;
    }

    const userId = currentUser.username;
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

  if (screen === 'auth') {
    return (
      <div className="app-container auth-page-shell">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-badge">D</span>
            <div>
              <p className="eyebrow">Game progress</p>
              <h1>Dashfire</h1>
            </div>
          </div>

          <div className="auth-toggle">
            <button
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <label>
              <span>Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                minLength={3}
                maxLength={24}
                autoComplete="username"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                minLength={6}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </label>

            {authError && <p className="auth-error">{authError}</p>}

            <button type="submit" className="auth-submit" disabled={isAuthLoading}>
              {isAuthLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="topbar-user">
        <span>Signed in as {currentUser?.username || 'Player'}</span>
        <button type="button" className="logout-button" onClick={handleLogout}>Logout</button>
      </div>

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