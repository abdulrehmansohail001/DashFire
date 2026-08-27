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
export class Eagle {
  constructor(y, config) {
    this.x = 400; // starts centered; patrol immediately carries it outward
    this.y = y;   // constant height — never changes
    this.width = 60;
    this.height = 40;

    this.minX = 60;
    this.maxX = 740 - this.width;
    this.speed = config.eagleSpeed ?? 90; // px/s
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
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

    draw(ctx, spriteSheet) {
    if (!this.alive) return;

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