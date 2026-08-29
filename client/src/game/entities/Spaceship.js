 //src/game/entities/Spaceship.js
// World 3 "nested enemy" — flies an Eagle-style bounce patrol at a fixed
// height. Three-state lifecycle, driven by spaceship_beeform.png
// (4 cols x 2 rows, read row-major as frames 0-7):
//
//   'nest'         frames 0-1 (loop) — active as long as ANY bee (spawned
//                  and not yet dead) exists, OR before any have spawned
//                  yet. Spawns up to 3 IcyBees on a timer
//                  (wantsToSpawnBee), never fires itself.
//   'transforming' frames 2-3 (plays ONCE) — triggers the instant
//                  GameCanvas confirms all 3 bees have been spawned AND
//                  the last one has died. Non-looping; once it finishes,
//                  auto-advances to 'beeform'.
//   'beeform'      frames 4-7 (loop FOREVER) — now fires its own slow
//                  projectiles on a timer (wantsToFire), until the ship
//                  itself is killed.
//
// activateAggressor() is the single entry point GameCanvas calls
// (idempotent — safe to call every frame once triggered, does nothing if
// already past 'nest'), it kicks off the transform sequence.

const NEST_FRAME_DURATION = 0.35;        // slow idle wobble
const TRANSFORM_FRAME_DURATION = 0.25;   // 2 frames = 0.5s total transform time
const BEEFORM_FRAME_DURATION = 0.09;     // normal flying pace

const SPRITE_DRAW_SIZE = 150; // bigger than the eagle — reads as a real nested-boss enemy

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

    // 'nest' | 'transforming' | 'beeform'
    this.state = 'nest';

    this.fireIntervalMin = config.shipFireIntervalMin ?? 1.6;
    this.fireIntervalMax = config.shipFireIntervalMax ?? 2.6;
    // Arc throw magnitude — slower than the bee's (90-150), matching "bigger
    // and slower" than the icy bee shots.
    this.throwSpeedMin = config.shipThrowSpeedMin ?? 50;
    this.throwSpeedMax = config.shipThrowSpeedMax ?? 90;
    this.fireTimer = 0;
    this.fireInterval = this.randomFireInterval();
    this.wantsToFire = false;

    // frameIndex is the flat 0-7 index into the sheet (row = floor(idx/4),
    // col = idx%4); which sub-range it cycles through depends on `state`.
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

  // Called by GameCanvas once all 3 spawned bees are dead. Idempotent —
  // only actually does anything the first time (while still 'nest').
  activateAggressor() {
    if (this.state !== 'nest') return;
    this.state = 'transforming';
    this.frameIndex = 2; // first transform frame
    this.frameTimer = 0;
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

    if (this.state === 'nest' && this.beesSpawned < MAX_BEES) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= BEE_SPAWN_INTERVAL) {
        this.spawnTimer = 0;
        this.beesSpawned += 1;
        this.wantsToSpawnBee = true;
      }
    }

    if (this.state === 'beeform') {
      this.fireTimer += dt;
      if (this.fireTimer >= this.fireInterval) {
        this.fireTimer = 0;
        this.fireInterval = this.randomFireInterval();
        this.wantsToFire = true;
      }
    }

    this.updateAnimation(dt);

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
  }

  updateAnimation(dt) {
    this.frameTimer += dt;

    if (this.state === 'nest') {
      if (this.frameTimer >= NEST_FRAME_DURATION) {
        this.frameTimer = 0;
        this.frameIndex = this.frameIndex === 0 ? 1 : 0; // loop 0<->1 forever
      }
      return;
    }

    if (this.state === 'transforming') {
      if (this.frameTimer >= TRANSFORM_FRAME_DURATION) {
        this.frameTimer = 0;
        if (this.frameIndex < 3) {
          this.frameIndex += 1; // 2 -> 3
        } else {
          // Transform finished — hand off to beeform, permanently.
          this.state = 'beeform';
          this.frameIndex = 4;
        }
      }
      return;
    }

    // beeform — loops 4,5,6,7 forever, no exit condition except death
    if (this.frameTimer >= BEEFORM_FRAME_DURATION) {
      this.frameTimer = 0;
      this.frameIndex = this.frameIndex >= 7 ? 4 : this.frameIndex + 1;
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
      const flip = this.vx < 0;
      const row = Math.floor(this.frameIndex / 4);
      const col = this.frameIndex % 4;
      // Derive box from the sheet's own aspect ratio — its cells aren't
      // square (wider ship/explosion frames vs. more elongated bee
      // frames), so forcing a square box would squash it.
      const aspect = spriteSheet.frameWidth / spriteSheet.frameHeight;
      const drawHeight = SPRITE_DRAW_SIZE;
      const drawWidth = drawHeight * aspect;
      const drawX = this.x + this.width / 2 - drawWidth / 2;
      const drawY = this.y + this.height / 2 - drawHeight / 2;
      const drew = spriteSheet.draw(ctx, row, col, drawX, drawY, drawWidth, drawHeight, flip);
      if (drew) return;
    }

    // Placeholder: dark saucer body + glowing underside light
    ctx.fillStyle = this.state === 'beeform' ? '#5a1e1e' : '#2a3a4a';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.state === 'beeform' ? '#ff5a3a' : '#6fd8ff';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height * 0.7, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}