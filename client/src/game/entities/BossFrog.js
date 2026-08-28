// src/game/entities/BossFrog.js
// World 2 boss — an enraged giant frog. Hops around the arena using the
// same physics-driven hop cycle as Frog.js. Unlike the earlier version,
// this is now ONE strict linear sequence through all 8 sprite frames per
// jump cycle — no independent/random fire timer. Every single hop does,
// in order: crouch -> airborne -> land (spawns a baby frog) -> fire
// charge -> fire spit (fires a fireball) -> fire recover -> brief idle
// pause -> crouch again. Spawn always happens before the fireball, once
// per jump, exactly as specified.
//
// Frame map (4 cols x 2 rows, row-major): 0 idle, 1 idle-pulse,
// 2 crouch/windup, 3 airborne (both rise and fall), 4 landing slam
// (spawn trigger), 5 fire charge/rear-back, 6 fire spit (fire trigger),
// 7 recover -> back to 0.

const HIT_FLASH_DURATION = 0.18;
const HIT_FLASH_INTERVAL = 0.06;
const CROUCH_PHASE_DURATION = 0.16;
const LAND_PHASE_DURATION = 0.16;
const FIRE_CHARGE_DURATION = 0.5;
const FIRE_SPIT_DURATION = 0.25;
const FIRE_RECOVER_DURATION = 0.3;
const IDLE_PULSE_INTERVAL = 0.5; // how often frame flips 0<->1 while paused between jumps

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

    // Single linear sequence: pause -> crouch -> rise -> fall -> land ->
    // fireCharge -> fireSpit -> fireRecover -> pause -> ...
    this.state = 'pause';
    this.stateTimer = 0;
    this.pauseDuration = this.randomPause();
    this.idlePulseTimer = 0;

    this.frameIndex = 0;
    this.hitFlashTimer = 0;

    this.wantsToSpawnFrog = false;
    this.wantsToFire = false;
  }

  randomPause() {
    return this.pauseMin + Math.random() * (this.pauseMax - this.pauseMin);
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

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  update(dt) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

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
        this.state = 'fireCharge';
        this.stateTimer = 0;
        this.frameIndex = 5;
      }
      return;
    }

    if (this.state === 'fireCharge') {
      this.frameIndex = 5;
      if (this.stateTimer >= FIRE_CHARGE_DURATION) {
        this.state = 'fireSpit';
        this.stateTimer = 0;
        this.frameIndex = 6;
        this.wantsToFire = true;
      }
      return;
    }

    if (this.state === 'fireSpit') {
      this.frameIndex = 6;
      if (this.stateTimer >= FIRE_SPIT_DURATION) {
        this.state = 'fireRecover';
        this.stateTimer = 0;
        this.frameIndex = 7;
      }
      return;
    }

    if (this.state === 'fireRecover') {
      this.frameIndex = 7;
      if (this.stateTimer >= FIRE_RECOVER_DURATION) {
        this.state = 'pause';
        this.stateTimer = 0;
        this.idlePulseTimer = 0;
        this.frameIndex = 0;
        this.pauseDuration = this.randomPause();
      }
      return;
    }

    // airborne physics: rise/fall (state === 'rise' the whole time in the
    // air — frame stays 3 throughout, matching the single "airborne" cell)
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