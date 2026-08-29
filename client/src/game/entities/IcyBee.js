// src/game/entities/IcyBee.js
// World 3 — small flying enemy spawned by Spaceship. Flies an Eagle-style
// bounce patrol (own speed/lane), but AIMS its throws at the player like
// Yeti does (facing tracked independently of flight direction). 2 HP by
// default ("2 hit"). Throws small freeze projectiles — GameCanvas reuses
// YetiProjectile directly and calls player.takeFreezeHit() on contact,
// identical to the Yeti's own freeze behavior.

const FRAME_COUNT = 8;
const FRAME_DURATION = 0.08;
const SPRITE_DRAW_SIZE = 60;

const HIT_FLASH_DURATION = 0.18;
const HIT_FLASH_INTERVAL = 0.06;

export class IcyBee {
  constructor(y, config = {}, placement = {}) {
    this.x = placement.startX ?? 400;
    this.y = y;
    this.width = 34;
    this.height = 34;

    this.minX = placement.minX ?? 0;
    this.maxX = placement.maxX ?? (800 - this.width);
    this.speed = config.iceBeeSpeed ?? 110;
    this.vx = Math.random() < 0.5 ? this.speed : -this.speed;

    this.facing = 'left'; // independent of flight direction — tracks the player, like Yeti

    this.health = config.iceBeeHealth ?? 2;
    this.maxHealth = this.health;
    this.alive = true;

    this.throwIntervalMin = config.iceBeeThrowIntervalMin ?? 1.4;
    this.throwIntervalMax = config.iceBeeThrowIntervalMax ?? 2.2;
    this.projectileSpeed = config.iceBeeProjectileSpeed ?? 200;
    this.throwTimer = 0;
    this.throwInterval = this.randomThrowInterval();
    this.wantsToThrow = false;

    this.frameIndex = 0;
    this.frameTimer = 0;
    this.hitFlashTimer = 0;
  }

  randomThrowInterval() {
    return this.throwIntervalMin + Math.random() * (this.throwIntervalMax - this.throwIntervalMin);
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = HIT_FLASH_DURATION;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  update(dt, playerX) {
    if (!this.alive) return;

    this.x += this.vx * dt;
    if (this.x <= this.minX) {
      this.x = this.minX;
      this.vx = this.speed;
    } else if (this.x >= this.maxX) {
      this.x = this.maxX;
      this.vx = -this.speed;
    }

    if (typeof playerX === 'number') {
      this.facing = playerX < this.x ? 'left' : 'right';
    }

    this.throwTimer += dt;
    if (this.throwTimer >= this.throwInterval) {
      this.throwTimer = 0;
      this.throwInterval = this.randomThrowInterval();
      this.wantsToThrow = true;
    }

    this.frameTimer += dt;
    if (this.frameTimer >= FRAME_DURATION) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % FRAME_COUNT;
    }

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
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
      const flip = this.facing === 'left';
      const drawX = this.x + this.width / 2 - SPRITE_DRAW_SIZE / 2;
      const drawY = this.y + this.height / 2 - SPRITE_DRAW_SIZE / 2;
      const drew = spriteSheet.draw(ctx, 0, this.frameIndex, drawX, drawY, SPRITE_DRAW_SIZE, SPRITE_DRAW_SIZE, flip);
      if (drew) return;
    }

    ctx.fillStyle = '#c9e8f5';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2a35';
    ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.35, this.width * 0.6, this.height * 0.15);
  }
}