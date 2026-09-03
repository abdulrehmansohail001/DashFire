import ShopItemsScreen from './ShopItemsScreen';

export default function PowerupsShop({ onBack }) {
  return <ShopItemsScreen category="powerup" title="POWERUPS" onBack={onBack} />;
}
