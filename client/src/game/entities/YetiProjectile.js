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
    // Glowing icy diamond <> shape instead of a plain circle — reads more
    // clearly as "ice magic" and matches the shield pickup's glow style.
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.width / 2;

    ctx.save();
    ctx.shadowColor = '#8fe0ff';
    ctx.shadowBlur = 12;

    // outer diamond — pale icy fill
    ctx.fillStyle = '#aee4f5';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);       // top point
    ctx.lineTo(cx + r * 0.65, cy); // right point
    ctx.lineTo(cx, cy + r);        // bottom point
    ctx.lineTo(cx - r * 0.65, cy); // left point
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#4a90a4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // inner bright core — no shadow, just a small solid highlight
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