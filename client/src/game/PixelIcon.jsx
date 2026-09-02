// src/game/PixelIcon.jsx
// Tiny hand-authored 10x10 pixel-grid icons rendered as hard-edged SVG
// rects (shapeRendering="crispEdges", no anti-aliasing) — used instead of
// emoji (🔒 ✓), which render via the OS's modern color-emoji font and
// clash with the game's hard-edged pixel-art style.

const LOCK_PATTERN = [
  '0001111000',
  '0010000100',
  '0010000100',
  '0111111110',
  '0111001110',
  '0111011110',
  '0111111110',
  '0111111110',
  '0111111110',
  '0000000000',
];

const CHECK_PATTERN = [
  '0000000000',
  '0000000010',
  '0000000110',
  '0000001100',
  '0100011000',
  '0110110000',
  '0011100000',
  '0001000000',
  '0000000000',
  '0000000000',
];

const COIN_PATTERN = [
  '0011111000',
  '0111111110',
  '1110111011',
  '1111111111',
  '1110111011',
  '1111111111',
  '0111111110',
  '0011111000',
  '0000000000',
  '0000000000',
];

function PixelIcon({ pattern, size = 20, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges">
      {pattern.map((row, r) =>
        row.split('').map((val, c) =>
          val === '1' ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={color} /> : null
        )
      )}
    </svg>
  );
}

export function PixelLock({ size, color }) {
  return <PixelIcon pattern={LOCK_PATTERN} size={size} color={color} />;
}

export function PixelCheck({ size, color }) {
  return <PixelIcon pattern={CHECK_PATTERN} size={size} color={color} />;
}

export function PixelCoin({ size, color }) {
  return <PixelIcon pattern={COIN_PATTERN} size={size} color={color} />;
}