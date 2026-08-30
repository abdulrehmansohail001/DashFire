// src/game/entities/GlacierProjectile.js
// Twin Glaciers' shot — same straight-line motion/interface as
// BossFireball (drops into the same enemyBulletsRef pool, no special-
// casing needed in the collision loop), but drawn as an elongated icy
// bullet/shard pointing in its direction of travel, not a glowing red
// fireball — matches the World 3 frost theme. Damage-only, no freeze.

export class GlacierProjectile {
  constructor(x, y, direction = 'left', speed = 240) {
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
    const pulse = 1 + Math.sin(this.pulseTimer * 18) * 0.05;
    const facingRight = this.direction === 'right';

    ctx.save();
    ctx.translate(cx, cy);
    if (!facingRight) ctx.scale(-1, 1); // shape is authored pointing right, flip for left travel
    ctx.scale(pulse, pulse);

    // Soft icy glow trail behind the tip.
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#8fe0ff';
    ctx.beginPath();
    ctx.ellipse(-4, 0, this.width * 0.55, this.height * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Elongated icy bullet/shard body, tapered to a point at the front.
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#bfe9f7';
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0); // sharp tip
    ctx.lineTo(this.width * 0.05, -this.height * 0.28);
    ctx.lineTo(-this.width / 2, -this.height * 0.16);
    ctx.lineTo(-this.width / 2, this.height * 0.16);
    ctx.lineTo(this.width * 0.05, this.height * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4a90a4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bright icy core streak.
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f0fbff';
    ctx.beginPath();
    ctx.moveTo(this.width * 0.4, 0);
    ctx.lineTo(-this.width * 0.15, -this.height * 0.08);
    ctx.lineTo(-this.width * 0.15, this.height * 0.08);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}