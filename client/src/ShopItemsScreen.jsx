import { useEffect, useState } from 'react';
import { SHOP_CATALOG } from './shopCatalog';
import { equipItem, getInventory, purchaseItem } from './services/shopApi';
import AnimatedGameBackground from './game/AnimatedGameBackground';
import ShopItemCard from './ShopItemCard';

export default function ShopItemsScreen({ category, title, onBack }) {
  const [inventory, setInventory] = useState({
    ownedItems: [],
    equippedSkin: 'skin_01',
    equippedBulletSkin: 'bullet_01',
    totalCoins: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const items = SHOP_CATALOG.filter((item) => item.category === category);

  const refreshInventory = async () => {
    const nextInventory = await getInventory();
    setInventory({
      ownedItems: nextInventory.ownedItems || [],
      equippedSkin: nextInventory.equippedSkin || 'skin_01',
      equippedBulletSkin: nextInventory.equippedBulletSkin || 'bullet_01',
      totalCoins: Number(nextInventory.totalCoins) || 0,
    });
  };

  useEffect(() => {
    refreshInventory()
      .catch(() => setError('SHOP UNAVAILABLE'))
      .finally(() => setIsLoading(false));
  }, []);

  const handlePurchase = async (itemId) => {
    const nextInventory = await purchaseItem(itemId);
    setInventory({
      ownedItems: nextInventory.ownedItems || [],
      equippedSkin: nextInventory.equippedSkin || 'skin_01',
      equippedBulletSkin: nextInventory.equippedBulletSkin || 'bullet_01',
      totalCoins: Number(nextInventory.totalCoins) || 0,
    });
  };

  const handleEquip = async (itemId) => {
    const nextInventory = await equipItem(itemId);
    setInventory({
      ownedItems: nextInventory.ownedItems || [],
      equippedSkin: nextInventory.equippedSkin || 'skin_01',
      equippedBulletSkin: nextInventory.equippedBulletSkin || 'bullet_01',
      totalCoins: Number(nextInventory.totalCoins) || 0,
    });
  };

  return (
    <div className="shop-items-screen">
      <AnimatedGameBackground className="shop-items-screen__backdrop-anim" style={{ backgroundImage: "url('/sprites/game_bg.png')" }} />
      <div className="shop-items-screen__backdrop" />
      <div className="shop-items-screen__scanlines" />

      <button type="button" className="shop-items-screen__back" onClick={onBack}>
        ← SHOP
      </button>

      <main className="shop-items-panel">
        <p className="eyebrow">Dashfire market</p>
        <h1>{title}</h1>
        <div className="shop-items-balance" aria-label={`${inventory.totalCoins} coins`}>
          <span aria-hidden="true">🪙</span> {inventory.totalCoins} COINS
        </div>

        {isLoading && <p className="shop-items-status">LOADING...</p>}
        {!isLoading && error && <p className="shop-items-status shop-items-status--error">{error}</p>}
        {!isLoading && !error && (
          <div className="shop-items-grid">
            {items.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                inventory={inventory}
                onPurchase={handlePurchase}
                onEquip={handleEquip}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
