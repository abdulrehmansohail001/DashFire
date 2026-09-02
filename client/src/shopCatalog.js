export const SHOP_CATALOG = [
  ...Array.from({ length: 5 }, (_, index) => ({
    id: `skin_${String(index + 1).padStart(2, '0')}`,
    category: 'skin',
    name: `Skin ${String(index + 1).padStart(2, '0')}`,
    price: 200 + index * 100,
    description: `Placeholder character skin ${String(index + 1).padStart(2, '0')}`,
    spritePath: `/sprites/skin_placeholder_${String(index + 1).padStart(2, '0')}.png`,
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    id: `bullet_${String(index + 1).padStart(2, '0')}`,
    category: 'bulletSkin',
    name: `Bullet Skin ${String(index + 1).padStart(2, '0')}`,
    price: 150 + index * 50,
    description: `Placeholder bullet skin ${String(index + 1).padStart(2, '0')}`,
    spritePath: `/sprites/bullet_placeholder_${String(index + 1).padStart(2, '0')}.png`,
  })),
];