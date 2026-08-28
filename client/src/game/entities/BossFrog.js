// src/game/entities/BossFrog.js
// World 2 boss — an enraged giant frog. Unlike World 1's stationary Boss,
// this one actually hops around the arena using the same physics-driven
// hop cycle as Frog.js (pause -> crouch -> airborne -> land -> pause),
// just bigger/heavier. Every landing spawns one 2-HP baby frog (via
// GameCanvas, capped at 5 alive — same "GameCanvas enforces the cap"
// pattern as World 1's Boss spawning gunmen). Fire attacks run on their
// own independent random timer, gated to only trigger while grounded and
// idle, so hopping and firing never visually collide.
//
// Frame map (4 cols x 2 rows, row-major): 0 idle, 1 idle-pulse,
// 2 crouch/windup, 3 airborne (both rise and fall), 4 landing slam
// (spawn trigger), 5 fire charge/rear-back, 6 fire spit (fire trigger),
// 7 recover -> back to 0.

const HIT_FLASH_DURATION = 0.18;
const HIT_FLASH_INTERVAL = 0.06;
const CROUCH_PHASE_DURATION = 0.16;
const LAND_PHASE_DURATION = 0.16;
const IDLE_PULSE_INTERVAL = 0.5; // how often frame flips 0<->1 while grounded/idle

const FIRE_CHARGE_DURATION = 0.5;
const FIRE_SPIT_DURATION = 0.25;
const FIRE_RECOVER_DURATION = 0.3;

export class BossFrog {
  constructor(groundY, config = {}) {
    this.groundY = groundY;
    this.width = 110;
    this.height = 130;

    this.minX = config.arenaMinX ?? 480;
    this.maxX = config.arenaMaxX ?? 700;
    this.x = (this.minX + this.maxX) / 2;
    this.y = groundY;

    this.hopSpeed = config.bossHopSpeed ?? 90;
    this.hopVelocity = config.bossHopVelocity ?? 520;
    this.gravity = config.bossGravity ?? 1300;
    this.pauseMin = config.bossPauseMin ?? 0.08; // matches Frog.js's near-continuous hop cadence
    this.pauseMax = config.bossPauseMax ?? 0.18;

    this.health = config.bossHealth ?? 30;
    this.maxHealth = this.health;
    this.alive = true;

    this.vy = 0;
    this.direction = Math.random() < 0.5 ? -1 : 1;

    this.mode = 'hop'; // 'hop' | 'firing'
    this.state = 'pause'; // hop sub-state: 'pause' | 'crouch' | 'rise' | 'fall' | 'land'
    this.stateTimer = 0;
    this.pauseDuration = this.randomPause();
    this.idlePulseTimer = 0;

    this.fireState = null; // null | 'charge' | 'spit' | 'recover'
    this.fireStateTimer = 0;
    this.fireTimer = this.randomFireInterval(config);

    this.frameIndex = 0;
    this.hitFlashTimer = 0;

    this.wantsToSpawnFrog = false;
    this.wantsToFire = false;
  }

  randomPause() {
    return this.pauseMin + Math.random() * (this.pauseMax - this.pauseMin);
  }

  randomFireInterval(config) {
    const min = config.bossFireIntervalMin ?? 2.5;
    const max = config.bossFireIntervalMax ?? 4.5;
    return min + Math.random() * (max - min);
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = HIT_FLASH_DURATION;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  launchHop() {
    if (this.x <= this.minX) this.direction = 1;
    else if (this.x >= this.maxX) this.direction = -1;
    else if (Math.random() < 0.2) this.direction *= -1;

    this.vy = -this.hopVelocity;
    this.state = 'rise';
    this.stateTimer = 0;
  }

  update(dt) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Fire attack only starts while grounded and idle, so it never
    // interrupts a hop mid-air — visually it always reads as "stops,
    // rears back, fires, resumes hopping."
    if (this.mode === 'hop' && this.state === 'pause') {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.mode = 'firing';
        this.fireState = 'charge';
        this.fireStateTimer = 0;
      }
    }

    if (this.mode === 'firing') {
      this.fireStateTimer += dt;

      if (this.fireState === 'charge') {
        this.frameIndex = 5;
        if (this.fireStateTimer >= FIRE_CHARGE_DURATION) {
          this.fireState = 'spit';
          this.fireStateTimer = 0;
          this.wantsToFire = true;
        }
      } else if (this.fireState === 'spit') {
        this.frameIndex = 6;
        if (this.fireStateTimer >= FIRE_SPIT_DURATION) {
          this.fireState = 'recover';
          this.fireStateTimer = 0;
        }
      } else if (this.fireState === 'recover') {
        this.frameIndex = 7;
        if (this.fireStateTimer >= FIRE_RECOVER_DURATION) {
          this.mode = 'hop';
          this.fireState = null;
          this.frameIndex = 0;
          this.fireTimer = this.randomFireInterval({});
        }
      }
      return; // grounded and busy firing — no hop physics this frame
    }

    // --- hop cycle (only runs while mode === 'hop') ---
    this.stateTimer += dt;

    if (this.state === 'pause') {
      this.idlePulseTimer += dt;
      this.frameIndex = Math.floor(this.idlePulseTimer / IDLE_PULSE_INTERVAL) % 2;
      if (this.stateTimer >= this.pauseDuration) {
        this.state = 'crouch';
        this.stateTimer = 0;
        this.frameIndex = 2;
      }
      return;
    }

    if (this.state === 'crouch') {
      this.frameIndex = 2;
      if (this.stateTimer >= CROUCH_PHASE_DURATION) {
        this.launchHop();
      }
      return;
    }

    if (this.state === 'land') {
      this.frameIndex = 4;
      if (this.stateTimer >= LAND_PHASE_DURATION) {
        this.state = 'pause';
        this.stateTimer = 0;
        this.idlePulseTimer = 0;
        this.frameIndex = 0;
        this.pauseDuration = this.randomPause();
      }
      return;
    }

    // airborne physics: rise/fall
    this.vy += this.gravity * dt;
    this.y += this.vy * dt;
    this.x += this.direction * this.hopSpeed * dt;
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.frameIndex = 3;

    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      this.state = 'land';
      this.stateTimer = 0;
      this.frameIndex = 4;
      this.wantsToSpawnFrog = true; // GameCanvas enforces the 5-alive cap
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
      const drawHeight = 220;
      const drawWidth = drawHeight * (spriteSheet.frameWidth / spriteSheet.frameHeight);
      const drawX = this.x + this.width / 2 - drawWidth / 2;
      const drawY = this.y + this.height - drawHeight;
      const row = Math.floor(this.frameIndex / 4);
      const col = this.frameIndex % 4;
      const flip = this.direction < 0;
      const drew = spriteSheet.draw(ctx, row, col, drawX, drawY, drawWidth, drawHeight, flip);
      if (drew) return;
    }

    ctx.fillStyle = '#7a2c10';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}