// src/game/entities/Yeti.js
// Standing Yeti — unlike Enemy (which patrols/jumps) or Eagle (which flies
// a patrol lane), the Yeti plants itself at a fixed spot and never moves.
// It just tracks which way the player currently is (facing flips each
// frame based on playerX, same idea as Enemy's dynamic facing) and, on a
// randomized timer, throws one big ice projectile in that direction.
// Shootable — has health, counts toward the level's win condition,
// GameCanvas polls `wantsToThrow` each frame the same way it polls
// Eagle's `wantsToThrow` / Enemy's `wantsToFire`.
//
// Rendering: 2x4 sprite sheet — row 0: idle (4-frame breathing/sway loop),
// row 1: throw (4-frame windup -> release -> follow-through, non-looping,
// holds the final frame until throwPoseTimer expires and it drops back to
// idle). Same frame-cycling pattern as Player/Enemy.

const FRAME_COUNT = 4;
const IDLE_FRAME_DURATION = 0.22;
const THROW_FRAME_DURATION = 0.09; // faster — windup/release should read as snappy, not sluggish
const THROW_POSE_DURATION = THROW_FRAME_DURATION * FRAME_COUNT; // pose holds exactly as long as its 4 frames take

const HIT_FLASH_DURATION = 0.18; // same blink timing as Enemy/Eagle/Frog
const HIT_FLASH_INTERVAL = 0.06;

export class Yeti {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 90;

    this.facing = 'left';

    this.health = config.yetiHealth ?? 8;
    this.maxHealth = this.health;
    this.alive = true;

    this.throwIntervalMin = config.yetiThrowIntervalMin ?? 1.3;
    this.throwIntervalMax = config.yetiThrowIntervalMax ?? 2.0;
    this.projectileSpeed = config.yetiProjectileSpeed ?? 220;

    this.throwTimer = 0;
    this.throwInterval = this.randomThrowInterval();
    this.wantsToThrow = false;

    this.hitFlashTimer = 0; // >0 while blinking from a recent hit

    // Animation state
    this.animState = 'idle'; // 'idle' | 'throw'
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.throwPoseTimer = 0; // >0 while the throw pose should be showing
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

    this.facing = playerX < this.x ? 'left' : 'right';

    if (this.throwPoseTimer > 0) {
      this.throwPoseTimer -= dt;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    this.throwTimer += dt;
    if (this.throwTimer >= this.throwInterval) {
      this.throwTimer = 0;
      this.throwInterval = this.randomThrowInterval();
      this.wantsToThrow = true;
      this.throwPoseTimer = THROW_POSE_DURATION;
    }

    this.updateAnimation(dt);
  }

  updateAnimation(dt) {
    const nextState = this.throwPoseTimer > 0 ? 'throw' : 'idle';
    if (nextState !== this.animState) {
      this.animState = nextState;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }

    this.frameTimer += dt;
    const duration = this.animState === 'throw' ? THROW_FRAME_DURATION : IDLE_FRAME_DURATION;
    if (this.frameTimer >= duration) {
      this.frameTimer = 0;
      if (this.animState === 'throw') {
        // Non-looping — advance toward the final frame and hold it; the
        // pose itself ends via throwPoseTimer, not by looping back to idle.
        if (this.frameIndex < FRAME_COUNT - 1) this.frameIndex += 1;
      } else {
        this.frameIndex = (this.frameIndex + 1) % FRAME_COUNT; // idle loops
      }
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  // spriteSheet optional — falls back to a placeholder icy silhouette.
  draw(ctx, spriteSheet) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) {
      const step = Math.floor(this.hitFlashTimer / HIT_FLASH_INTERVAL);
      if (step % 2 === 0) return; // blink: skip this frame
    }

    if (spriteSheet && spriteSheet.loaded) {
      // Visual size independent of the (deliberately narrow, 50x90)
      // collision hitbox — drawing at hitbox size squashed the yeti into
      // a thin sliver. Derive real size from the sheet's own aspect ratio
      // (same pattern as Player/Frog/Cactus) and anchor bottom-center on
      // the hitbox so feet still land on the actual ground line.
      const drawHeight = 150;
      const drawWidth = drawHeight * (spriteSheet.frameWidth / spriteSheet.frameHeight);
      const drawX = this.x + this.width / 2 - drawWidth / 2;
      const Y_NUDGE = -12; // small upward tuning offset — increase to sit it even higher
      const drawY = this.y + this.height - drawHeight - Y_NUDGE;
      const flip = this.facing === 'left';
      const row = this.animState === 'throw' ? 1 : 0;
      const drew = spriteSheet.draw(ctx, row, this.frameIndex, drawX, drawY, drawWidth, drawHeight, flip);
      if (drew) return;
    }

    // Placeholder: pale icy humanoid block with a darker "throw arm" accent
    ctx.fillStyle = '#dff3fb';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#8fc9de';
    ctx.fillRect(this.x + this.width * 0.15, this.y + this.height * 0.1, this.width * 0.7, this.height * 0.25);

    if (this.throwPoseTimer > 0) {
      ctx.fillStyle = '#4a90a4';
      const armX = this.facing === 'right' ? this.x + this.width : this.x - 14;
      ctx.fillRect(armX, this.y + this.height * 0.3, 14, 10);
    }
  }
}