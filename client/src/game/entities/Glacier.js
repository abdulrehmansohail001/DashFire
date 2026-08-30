// src/game/entities/Glacier.js
// One body of the Twin Glaciers boss fight — stationary (no movement,
// like World 1's Boss), fixed at one edge of the arena. Fires straight-
// line, damage-only shots on its own independent timer (GameCanvas reuses
// BossFireball for these — no freeze, unlike the Yeti/IcyBee/Iceberg).
// The "don't fire for the first 3s" and "spawn a bee if nobody's been hit
// in 3s" mechanics are fight-level concerns spanning BOTH bodies, so they
// live in GameCanvas, not here — this class only tracks its own health,
// hit-flash, and firing timer.

const HIT_FLASH_DURATION = 0.18;
const HIT_FLASH_INTERVAL = 0.06;

export class Glacier {
  constructor(x, y, side, config = {}) {
    this.x = x;
    this.y = y;
    this.width = 90;
    this.height = 150;
    this.side = side; // 'left' | 'right' — determines which way it fires

    this.health = config.glacierHealth ?? 20;
    this.maxHealth = this.health;
    this.alive = true;

    this.fireIntervalMin = config.glacierFireIntervalMin ?? 1.2;
    this.fireIntervalMax = config.glacierFireIntervalMax ?? 2.0;
    this.fireSpeed = config.glacierProjectileSpeed ?? 240;
    this.fireTimer = 0;
    this.fireInterval = this.randomFireInterval();
    this.wantsToFire = false;
    this.firingEnabled = false; // GameCanvas flips this true once the 3s grace period ends

    this.hitFlashTimer = 0;
  }

  randomFireInterval() {
    return this.fireIntervalMin + Math.random() * (this.fireIntervalMax - this.fireIntervalMin);
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = HIT_FLASH_DURATION;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  update(dt) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    if (!this.firingEnabled) return;

    this.fireTimer += dt;
    if (this.fireTimer >= this.fireInterval) {
      this.fireTimer = 0;
      this.fireInterval = this.randomFireInterval();
      this.wantsToFire = true;
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx, spriteSheet) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) {
      const step = Math.floor(this.hitFlashTimer / HIT_FLASH_INTERVAL);
      if (step % 2 === 0) return;
    }

    if (spriteSheet && spriteSheet.loaded) {
      const flip = this.side === 'right';
      const drew = spriteSheet.draw(ctx, 0, 0, this.x, this.y, this.width, this.height, flip);
      if (drew) return;
    }

    ctx.fillStyle = '#7fb8d4';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width * 0.5, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2a5a7a';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}
