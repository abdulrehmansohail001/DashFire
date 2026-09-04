import { useEffect, useState } from 'react';
import GameCanvas from './game/GameCanvas';
import LevelSelect from './game/LevelSelect';
import WorldSelect from './game/WorldSelect';
import Leaderboard from './Leaderboard';
import Shop from './Shop';
import SkinsShop from './SkinsShop';
import BulletsShop from './BulletsShop';
import PowerupsShop from './PowerupsShop';
import InfoScreen from './InfoScreen';
import InfoEnemiesScreen from './InfoEnemiesScreen';
import InfoObstaclesScreen from './InfoObstaclesScreen';
import InfoBossesScreen from './InfoBossesScreen';
import { WORLDS } from './game/worlds';
import { getPlayerProgress, saveLevelClear, getAuthenticatedUser, saveAuth, clearAuth } from './services/progressApi';
import { getInventory } from './services/shopApi';
import { registerUser, loginUser, googleLogin } from './services/authApi';
import AnimatedGameBackground from './game/AnimatedGameBackground';
import { playSound, playBgm, resumeBgmIfPaused } from './game/sound';
import './App.css';

const GAME_BACKGROUND_STYLE = {
  backgroundImage: "url('/sprites/game_bg.png')",
  backgroundSize: '400% 200%',
};

const DEFAULT_UNLOCKED_BY_WORLD = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 };

function App() {
  const [screen, setScreen] = useState('auth');
  const [selectedWorldIndex, setSelectedWorldIndex] = useState(0);
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [unlockedByWorld, setUnlockedByWorld] = useState(DEFAULT_UNLOCKED_BY_WORLD);
  const [totalCoins, setTotalCoins] = useState(0);
  const [starsByLevel, setStarsByLevel] = useState({});
  const [equippedSkin, setEquippedSkin] = useState('skin_01');
  const [equippedBulletSkin, setEquippedBulletSkin] = useState('bullet_01');
  const [ownedItems, setOwnedItems] = useState([]);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getAuthenticatedUser());

  useEffect(() => {
    const handleInteraction = () => {
      resumeBgmIfPaused();
    };

    const handleGlobalClick = (e) => {
      handleInteraction();
      const btn = e.target.closest('button');
      if (btn && !btn.disabled) {
        playSound('click', 0.6);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (screen === 'game') {
      playBgm('game');
    } else {
      playBgm('menu');
    }
  }, [screen]);

  useEffect(() => {
    // Initialize Google Identity Services if on auth screen
    if (screen === 'auth') {
      const initGoogle = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
          });
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { theme: 'outline', size: 'large', width: 280 } // stays invisible — see the wrapping div's CSS. This is the real, clickable Google button; the retro one under it is pure visual.
          );
        } else {
          // If script hasn't loaded yet, try again in 100ms
          setTimeout(initGoogle, 100);
        }
      };
      initGoogle();
    }
  }, [screen]);

  const handleGoogleResponse = async (response) => {
    setAuthError('');
    setIsAuthLoading(true);
    try {
      const data = await googleLogin(response.credential);
      saveAuth(data);
      setCurrentUser(data.user);
    } catch (error) {
      setAuthError(error.message || 'Google Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setScreen('auth');
      return;
    }

    const loadProgress = async () => {
      try {
        const progress = await getPlayerProgress(currentUser.id);
        setUnlockedByWorld(progress.unlockedByWorld || DEFAULT_UNLOCKED_BY_WORLD);
        setTotalCoins(Number(progress.totalCoins) || 0);
        setStarsByLevel(progress.starsByLevel || {});
      } catch {
        setUnlockedByWorld(DEFAULT_UNLOCKED_BY_WORLD);
        setTotalCoins(0);
        setStarsByLevel({});
      }

      try {
        const inventory = await getInventory();
        setEquippedSkin(inventory.equippedSkin || 'skin_01');
        setEquippedBulletSkin(inventory.equippedBulletSkin || 'bullet_01');
        setOwnedItems(inventory.ownedItems || []);
      } catch {
        setEquippedSkin('skin_01');
        setEquippedBulletSkin('bullet_01');
        setOwnedItems([]);
      }
    };

    loadProgress();
    setScreen('mainMenu');
  }, [currentUser]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const request = authMode === 'login'
        ? loginUser(email.trim(), password)
        : registerUser(email.trim(), password, firstName.trim(), lastName.trim());

      const response = await request;
      saveAuth(response);
      setCurrentUser(response.user);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
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
    setEmail('');
    setPassword('');
  };

  const handleSelectWorld = (index) => {
    setSelectedWorldIndex(index);
    setScreen('menu');
  };

  const handlePlay = () => {
    setScreen('worldSelect');
  };

  const handleLeaderboard = () => {
    setScreen('leaderboard');
  };

  const handleInfo = () => {
    setScreen('info');
  };

  const handleBackToInfo = () => {
    setScreen('info');
  };

  const handleBackToMainMenu = () => {
    setScreen('mainMenu');
  };

  const handleShop = () => {
    setScreen('shop');
  };

  const handleBackToShop = () => {
    setScreen('shop');
  };

  const handleSelectLevel = async (index) => {
    try {
      const inventory = await getInventory();
      setEquippedSkin(inventory.equippedSkin || 'skin_01');
      setEquippedBulletSkin(inventory.equippedBulletSkin || 'bullet_01');
      setOwnedItems(inventory.ownedItems || []);
    } catch {
      setEquippedSkin('skin_01');
      setEquippedBulletSkin('bullet_01');
      setOwnedItems([]);
    }
    setSelectedLevelIndex(index);
    setScreen('game');
  };

  const handleBackToWorlds = () => {
    setScreen('worldSelect');
  };

  const handleLevelComplete = async (clearedIndex, summary = {}) => {
    if (!currentUser) {
      setScreen('auth');
      return;
    }

    const userId = currentUser.id;
    const currentUnlocked = unlockedByWorld[selectedWorldIndex] ?? 1;
    const newUnlocked = Math.max(currentUnlocked, clearedIndex + 2);

    if (newUnlocked !== currentUnlocked) {
      const next = { ...unlockedByWorld, [selectedWorldIndex]: newUnlocked };
      setUnlockedByWorld(next);
    }

    try {
      const progress = await saveLevelClear(
        userId,
        selectedWorldIndex,
        clearedIndex,
        Number(summary.stars) || 0,
        Number(summary.coins) || 0,
      );
      setUnlockedByWorld(progress.unlockedByWorld || unlockedByWorld);
      setTotalCoins(Number(progress.totalCoins) || 0);
      setStarsByLevel(progress.starsByLevel || starsByLevel);
    } catch {
      // keep local state so the session still feels responsive if the API is offline
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
        <AnimatedGameBackground className="auth-page-shell__backdrop-anim" style={GAME_BACKGROUND_STYLE} />
        <div className="auth-page-shell__backdrop" />
        <div className="auth-page-shell__scanlines" />
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
            {authMode === 'register' && (
              <>
                <label>
                  <span>First Name</span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Enter first name"
                    maxLength={30}
                    autoComplete="given-name"
                    required
                  />
                </label>

                <label>
                  <span>Last Name</span>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Enter last name"
                    maxLength={30}
                    autoComplete="family-name"
                    required
                  />
                </label>
              </>
            )}

            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter email"
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  minLength={6}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </label>

            {authError && <p className="auth-error">{authError}</p>}

            <button type="submit" className="auth-submit" disabled={isAuthLoading}>
              {isAuthLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', margin: '20px 0', color: '#666' }}>
            — or —
          </div>
          
          {/* 
            Requires a real VITE_GOOGLE_CLIENT_ID in the environment to render and work.
            Without it, the button will fail to render or authentication will fail,
            which is expected in local dev before it is configured.
          */}
          {/*
            Google's rendered button lives in a cross-origin iframe — it
            can't be restyled or triggered via a fake .click() from our own
            button (that's the whole point of the iframe, security-wise).
            So instead: the real Google button renders here fully
            transparent but still clickable, stacked exactly on top of a
            retro-styled fake button underneath. The click lands on the
            real one; the person only ever sees the retro one.
          */}
          <div className="google-btn-stack">
            <div className="google-btn-stack__fake" aria-hidden="true">
              <img src="/sprites/google_g_pixel.png" alt="" className="google-btn-stack__g" />
              <span>CONTINUE WITH GOOGLE</span>
            </div>
            <div id="google-signin-button" className="google-btn-stack__real"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">

      {screen === 'leaderboard' && <Leaderboard onBack={handleBackToMainMenu} />}
      {screen === 'info' && <InfoScreen onNavigate={setScreen} onBack={handleBackToMainMenu} />}
      {screen === 'infoEnemies' && <InfoEnemiesScreen onBack={handleBackToInfo} />}
      {screen === 'infoObstacles' && <InfoObstaclesScreen onBack={handleBackToInfo} />}
      {screen === 'infoBosses' && <InfoBossesScreen onBack={handleBackToInfo} />}
      {screen === 'shop' && <Shop onNavigate={setScreen} onBack={handleBackToMainMenu} />}
      {screen === 'skinsShop' && <SkinsShop onBack={handleBackToShop} />}
      {screen === 'bulletsShop' && <BulletsShop onBack={handleBackToShop} />}
      {screen === 'powerupsShop' && <PowerupsShop onBack={handleBackToShop} />}
      {screen === 'mainMenu' && (
        <div className="main-menu">
          <button type="button" className="main-menu__logout" onClick={handleLogout}>
            LOGOUT
          </button>
          <AnimatedGameBackground className="main-menu__backdrop-anim" style={GAME_BACKGROUND_STYLE} />
          <div className="main-menu__backdrop" />
          <div className="main-menu__scanlines" />
          <div className="main-menu__content">
            <div className="main-menu__title-block">
              <p className="eyebrow">Game progress</p>
              <h1>Dashfire</h1>
            </div>
            <div className="main-menu__options">
              <button type="button" className="main-menu__button" onClick={handlePlay}>
                PLAY
              </button>
              <button type="button" className="main-menu__button" onClick={handleLeaderboard}>
                LEADERBOARD
              </button>
              <button type="button" className="main-menu__button" onClick={handleInfo}>
                INFO
              </button>
              <button type="button" className="main-menu__button" onClick={handleShop}>
                SHOP
              </button>
            </div>
          </div>
        </div>
      )}
      {screen === 'worldSelect' && <WorldSelect onSelectWorld={handleSelectWorld} onBack={handleBackToMainMenu} />}
      {screen === 'menu' && (
        <LevelSelect
          levels={currentWorld.levels}
          unlockedCount={unlockedByWorld[selectedWorldIndex] ?? 1}
          starsByLevel={starsByLevel}
          worldIndex={selectedWorldIndex}
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
          totalCoins={totalCoins}
          equippedSkin={equippedSkin}
          equippedBulletSkin={equippedBulletSkin}
          ownedItems={ownedItems}
          onLevelComplete={handleLevelComplete}
          onExitToMenu={handleExitToMenu}
        />
      )}
    </div>
  );
}

export default App;