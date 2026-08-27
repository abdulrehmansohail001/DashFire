// src/game/entities/EagleProjectile.js
// A rock/bomb lobbed by the Eagle. Unlike EnemyBullet (straight horizontal
// line), this follows a real arc: it carries whatever horizontal velocity
// it was thrown with, plus gravity pulling it down over time — so where it
// lands depends on the eagle's position AND velocity at the moment of the
// throw, not a fixed drop point. That's what makes the landing spot vary.

export const EAGLE_PROJECTILE_GRAVITY = 900; // px/s^2 — separate from player/enemy gravity so it can be tuned independently for arc "feel"

export class EagleProjectile {
  constructor(x, y, vx, vy = -60) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.vx = vx; // carried from the eagle's velocity at throw time
    this.vy = vy; // small initial upward toss so it arcs rather than just dropping
  }

  update(dt) {
    this.vy += EAGLE_PROJECTILE_GRAVITY * dt;
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
    // Placeholder: a dark jagged rock with a warning-orange core. Swap for
    // sprite art the same way Player/Enemy did, once there's art for it.
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.width / 2;

    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}