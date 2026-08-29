// src/game/entities/Spaceship.js
// World 3 "nested enemy" — flies an Eagle-style bounce patrol at a fixed
// height. Passive at first: every 2s it signals GameCanvas to spawn one
// IcyBee (via wantsToSpawnBee), capped at 3 total ever — no respawning
// once that cap is hit, regardless of how many bees are still alive.
// Never fires on its own. Once GameCanvas confirms all 3 bees have been
// spawned AND are all dead, it calls activateAggressor() — from that
// point on the ship switches to firing slow projectiles on its own timer
// (wantsToFire), same signal pattern as Enemy/Eagle/Yeti.

const FRAME_COUNT = 8;
const FRAME_DURATION = 0.09;
const SPRITE_DRAW_SIZE = 130; // bigger than the eagle — reads as a ship, not a bird

const HIT_FLASH_DURATION = 0.18;
const HIT_FLASH_INTERVAL = 0.06;

const BEE_SPAWN_INTERVAL = 2.0;
const MAX_BEES = 3;

export class Spaceship {
  constructor(y, config = {}, placement = {}) {
    this.x = placement.startX ?? 400;
    this.y = y;
    this.width = 90;
    this.height = 60;

    this.minX = placement.minX ?? 0;
    this.maxX = placement.maxX ?? (800 - this.width);
    this.speed = config.shipSpeed ?? 70;
    this.vx = this.speed;

    this.health = config.shipHealth ?? 15;
    this.maxHealth = this.health;
    this.alive = true;

    this.beesSpawned = 0; // total ever spawned, caps at MAX_BEES, never resets
    this.spawnTimer = 0;
    this.wantsToSpawnBee = false;

    this.aggressor = false;
    this.fireIntervalMin = config.shipFireIntervalMin ?? 1.6;
    this.fireIntervalMax = config.shipFireIntervalMax ?? 2.6;
    // Arc throw magnitude — slower than the bee's (90-150), matching "bigger
    // and slower" than the icy bee shots.
    this.throwSpeedMin = config.shipThrowSpeedMin ?? 50;
    this.throwSpeedMax = config.shipThrowSpeedMax ?? 90;
    this.fireTimer = 0;
    this.fireInterval = this.randomFireInterval();
    this.wantsToFire = false;

    this.frameIndex = 0;
    this.frameTimer = 0;
    this.hitFlashTimer = 0;
  }

  randomFireInterval() {
    return this.fireIntervalMin + Math.random() * (this.fireIntervalMax - this.fireIntervalMin);
  }

  throwVx(facingRight) {
    const magnitude = this.throwSpeedMin + Math.random() * (this.throwSpeedMax - this.throwSpeedMin);
    return facingRight ? magnitude : -magnitude;
  }

  activateAggressor() {
    this.aggressor = true; // idempotent — safe for GameCanvas to call every frame once true
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

    this.x += this.vx * dt;
    if (this.x <= this.minX) {
      this.x = this.minX;
      this.vx = this.speed;
    } else if (this.x >= this.maxX) {
      this.x = this.maxX;
      this.vx = -this.speed;
    }

    if (!this.aggressor && this.beesSpawned < MAX_BEES) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= BEE_SPAWN_INTERVAL) {
        this.spawnTimer = 0;
        this.beesSpawned += 1;
        this.wantsToSpawnBee = true;
      }
    }

    if (this.aggressor) {
      this.fireTimer += dt;
      if (this.fireTimer >= this.fireInterval) {
        this.fireTimer = 0;
        this.fireInterval = this.randomFireInterval();
        this.wantsToFire = true;
      }
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
      const flip = this.vx < 0;
      const drawX = this.x + this.width / 2 - SPRITE_DRAW_SIZE / 2;
      const drawY = this.y + this.height / 2 - SPRITE_DRAW_SIZE / 2;
      const drew = spriteSheet.draw(ctx, 0, this.frameIndex, drawX, drawY, SPRITE_DRAW_SIZE, SPRITE_DRAW_SIZE, flip);
      if (drew) return;
    }

    // Placeholder: dark saucer body + glowing underside light
    ctx.fillStyle = this.aggressor ? '#5a1e1e' : '#2a3a4a';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.aggressor ? '#ff5a3a' : '#6fd8ff';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height * 0.7, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}