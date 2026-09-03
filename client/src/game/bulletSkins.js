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
    // Blood drop — a rounded leading bulb with a tapered tail behind it.
    ctx.translate(cx, cy);
    ctx.scale(facingLeft ? -1 : 1, 1);
    const bulbX = width * 0.16;

    const bloodGradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
    bloodGradient.addColorStop(0, '#720b1d');
    bloodGradient.addColorStop(0.45, '#b81232');
    bloodGradient.addColorStop(1, '#e13c58');
    ctx.fillStyle = bloodGradient;
    ctx.strokeStyle = '#510714';
    ctx.lineWidth = Math.max(1, height * 0.12);
    ctx.beginPath();
    ctx.moveTo(-width * 0.46, 0);
    ctx.bezierCurveTo(-width * 0.24, -height * 0.18, -width * 0.06, -height * 0.52, bulbX, -height * 0.47);
    ctx.bezierCurveTo(width * 0.42, -height * 0.39, width * 0.48, height * 0.35, bulbX, height * 0.47);
    ctx.bezierCurveTo(-width * 0.06, height * 0.52, -width * 0.24, height * 0.18, -width * 0.46, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 235, 240, 0.58)';
    ctx.beginPath();
    ctx.ellipse(width * 0.25, -height * 0.22, width * 0.08, height * 0.16, -0.25, 0, Math.PI * 2);
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
    // Balloon — a polished oval leading the flight, with its knot and string trailing behind.
    ctx.translate(cx, cy);
    ctx.scale(facingLeft ? -1 : 1, 1);
    const bodyX = width * 0.18;
    const knotX = -width * 0.03;

    ctx.strokeStyle = '#9a9a9a';
    ctx.lineWidth = Math.max(1, height * 0.1);
    ctx.beginPath();
    ctx.moveTo(knotX, height * 0.46);
    ctx.bezierCurveTo(-width * 0.08, height * 0.62, -width * 0.22, height * 0.38, -width * 0.46, height * 0.52);
    ctx.stroke();

    const balloonGradient = ctx.createLinearGradient(bodyX - width * 0.2, 0, bodyX + width * 0.2, 0);
    balloonGradient.addColorStop(0, '#d93696');
    balloonGradient.addColorStop(0.5, '#ff7ac9');
    balloonGradient.addColorStop(1, '#ffb4e1');
    ctx.fillStyle = balloonGradient;
    ctx.strokeStyle = '#a52c72';
    ctx.lineWidth = Math.max(1, height * 0.1);
    ctx.beginPath();
    ctx.ellipse(bodyX, -height * 0.08, width * 0.22, height * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a52c72';
    ctx.beginPath();
    ctx.moveTo(bodyX - width * 0.05, height * 0.44);
    ctx.lineTo(bodyX, height * 0.62);
    ctx.lineTo(bodyX + width * 0.05, height * 0.44);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
    ctx.beginPath();
    ctx.ellipse(bodyX - width * 0.08, -height * 0.25, width * 0.06, height * 0.18, -0.3, 0, Math.PI * 2);
    ctx.fill();

  } else {
    ctx.restore();
    return false; // unknown skinId (e.g. bullet_01) — caller handles its own default
  }

  ctx.restore();
  return true;
}
