// src/game/entities/SittingDuck.js
// World 5 hazard — a thin ground-level pit (same shape/height convention
// as QuicksandPatch, NOT a tall standing chunk like Iceberg), but moves
// using Iceberg's exact one-way sweep: drifts right to left, then snaps
// back to the right edge and sweeps again — never bounces. Not solid —
// GameCanvas does a simple overlap check, no pushback, since this is a
// pit the player walks over, not a wall.
//
// On contact, GameCanvas calls player.takeHit() (1 HP, normal invuln
// applies) AND player.enterDuck(3.0) — this class has no awareness of
// either effect, it only tracks its own position and draws itself, same
// separation of concerns as every other hazard in this codebase.

export class SittingDuck {
  constructor(y, config = {}) {
    this.y = y;
    this.width = 90;
    this.height = 14;

    this.minX = config.minX ?? 0;
    this.maxX = config.maxX ?? (800 - this.width);
    this.speed = config.sittingDuckSpeed ?? 35; // same slow drift as Iceberg
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
    // Placeholder: a shallow dark pit outline, distinct from Iceberg's
    // pale standing-chunk look and Cactus's solid-wall look.
    ctx.fillStyle = '#2a1a3a';
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 2,
      this.height / 2,
      0, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,150,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
