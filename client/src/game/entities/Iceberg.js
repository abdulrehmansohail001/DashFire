// src/game/entities/Iceberg.js
// World 3 moving obstacle — a small ice chunk that drifts slowly right to
// left, then LOOPS back to the right edge and sweeps again (a one-way
// repeating sweep, not a bounce like Eagle/Frog). Solid like
// Obstacle/Cactus: blocks player movement and player bullets. Cannot
// deal damage — contact freezes the player (1-1.5s, no health loss) via
// Player.freezeOnly(). Has no health of its own, so no hit-flash/blink —
// it's not a damageable entity, just a hazard.

export class Iceberg {
  constructor(y, config = {}) {
    this.y = y + 12; // nudged lower than the passed-in y
    this.width = 26;  // smaller than Cactus's 40
    this.height = 55; // smaller than Cactus's 90

    this.minX = config.minX ?? 0;
    this.maxX = config.maxX ?? (800 - this.width);
    this.speed = config.icebergSpeed ?? 35; // slow drift
    this.x = this.maxX; // starts at the right edge, sweeps toward minX
  }

  update(dt) {
    this.x -= this.speed * dt;
    if (this.x <= this.minX) {
      this.x = this.maxX; // loop: snap back to the right edge, sweep again
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx, image) {
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, this.x, this.y, this.width, this.height);
      return;
    }
    ctx.fillStyle = '#bfe7f5';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width * 0.5, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4a90a4';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}