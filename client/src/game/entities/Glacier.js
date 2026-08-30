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

// Frame map (4 cols x 2 rows, row-major): 0-1 idle/pulse, 2-4 charge
// ramp, 5 fire (muzzle flash — synced to the real shot), 6 recoil,
// 7 settle back to idle.
const CHARGE_FRAME_DURATION = 0.18; // per charge-ramp frame (2,3,4)
const FIRE_FRAME_DURATION = 0.12;
const RECOIL_FRAME_DURATION = 0.2;
const SETTLE_FRAME_DURATION = 0.2;
const IDLE_PULSE_INTERVAL = 0.5;

export class Glacier {
  constructor(x, y, side, config = {}) {
    this.x = x;
    this.y = y;
    this.width = 230;
    this.height = 230; // matches the sprite's real square proportions — hitbox now equals what's actually drawn, no more invisible overhang
    this.side = side; // 'left' | 'right' — which edge it's fixed at (position only, no longer fire direction)
    this.facing = side === 'left' ? 'right' : 'left'; // default: face inward until the first update() sets it from the player's real position

    this.health = config.glacierHealth ?? 20;
    this.maxHealth = this.health;
    this.alive = true;

    this.fireIntervalMin = config.glacierFireIntervalMin ?? 1.8; // was 1.2 — bigger gap between shots
    this.fireIntervalMax = config.glacierFireIntervalMax ?? 2.6; // was 2.0
    this.fireSpeed = config.glacierProjectileSpeed ?? 240;
    this.fireTimer = 0;
    this.fireInterval = this.randomFireInterval();
    this.wantsToFire = false;
    this.firingEnabled = false; // GameCanvas flips this true once the 3s grace period ends

    this.hitFlashTimer = 0;

    this.animState = 'idle'; // 'idle' | 'charge' | 'fire' | 'recoil'
    this.animFrame = 0;
    this.animTimer = 0;
    this.idlePulseTimer = 0;
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

  update(dt, playerX) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Tracks the player like Yeti/Enemy do — fires toward wherever they
    // actually are, including back out toward its own edge if the player
    // gets behind it, instead of always firing a fixed inward direction.
    if (typeof playerX === 'number') {
      this.facing = playerX < this.x ? 'left' : 'right';
    }

    if (!this.firingEnabled) return;

    this.fireTimer += dt;
    if (this.animState === 'idle' && this.fireTimer >= this.fireInterval - (CHARGE_FRAME_DURATION * 3)) {
      // Start the charge animation slightly before the shot actually
      // fires, so frame 5's muzzle flash lands right on the real hit.
      this.animState = 'charge';
      this.animFrame = 2;
      this.animTimer = 0;
    }

    if (this.animState === 'charge') {
      this.animTimer += dt;
      if (this.animTimer >= CHARGE_FRAME_DURATION) {
        this.animTimer = 0;
        this.animFrame += 1;
        if (this.animFrame > 4) {
          this.animState = 'fire';
          this.animFrame = 5;
          this.fireTimer = 0;
          this.fireInterval = this.randomFireInterval();
          this.wantsToFire = true;
        }
      }
    } else if (this.animState === 'fire') {
      this.animTimer += dt;
      if (this.animTimer >= FIRE_FRAME_DURATION) {
        this.animTimer = 0;
        this.animState = 'recoil';
        this.animFrame = 6;
      }
    } else if (this.animState === 'recoil') {
      this.animTimer += dt;
      if (this.animTimer >= RECOIL_FRAME_DURATION) {
        this.animTimer = 0;
        this.animFrame = 7;
        this.animState = 'settle';
      }
    } else if (this.animState === 'settle') {
      this.animTimer += dt;
      if (this.animTimer >= SETTLE_FRAME_DURATION) {
        this.animTimer = 0;
        this.animState = 'idle';
        this.animFrame = 0;
        this.idlePulseTimer = 0;
      }
    } else {
      // idle — gentle pulse between frames 0 and 1
      this.idlePulseTimer += dt;
      this.animFrame = Math.floor(this.idlePulseTimer / IDLE_PULSE_INTERVAL) % 2;
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
      const flip = this.facing === 'left';
      const row = Math.floor(this.animFrame / 4);
      const col = this.animFrame % 4;
      const drew = spriteSheet.draw(ctx, row, col, this.x, this.y, this.width, this.height, flip);
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
