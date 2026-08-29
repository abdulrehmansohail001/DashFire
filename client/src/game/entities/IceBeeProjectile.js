// src/game/entities/IceBeeProjectile.js
// The IcyBee's thrown shot — same real gravity arc as EagleProjectile
// (carries the bee's throw velocity, gravity pulls it down over time),
// but drawn as an icy shard (matching YetiProjectile's look) and
// GameCanvas calls player.takeFreezeHit() on contact instead of the
// plain takeHit() an EagleProjectile causes — freeze effect, arc motion.

export const ICE_BEE_PROJECTILE_GRAVITY = 900; // same feel as EagleProjectile's arc

export class IceBeeProjectile {
  constructor(x, y, vx, vy = -60) {
    this.x = x;
    this.y = y;
    this.width = 18;
    this.height = 18;
    this.vx = vx;
    this.vy = vy;
  }

  update(dt) {
    this.vy += ICE_BEE_PROJECTILE_GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  hasLanded(groundY) {
    return this.y >= groundY;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx) {
    // Same icy-diamond look as YetiProjectile, scaled to this smaller size.
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.width / 2;

    ctx.save();
    ctx.shadowColor = '#8fe0ff';
    ctx.shadowBlur = 10;

    ctx.fillStyle = '#aee4f5';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.65, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.65, cy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#4a90a4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#e8faff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.45);
    ctx.lineTo(cx + r * 0.28, cy);
    ctx.lineTo(cx, cy + r * 0.45);
    ctx.lineTo(cx - r * 0.28, cy);
    ctx.closePath();
    ctx.fill();
  }
}