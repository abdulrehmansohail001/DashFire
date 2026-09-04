import { useEffect, useRef, useState } from 'react';
import { drawBulletSkin } from './game/bulletSkins';
import { Bullet } from './game/entities/Bullet';

export default function ShopItemCard({ item, inventory, onPurchase, onEquip }) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const owned = inventory.ownedItems.includes(item.id) || item.id === 'skin_01' || item.id === 'bullet_01';
  const equipped = item.category === 'skin'
    ? inventory.equippedSkin === item.id
    : item.category === 'bulletSkin'
      ? inventory.equippedBulletSkin === item.id
      : false;
  const affordable = inventory.totalCoins >= item.price;
  const isPowerup = item.category === 'powerup';
  const isSkinPreview = item.category === 'skin' && item.spriteColumns && item.spriteRows;
  const isBulletPreview = item.category === 'bulletSkin';
  const canvasRef = useRef(null);

  useEffect(() => {
    if ((!isBulletPreview && item.previewType !== 'canvas') || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (item.id === 'bullet_01') {
      const drawWidth = canvas.width * 0.32;
      const drawHeight = canvas.height * 0.11;
      const drawX = (canvas.width - drawWidth) / 2 + drawWidth * 0.1;
      const drawY = (canvas.height - drawHeight) / 2;
      const bullet = new Bullet(drawX, drawY, 'right');
      bullet.width = drawWidth;
      bullet.height = drawHeight;
      bullet.draw(ctx);
    } else {
      const drawWidth = canvas.width * 0.6;
      const drawHeight = canvas.height * 0.6;
      const drawX = (canvas.width - drawWidth) / 2;
      const drawY = (canvas.height - drawHeight) / 2;
      drawBulletSkin(ctx, item.id, drawX, drawY, drawWidth, drawHeight, 'right', 0);
    }
  }, [isBulletPreview, item.id, item.previewType]);

  const handleAction = async () => {
    setError('');
    setIsBusy(true);

    try {
      if (owned) {
        await onEquip(item.id);
      } else {
        await onPurchase(item.id);
      }
    } catch (actionError) {
      setError(actionError.message || 'SHOP ACTION FAILED');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <article className={`shop-item-card${equipped ? ' shop-item-card--equipped' : ''}`}>
      <div className="shop-item-card__image-wrap">
        {isBulletPreview || item.previewType === 'canvas' ? (
          <canvas
            ref={canvasRef}
            width={92}
            height={92}
            aria-label={item.name}
            className="shop-item-card__image"
            style={{ background: '#ffffff' }}
          />
        ) : isSkinPreview ? (
          <div
            role="img"
            aria-label={item.name}
            className="shop-item-card__image shop-item-card__image--sheet"
            style={{
              backgroundImage: `url(${item.spritePath})`,
              '--sprite-columns': item.spriteColumns,
              '--sprite-rows': item.spriteRows,
            }}
          />
        ) : (
          <img src={item.spritePath} alt={item.name} className="shop-item-card__image" />
        )}
      </div>
      <h2>{item.name}</h2>
      <p className={`shop-item-card__price${!owned && !affordable ? ' shop-item-card__price--unaffordable' : ''}`}>
        🪙 {item.price}
      </p>
      {equipped ? (
        <span className="shop-item-card__equipped">EQUIPPED</span>
      ) : (
        <button
          type="button"
          className="shop-item-card__action"
          disabled={isBusy || (!owned && !affordable) || (isPowerup && owned)}
          onClick={handleAction}
        >
          {isBusy ? 'WAIT...' : owned ? (isPowerup ? 'OWNED ✓' : 'EQUIP') : 'BUY'}
        </button>
      )}
      {error && <p className="shop-item-card__error">{error}</p>}
    </article>
  );
}
