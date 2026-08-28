// src/game/entities/YetiProjectile.js
// The Yeti's thrown ice chunk — travels in a straight horizontal line at
// roughly hand/chest height (no arc, no gravity, unlike EagleProjectile,
// since this is a direct hand-thrown shot rather than a dropped bomb).
// Freeze-capable: GameCanvas calls player.takeFreezeHit() on contact
// instead of the normal takeHit(), per the Yeti's design (damage + freeze
// the player for 1-1.5s, not just damage).

export class YetiProjectile {
  constructor(x, y, direction, speed = 220) {
    this.x = x;
    this.y = y;
    this.width = 26;  // bigger than a regular bullet — reads as a heavy thrown chunk
    this.height = 26;
    this.direction = direction; // 'left' | 'right'
    this.speed = speed;
    this.hit = false;
  }

  update(dt) {
    this.x += this.direction === 'right' ? this.speed * dt : -this.speed * dt;
  }

  isOffScreen(canvasWidth = 800) {
    return this.x < -this.width || this.x > canvasWidth;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx) {
    // Placeholder: a chunky pale-blue ice shard until real art exists
    ctx.fillStyle = '#aee4f5';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a90a4';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}