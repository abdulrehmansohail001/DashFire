import { useEffect, useRef, useState } from 'react';
import { drawBulletSkin } from './game/bulletSkins';

export default function ShopItemCard({ item, inventory, onPurchase, onEquip }) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const owned = inventory.ownedItems.includes(item.id);
  const equipped = item.category === 'skin'
    ? inventory.equippedSkin === item.id
    : inventory.equippedBulletSkin === item.id;
  const affordable = inventory.totalCoins >= item.price;
  const isSkinPreview = item.category === 'skin' && item.spriteColumns && item.spriteRows;
  const canvasRef = useRef(null);

  useEffect(() => {
    if (item.previewType !== 'canvas' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const drawWidth = canvas.width * 0.6;
    const drawHeight = canvas.height * 0.6;
    drawBulletSkin(
      ctx,
      item.id,
      (canvas.width - drawWidth) / 2,
      (canvas.height - drawHeight) / 2,
      drawWidth,
      drawHeight,
      'right',
      0
    );
  }, [item.id, item.previewType]);

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
        {item.previewType === 'canvas' ? (
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
          disabled={isBusy || (!owned && !affordable)}
          onClick={handleAction}
        >
          {isBusy ? 'WAIT...' : owned ? 'EQUIP' : 'BUY'}
        </button>
      )}
      {error && <p className="shop-item-card__error">{error}</p>}
    </article>
  );
}
