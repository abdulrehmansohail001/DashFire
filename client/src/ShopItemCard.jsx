import { useState } from 'react';

export default function ShopItemCard({ item, inventory, onPurchase, onEquip }) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const owned = inventory.ownedItems.includes(item.id);
  const equipped = item.category === 'skin'
    ? inventory.equippedSkin === item.id
    : inventory.equippedBulletSkin === item.id;
  const affordable = inventory.totalCoins >= item.price;

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
        <img src={item.spritePath} alt={item.name} className="shop-item-card__image" />
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
