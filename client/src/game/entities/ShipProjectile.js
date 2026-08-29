// src/game/entities/ShipProjectile.js
// Spaceship's aggressor-mode shot — same real gravity arc as
// EagleProjectile/IceBeeProjectile (carries throw velocity, gravity pulls
// it down over time), but bigger and slower than the bee's shot, and a
// distinct fiery look befitting an aggressive ship weapon rather than an
// icy bee sting. GameCanvas calls the normal player.takeHit() on contact
// — no freeze effect, unlike the bees' shots.

export const SHIP_PROJECTILE_GRAVITY = 700; // lower than the bee's 900 — slower fall reads as heavier/slower overall

export class ShipProjectile {
  constructor(x, y, vx, vy = -80) {
    this.x = x;
    this.y = y;
    this.width = 30; // bigger than IceBeeProjectile's 18
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
    const pulse = 1 + Math.sin(this.pulseTimer * 16) * 0.08;

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ff5a3a';
    ctx.beginPath();
    ctx.arc(cx, cy, (this.width / 2 + 5) * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ff7a3a';
    ctx.beginPath();
    ctx.arc(cx, cy, (this.width / 2) * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe0a0';
    ctx.beginPath();
    ctx.arc(cx, cy, this.width / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}