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
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}