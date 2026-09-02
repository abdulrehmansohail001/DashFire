// src/game/entities/TimeDistorter.js
// World 5 final boss. Almost stationary (bob-only, same as base Boss).
// Always damageable — no phase locks out taking hits.
//
// Runs one repeating 11.25s timeline:
//   0.00 - 5.00   normal        (no effect)
//   5.00 - 7.50   REVERSAL      (edge-triggered via wantsReversal; actual
//                                2.5s playback, real-time, is owned by Player.js)
//   7.50 - 10.00  normal        (2.5s gap)
//   10.00 - 12.50 INVERSION     (invertActive true; GameCanvas swaps the
//                                player's left/right and up/down bindings
//                                for this window)
//   -> loops back to 0
//
// Separately, on its own independent clock, spawns a "time gunman" every
// 2.5s regardless of phase (wantsToSpawnGunman, edge-triggered) — GameCanvas
// owns the alive-count cap (3) and decides what to actually spawn, same
// division of responsibility as BlackHoleBoss's being-spawn flag.

const LOOP_DURATION = 12.5;
const REVERSAL_START = 5.0;
const NORMAL2_START = 7.5;
const INVERSION_START = 10.0;

const GUNMAN_SPAWN_INTERVAL = 2.0;
const BOSS_FIRE_INTERVAL = 3.0;

const HIT_FLASH_DURATION = 0.18;
const HIT_FLASH_INTERVAL = 0.06;

const SPRITE_DRAW_HEIGHT = 260;

// Row-wise animation: row 0 idle/breathe, row 1 shoot, row 2 reversal
// (pulls out the big watch), row 3 inversion (arms spread, absorbing).
const IDLE_FRAME_DURATION = 0.28;
const SHOOT_FRAME_DURATION = 0.1;
const SHOOT_POSE_DURATION = SHOOT_FRAME_DURATION * 4;
// Reversal/inversion are gameplay phases, but their sprite animation should
// be a brief pose burst instead of lingering for the full 2.5s effect window.
// Keep it quick but readable — about the same pace as a fire trigger.
const PHASE_ANIM_FRAME_DURATION = 0.12;

export class TimeDistorter {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.width = 130;
    this.height = 200;
    this.facing = 'left';

    this.health = config.bossHealth ?? 25;
    this.maxHealth = this.health;
    this.alive = true;

    this.bobTimer = 0;
    this.hitFlashTimer = 0;

    this.phaseTimer = 0;
    this.phase = 'normal1'; // 'normal1' | 'reversal' | 'normal2' | 'inversion'
    this.invertActive = false;
    this.wantsReversal = false; // edge-triggered true for one frame on entering 'reversal'

    this.gunmanSpawnTimer = 0;
    this.wantsToSpawnGunman = false; // edge-triggered true for one frame every 2.0s

    this.fireTimer = 0;
    this.wantsToFire = false; // edge-triggered true for one frame every 3.0s
    this.projectileMode = 'fireball'; // alternates between fireball and YetiProjectile shots

    // Animation state — 'idle' | 'shoot' | 'reversal' | 'inversion'
    this.animState = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.shootPoseTimer = 0; // holds the shoot pose independent of the transient wantsToFire flag
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = HIT_FLASH_DURATION;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  update(dt, playerX = this.x) {
    if (!this.alive) return;

    if (typeof playerX === 'number') {
      this.facing = playerX < this.x ? 'left' : 'right';
    }

    this.bobTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // --- Phase timeline ---
    const prevPhase = this.phase;
    this.phaseTimer += dt;
    if (this.phaseTimer >= LOOP_DURATION) {
      this.phaseTimer -= LOOP_DURATION;
    }

    if (this.phaseTimer < REVERSAL_START) {
      this.phase = 'normal1';
    } else if (this.phaseTimer < NORMAL2_START) {
      this.phase = 'reversal';
    } else if (this.phaseTimer < INVERSION_START) {
      this.phase = 'normal2';
    } else {
      this.phase = 'inversion';
    }

    this.wantsReversal = prevPhase !== 'reversal' && this.phase === 'reversal';
    this.invertActive = this.phase === 'inversion';

    // --- Independent gunman-spawn clock ---
    this.gunmanSpawnTimer += dt;
    this.wantsToSpawnGunman = false;
    if (this.gunmanSpawnTimer >= GUNMAN_SPAWN_INTERVAL) {
      this.gunmanSpawnTimer -= GUNMAN_SPAWN_INTERVAL;
      this.wantsToSpawnGunman = true;
    }

    // --- Independent boss-fire clock ---
    this.fireTimer += dt;
    this.wantsToFire = false;
    if (this.fireTimer >= BOSS_FIRE_INTERVAL) {
      this.fireTimer -= BOSS_FIRE_INTERVAL;
      this.wantsToFire = true;
      this.shootPoseTimer = SHOOT_POSE_DURATION;
    }
    if (this.shootPoseTimer > 0) this.shootPoseTimer -= dt;

    // --- Animation state ---
    // Keep the actual phase windows long enough for gameplay, but make the
    // visual reversal/inversion burst quick so it reads like a trigger rather
    // than a full 2.5s pose. Once the burst completes, fall back to idle or a
    // pending shoot pose.
    const phaseChanged = prevPhase !== this.phase;
    if (phaseChanged && (this.phase === 'reversal' || this.phase === 'inversion')) {
      this.animState = this.phase;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }

    let nextState;
    if (this.animState === 'reversal' || this.animState === 'inversion') {
      nextState = this.animState;
    } else if (this.shootPoseTimer > 0) {
      nextState = 'shoot';
    } else {
      nextState = 'idle';
    }

    if (nextState !== this.animState) {
      this.animState = nextState;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }

    this.frameTimer += dt;
    const duration =
      this.animState === 'idle' ? IDLE_FRAME_DURATION :
      this.animState === 'shoot' ? SHOOT_FRAME_DURATION :
      PHASE_ANIM_FRAME_DURATION;

    if (this.frameTimer >= duration) {
      this.frameTimer = 0;
      if (this.animState === 'idle') {
        this.frameIndex = (this.frameIndex + 1) % 4; // idle loops
      } else if (this.animState === 'shoot') {
        if (this.frameIndex < 3) {
          this.frameIndex += 1;
        } else {
          this.animState = this.shootPoseTimer > 0 ? 'shoot' : 'idle';
          this.frameIndex = 0;
        }
      } else if (this.frameIndex < 3) {
        this.frameIndex += 1;
      } else {
        this.animState = this.shootPoseTimer > 0 ? 'shoot' : 'idle';
        this.frameIndex = 0;
      }
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

    const bob = Math.sin(this.bobTimer * 2) * 3;

    if (spriteSheet && spriteSheet.loaded) {
      const row = { idle: 0, shoot: 1, reversal: 2, inversion: 3 }[this.animState];
      const aspect = spriteSheet.frameWidth / spriteSheet.frameHeight;
      const drawWidth = SPRITE_DRAW_HEIGHT * aspect;
      const drawX = this.x + this.width / 2 - drawWidth / 2;
      const drawY = this.y + this.height - SPRITE_DRAW_HEIGHT + bob;
      const flip = this.facing === 'left';
      const drew = spriteSheet.draw(ctx, row, this.frameIndex, drawX, drawY, drawWidth, SPRITE_DRAW_HEIGHT, flip);
      if (drew) return;
    }

    // Placeholder — a distinct violet/clock-ish look so it doesn't read as
    // the same fallback as the other bosses.
    ctx.fillStyle = '#241033';
    ctx.fillRect(this.x, this.y + bob, this.width, this.height);
    ctx.strokeStyle = this.phase === 'reversal' ? '#ff5ad1' : this.phase === 'inversion' ? '#5ad1ff' : '#8a5aff';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, this.y + bob, this.width, this.height);
    ctx.fillStyle = '#c9a8ff';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height * 0.25 + bob, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#241033';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y + this.height * 0.25 + bob);
    const handAngle = this.bobTimer * 3;
    ctx.lineTo(
      this.x + this.width / 2 + Math.cos(handAngle) * 10,
      this.y + this.height * 0.25 + bob + Math.sin(handAngle) * 10
    );
    ctx.stroke();
  }
}