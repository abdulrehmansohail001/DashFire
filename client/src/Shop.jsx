import { useEffect, useState } from 'react';
import { getInventory } from './services/shopApi';
import AnimatedGameBackground from './game/AnimatedGameBackground';
import './Shop.css';

export default function Shop({ onNavigate, onBack }) {
  const [totalCoins, setTotalCoins] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    getInventory()
      .then((inventory) => {
        if (isMounted) setTotalCoins(Number(inventory.totalCoins) || 0);
      })
      .catch(() => {
        if (isMounted) setError('SHOP UNAVAILABLE');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="shop-screen">
      <AnimatedGameBackground className="shop-screen__backdrop-anim" style={{ backgroundImage: "url('/sprites/game_bg.png')" }} />
      <div className="shop-screen__backdrop" />
      <div className="shop-screen__scanlines" />

      <button type="button" className="shop-screen__back" onClick={onBack}>
        ← MENU
      </button>

      <main className="shop-panel">
        <p className="eyebrow">Dashfire market</p>
        <h1>SHOP</h1>
        <div className="shop-balance" aria-label={`${totalCoins} coins`}>
          <span className="shop-balance__coin" aria-hidden="true">🪙</span>
          <span className="shop-balance__value">{totalCoins}</span>
          <span className="shop-balance__label">COINS</span>
        </div>

        {error && <p className="shop-status shop-status--error">{error}</p>}

        <div className="shop-categories">
          <button type="button" className="shop-category" onClick={() => onNavigate('skinsShop')}>
            <span className="shop-category__title">SKINS</span>
            <span className="shop-category__detail">CHARACTER SKINS</span>
          </button>
          <button type="button" className="shop-category" onClick={() => onNavigate('bulletsShop')}>
            <span className="shop-category__title">BULLET SKINS</span>
            <span className="shop-category__detail">WEAPON VISUALS</span>
          </button>
          <button type="button" className="shop-category shop-category--locked" disabled>
            <span className="shop-category__title">POWERUPS</span>
            <span className="shop-category__detail">COMING SOON</span>
          </button>
        </div>
      </main>
    </div>
  );
}
