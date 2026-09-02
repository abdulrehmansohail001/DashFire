import ShopItemsScreen from './ShopItemsScreen';
import './SkinsShop.css';

export default function SkinsShop({ onBack }) {
  return <ShopItemsScreen category="skin" title="SKINS" onBack={onBack} />;
}
