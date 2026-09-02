import ShopItemsScreen from './ShopItemsScreen';
import './BulletsShop.css';

export default function BulletsShop({ onBack }) {
  return <ShopItemsScreen category="bulletSkin" title="BULLET SKINS" onBack={onBack} />;
}
