// src/game/entities/Bullet.js
// Player-fired bullet. Travels in the direction the player was facing
// when fired, removed once off-screen or once it hits the enemy.

export class Bullet {
  constructor(x, y, direction, speedMultiplier = 1, skinId = 'bullet_01') {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 4;
    this.speed = 600 * speedMultiplier; // px/s — multiplier defaults to 1, so every other caller across all 4 worlds is completely unaffected
    this.direction = direction; // 'left' | 'right'
    this.skinId = skinId;
    this.hit = false;
  }

  update(dt) {
    this.x += this.direction === 'right' ? this.speed * dt : -this.speed * dt;
  }

  isOffScreen(canvasWidth = 800) {
    return this.x < 0 || this.x > canvasWidth;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx) {
    if (this.skinId !== 'bullet_01') {
      ctx.save();
      ctx.fillStyle = this.skinId === 'bullet_02' ? '#8ae8ff' : this.skinId === 'bullet_03' ? '#ff7777' : this.skinId === 'bullet_04' ? '#b88cff' : '#ffe08a';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.restore();
      return;
    }

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();

    // Motion streak trailing behind the direction of travel.
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffe066';
    const trailLength = this.width * 1.6;
    const trailX = this.direction === 'right' ? cx - trailLength : cx;
    ctx.fillRect(trailX, this.y + this.height * 0.15, trailLength, this.height * 0.7);

    // Outer glow.
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ffdd33';
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width * 0.75, this.height * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bright core.
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff6cc';
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width * 0.45, this.height * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}