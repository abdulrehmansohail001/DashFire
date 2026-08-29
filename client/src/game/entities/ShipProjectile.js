// src/game/entities/ShipProjectile.js
// Spaceship's aggressor-mode shot — same real gravity arc as
// EagleProjectile/IceBeeProjectile (carries throw velocity, gravity pulls
// it down over time), bigger and slower than the bee's shot. Now an icy
// freezing ball matching the World 3 theme and the bees' own freeze
// effect — GameCanvas calls player.takeFreezeHit() on contact.

export const SHIP_PROJECTILE_GRAVITY = 700; // lower than the bee's 900 — slower fall reads as heavier/slower overall

export class ShipProjectile {
  constructor(x, y, vx, vy = -80) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.vx = vx;
    this.vy = vy;
    this.pulseTimer = 0;
  }

  update(dt) {
    this.pulseTimer += dt;
    this.vy += SHIP_PROJECTILE_GRAVITY * dt;
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
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const pulse = 1 + Math.sin(this.pulseTimer * 12) * 0.06;
    const r = (this.width / 2) * pulse;

    ctx.save();
    ctx.shadowColor = '#8fe0ff';
    ctx.shadowBlur = 14;

    // Outer icy glow ring.
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#8fe0ff';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.fill();

    // Frosted ball body.
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#aee4f5';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a90a4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Bright icy core.
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e8faff';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}