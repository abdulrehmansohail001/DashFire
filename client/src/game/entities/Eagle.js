// src/game/entities/Eagle.js
// Flying enemy — patrols back and forth at a constant height and
// periodically throws a projectile. Shootable: has its own health and
// counts toward the level's win condition alongside the ground gunmen.
//
// GameCanvas polls `wantsToThrow` each frame (same pattern as Enemy's
// `wantsToFire`) to know when to actually spawn an EagleProjectile.
const FRAME_COUNT = 8;
const FRAME_DURATION = 0.09; // seconds per wing-flap frame
const SPRITE_DRAW_SIZE = 100; // frames are now square, one size covers both dimensions

const HIT_FLASH_DURATION = 0.18; // seconds the eagle blinks after taking a hit
const HIT_FLASH_INTERVAL = 0.06; // seconds per on/off blink step
export class Eagle {
  // placement lets multiple eagles on one level get distinct starting
  // positions and patrol lanes so they don't stack on top of each other.
  // Omitting it keeps the original single-eagle full-width patrol.
  constructor(y, config, placement = {}) {
    this.x = placement.startX ?? 400;
    this.y = y;   // constant height — never changes
    this.width = 60;
    this.height = 40;

    this.minX = placement.minX ?? 60;
    this.maxX = placement.maxX ?? (740 - this.width);
        this.speed = (config.eagleSpeed ?? 90) * (placement.speedMultiplier ?? 1); // px/s, jittered so multiple eagles don't move in lockstep
    this.vx = this.speed; // starts moving right; flips at patrol bounds

    this.throwIntervalMin = config.eagleThrowIntervalMin ?? 1.5;
    this.throwIntervalMax = config.eagleThrowIntervalMax ?? 2.8;
    this.throwSpeedMin = config.eagleThrowSpeedMin ?? -140;
    this.throwSpeedMax = config.eagleThrowSpeedMax ?? 140;

    this.health = config.eagleHealth ?? 6;
    this.maxHealth = this.health;
    this.alive = true;

        this.throwTimer = 0;
    this.throwInterval = this.randomThrowInterval();
    this.wantsToThrow = false;

        this.frameIndex = 0;
    this.frameTimer = 0;
    this.hitFlashTimer = 0; // >0 while blinking from a recent hit
  }

  randomThrowInterval() {
    return this.throwIntervalMin + Math.random() * (this.throwIntervalMax - this.throwIntervalMin);
  }

  randomThrowVx() {
    return this.throwSpeedMin + Math.random() * (this.throwSpeedMax - this.throwSpeedMin);
  }

    takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = HIT_FLASH_DURATION; // blink regardless of whether this kills it
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  update(dt) {
    if (!this.alive) return;

    this.x += this.vx * dt;
    if (this.x <= this.minX) {
      this.x = this.minX;
      this.vx = this.speed;
    } else if (this.x >= this.maxX) {
      this.x = this.maxX;
      this.vx = -this.speed;
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

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

    draw(ctx, spriteSheet) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) {
      const step = Math.floor(this.hitFlashTimer / HIT_FLASH_INTERVAL);
      if (step % 2 === 0) return; // blink: skip this frame
    }

        if (spriteSheet && spriteSheet.loaded) {
      const flip = this.vx < 0;
      const drawX = this.x + this.width / 2 - SPRITE_DRAW_SIZE / 2;
      const drawY = this.y + this.height / 2 - SPRITE_DRAW_SIZE / 2;
      const drew = spriteSheet.draw(
        ctx, 0, this.frameIndex, drawX, drawY, SPRITE_DRAW_SIZE, SPRITE_DRAW_SIZE, flip
      );
      if (drew) return;
    }

    ctx.fillStyle = '#2a2a35';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height / 2);
    ctx.lineTo(this.x + this.width * 0.3, this.y);
    ctx.lineTo(this.x + this.width * 0.5, this.y + this.height * 0.35);
    ctx.lineTo(this.x + this.width * 0.7, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height / 2);
    ctx.lineTo(this.x + this.width * 0.5, this.y + this.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff3b3b';
    ctx.beginPath();
    ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.4, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}