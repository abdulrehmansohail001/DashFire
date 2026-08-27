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
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();

    // Motion streak trailing behind the direction of travel.
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ff2fd6';
    const trailLength = this.width * 1.6;
    const trailX = this.direction === 'right' ? cx - trailLength : cx;
    ctx.fillRect(trailX, this.y + this.height * 0.15, trailLength, this.height * 0.7);

    // Outer glow.
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ff2fd6';
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width * 0.75, this.height * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bright white core so it reads as an energy bolt and pops even more
    // against the dark background.
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width * 0.45, this.height * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}