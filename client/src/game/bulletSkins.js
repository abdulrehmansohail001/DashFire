// src/game/bulletSkins.js
// Shared bullet-skin drawing logic — used by BOTH the real in-game Bullet
// entity and the shop's preview cards, so the shop preview can never
// visually drift out of sync with what the bullet actually looks like.
//
// direction: 'left' | 'right' — shapes mirror to always point the way
// they're actually flying.
// elapsedTime: seconds since the bullet spawned (or since the shop
// preview mounted) — drives the zigzag skin's wave phase so it isn't
// static.

export function drawBulletSkin(ctx, skinId, x, y, width, height, direction = 'right', elapsedTime = 0) {
  const facingLeft = direction === 'left';
  const cx = x + width / 2;
  const cy = y + height / 2;

  ctx.save();

  if (skinId === 'bullet_02') {
    // Green arrow — triangular head + thin shaft, tip leads.
    ctx.fillStyle = '#3ddc5a';
    ctx.strokeStyle = '#1e7a34';
    ctx.lineWidth = 1;
    const tipX = facingLeft ? x : x + width;
    const tailX = facingLeft ? x + width : x;
    const headLen = width * 0.4;
    const headTipX = facingLeft ? x + headLen : x + width - headLen;

    ctx.beginPath();
    ctx.moveTo(tailX, cy - height * 0.15);
    ctx.lineTo(headTipX, cy - height * 0.15);
    ctx.lineTo(headTipX, cy - height * 0.6);
    ctx.lineTo(tipX, cy);
    ctx.lineTo(headTipX, cy + height * 0.6);
    ctx.lineTo(headTipX, cy + height * 0.15);
    ctx.lineTo(tailX, cy + height * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  } else if (skinId === 'bullet_03') {
    // Blood drop, lying horizontal — round end leads, point trails behind.
    const roundX = facingLeft ? x + width * 0.35 : x + width * 0.65;
    const pointX = facingLeft ? x + width : x;
    const r = height * 0.9;

    ctx.fillStyle = '#b0102a';
    ctx.strokeStyle = '#6b0818';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(roundX, cy, r, 0, Math.PI * 2);
    ctx.moveTo(roundX, cy - r);
    ctx.lineTo(pointX, cy);
    ctx.lineTo(roundX, cy + r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(roundX - (facingLeft ? -2 : 2), cy - r * 0.4, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

  } else if (skinId === 'bullet_04') {
    // Zigzag — jagged lightning-bolt polyline across the bullet's length.
    // VISUAL ONLY: the bullet's real x/y/speed/hitbox stay perfectly
    // linear; only the drawn shape looks wavy.
    ctx.strokeStyle = '#4ad8ff';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const segments = 6;
    const waveAmp = height * 0.9;
    const wavePhase = elapsedTime * 14;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const px = x + t * width;
      const py = cy + Math.sin(t * Math.PI * 3 + wavePhase) * waveAmp * (1 - Math.abs(t - 0.5));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.shadowColor = '#4ad8ff';
    ctx.shadowBlur = 6;
    ctx.stroke();

  } else if (skinId === 'bullet_05') {
    // Balloon — oval body + tiny knot + thin trailing string.
    const bodyX = facingLeft ? x + width * 0.35 : x + width * 0.65;
    const knotX = facingLeft ? x + width * 0.62 : x + width * 0.38;
    const stringEndX = facingLeft ? x + width : x;

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(knotX, cy);
    ctx.lineTo(stringEndX, cy);
    ctx.stroke();

    ctx.fillStyle = '#ff7ac9';
    ctx.strokeStyle = '#b8478f';
    ctx.beginPath();
    ctx.ellipse(bodyX, cy, height * 0.9, height * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bodyX - (facingLeft ? -3 : 3), cy + height * 1.0);
    ctx.lineTo(knotX, cy);
    ctx.lineTo(bodyX + (facingLeft ? -3 : 3), cy + height * 1.0);
    ctx.closePath();
    ctx.fillStyle = '#b8478f';
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(bodyX - height * 0.3, cy - height * 0.4, height * 0.25, height * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

  } else {
    ctx.restore();
    return false; // unknown skinId (e.g. bullet_01) — caller handles its own default
  }

  ctx.restore();
  return true;
}
