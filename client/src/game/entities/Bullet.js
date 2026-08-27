// src/game/entities/Bullet.js
// Player-fired bullet. Travels in the direction the player was facing
// when fired, removed once off-screen or once it hits the enemy.

export class Bullet {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 4;
    this.speed = 600; // px/s
    this.direction = direction; // 'left' | 'right'
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