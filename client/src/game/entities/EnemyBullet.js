// src/game/entities/EnemyBullet.js
// Enemy-fired bullet. Small, travels left toward the player (enemy sits on
// the right side of the arena). Kept separate from the player's Bullet
// class so the two can diverge later (different speed, size, effects)
// without cross-contaminating logic.

export class EnemyBullet {
    constructor(x, y, direction = 'left', speed = 260) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 4;
    this.speed = speed; // px/s, sourced from the enemy's level config
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
    // Hot magenta instead of orange-red — the old color blended into the
    // red accent lights on the moon background's horizon spires.
    ctx.fillStyle = '#ff2fd6';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Thin white core so it reads as an energy bolt and pops even more
    // against the dark background.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 2, this.y + 1, this.width - 4, this.height - 2);
  }
}