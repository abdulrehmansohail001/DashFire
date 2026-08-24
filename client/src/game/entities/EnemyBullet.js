// src/game/entities/EnemyBullet.js
// Enemy-fired bullet. Small, travels left toward the player (enemy sits on
// the right side of the arena). Kept separate from the player's Bullet
// class so the two can diverge later (different speed, size, effects)
// without cross-contaminating logic.

export class EnemyBullet {
  constructor(x, y, direction = 'left') {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 4;
    this.speed = 260; // px/s — matches the old enemy-bullet speed you had via Obstacle
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
    ctx.fillStyle = '#ff4500';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}