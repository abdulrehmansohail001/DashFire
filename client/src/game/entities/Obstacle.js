// src/game/entities/Obstacle.js
// Fire obstacle: spawns off-screen right, moves left, removed once off-screen left.

export class Obstacle {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.speed = speed; // px/s, moves left
  }

  update(dt) {
    this.x -= this.speed * dt;
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx) {
    ctx.fillStyle = '#ff4500';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#ffa500';
    ctx.fillRect(this.x + 5, this.y + 8, this.width - 10, this.height - 16);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(this.x + 10, this.y + 16, this.width - 20, this.height - 32);
  }
}

export class ObstacleSpawner {
  constructor(spawnIntervalMs, speed) {
    this.spawnInterval = spawnIntervalMs;
    this.speed = speed;
    this.timer = 0;
  }

  update(dt, obstacles) {
    this.timer += dt * 1000;
    if (this.timer >= this.spawnInterval) {
      this.timer = 0;
      const groundY = 340 + 20;
      obstacles.push(new Obstacle(800, groundY, this.speed));
    }
  }
}

// AABB collision check
export function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
