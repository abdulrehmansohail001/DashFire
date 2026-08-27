// src/game/entities/BossFireball.js
// The boss's projectile — a pulsing fireball, visually distinct from the
// gunmen's thin EnemyBullet line. Same movement/lifecycle interface as
// EnemyBullet (update/isOffScreen/getBounds) so it drops into the same
// enemyBulletsRef pool without any special-casing in the collision loop.

export class BossFireball {
  constructor(x, y, direction = 'left', speed = 260) {
    this.x = x;
    this.y = y;
    this.width = 26;
    this.height = 26;
    this.speed = speed;
    this.direction = direction;
    this.pulseTimer = 0;
  }

  update(dt) {
    this.pulseTimer += dt;
    this.x += this.direction === 'right' ? this.speed * dt : -this.speed * dt;
  }

  isOffScreen(canvasWidth = 800) {
    return this.x < -this.width || this.x > canvasWidth + this.width;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const pulse = 1 + Math.sin(this.pulseTimer * 20) * 0.08;

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ff3b1a';
    ctx.beginPath();
    ctx.arc(cx, cy, (this.width / 2 + 6) * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ff5a1a';
    ctx.beginPath();
    ctx.arc(cx, cy, (this.width / 2) * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath();
    ctx.arc(cx, cy, this.width / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}