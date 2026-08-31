// src/game/entities/Shapeshifter.js
// World 5 enemy — a "reality glitch" gunman. Fires at the player on its
// own regular timer in BOTH phases (reuses EnemyBullet directly, same as
// a normal gunman). Cycles between a 2s 'normal' window (its own look,
// real damage applies) and a 4s 'disguise' window (draws using the actual
// Player.js sprite sheets — reuses ANIM_CONFIG's idle/shoot frame lookups
// directly, not a separate asset). During disguise, bullet speed is 2x.

//
// Sprite sheet layout (shapeshifter.png, 4 columns × 3 rows):
//   Row 0: idle / walk  (normal-phase standing animation)
//   Row 1: shoot        (normal-phase firing pose)
//   Row 2: glitch       (transformation effect — plays briefly on every
//                        phase switch, regardless of direction)
//

// The psychological-warfare rule: during 'disguise', it is NOT
// damageable — any player bullet that would hit it instead damages the
// PLAYER (GameCanvas handles this redirect, this class just exposes
// `phase` so GameCanvas knows which behavior applies). Additionally,
// during 'disguise' only, the player starting to move on the x-axis
// triggers one bonus shot — GameCanvas calls triggerMovementShot() for
// that, gated by its own short cooldown here so rapid tapping can't
// spam it.

import { ANIM_CONFIG } from './Player';

const NORMAL_DURATION = 2.0;   // seconds in normal (damageable) form
const DISGUISE_DURATION = 4.0; // seconds in disguise (backfire) form
const GLITCH_DURATION = 0.6;   // row-2 transition anim on every phase switch
const GLITCH_FRAME_DURATION = 0.15;
const FIRE_INTERVAL_MIN = 1.5;
const FIRE_INTERVAL_MAX = 2.3;
const MOVEMENT_SHOT_COOLDOWN = 1.0; // mirrors Player.js's own shootCooldown value
// Must match Player.js's own SPRITE_DRAW_HEIGHT exactly — the disguise
// phase reuses Player's sheets directly, so it needs Player's own sizing
// convention (aspect-ratio-derived box, not the raw hitbox stretched to
// fit) or the borrowed frames come out squashed/distorted.
const DISGUISE_SPRITE_DRAW_HEIGHT = 100;

export class Shapeshifter {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 90;

    this.facing = 'left';

    this.health = config.shapeshifterHealth ?? 6;
    this.maxHealth = this.health;
    this.alive = true;

    this.phase = 'normal'; // 'normal' | 'disguise'
    this.phaseTimer = 0;

    this.fireIntervalMin = config.shapeshifterFireIntervalMin ?? FIRE_INTERVAL_MIN;
    this.fireIntervalMax = config.shapeshifterFireIntervalMax ?? FIRE_INTERVAL_MAX;
    this.baseBulletSpeed = config.shapeshifterBulletSpeed ?? 260;
    this.fireTimer = 0;
    this.fireInterval = this.randomFireInterval();
    this.wantsToFire = false;

    this.movementShotCooldown = 0;
    this.wantsToFireMovementShot = false;

    this.hitFlashTimer = 0;

    // Simple disguise-phase animation: idle most of the time, briefly
    // shows the player's shoot pose right when it fires.
    this.disguiseFrameIndex = 0;
    this.disguiseFrameTimer = 0;
    this.disguiseShootPoseTimer = 0;

    // Normal-phase animation: row 0 = idle, row 1 = shoot pose.
    this.normalFrameIndex = 0;
    this.normalFrameTimer = 0;
    this.normalShootPoseTimer = 0;

    // Glitch transition (row 2 of sheet): plays briefly on every
    // phase switch, regardless of direction.
    this.glitchTimer = 0;
    this.glitchFrameIndex = 0;
    this.glitchFrameTimer = 0;
  }

  // Effective bullet speed — 2x during disguise phase.
  get bulletSpeed() {
    return this.phase === 'disguise' ? this.baseBulletSpeed * 2 : this.baseBulletSpeed;
  }

  randomFireInterval() {
    return this.fireIntervalMin + Math.random() * (this.fireIntervalMax - this.fireIntervalMin);
  }

  takeHit() {
    // GameCanvas is responsible for NOT calling this during 'disguise'
    // (redirecting to the player instead) — this method assumes it's
    // only ever called when a hit should actually count.
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = 0.18;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  // Called by GameCanvas the instant the player's x-movement starts
  // (edge-triggered), only while phase === 'disguise'. No-ops if the
  // being isn't alive, isn't disguised, or is still on cooldown.
  triggerMovementShot() {
    if (!this.alive || this.phase !== 'disguise' || this.movementShotCooldown > 0) return;
    this.movementShotCooldown = MOVEMENT_SHOT_COOLDOWN;
    this.wantsToFireMovementShot = true;
  }

  update(dt, playerX) {
    if (!this.alive) return;

    if (typeof playerX === 'number') {
      this.facing = playerX < this.x ? 'left' : 'right';
    }

    this.phaseTimer += dt;
    const currentDuration = this.phase === 'normal' ? NORMAL_DURATION : DISGUISE_DURATION;
    if (this.phaseTimer >= currentDuration) {
      this.phaseTimer = 0;
      this.phase = this.phase === 'normal' ? 'disguise' : 'normal';
      // Trigger the glitch transition animation (row 2).
      this.glitchTimer = GLITCH_DURATION;
      this.glitchFrameIndex = 0;
      this.glitchFrameTimer = 0;
    }

    this.fireTimer += dt;
    if (this.fireTimer >= this.fireInterval) {
      this.fireTimer = 0;
      this.fireInterval = this.randomFireInterval();
      this.wantsToFire = true;
    }

    if (this.movementShotCooldown > 0) {
      this.movementShotCooldown -= dt;
    }

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Glitch transition animation (row 2 of the sheet).
    if (this.glitchTimer > 0) {
      this.glitchTimer -= dt;
      this.glitchFrameTimer += dt;
      if (this.glitchFrameTimer >= GLITCH_FRAME_DURATION) {
        this.glitchFrameTimer = 0;
        this.glitchFrameIndex = (this.glitchFrameIndex + 1) % 4;
      }
    }

    // Disguise-phase idle animation loop, plus a brief shoot-pose flash
    // right after wantsToFire fires (checked by GameCanvas that same
    // frame, so this just tracks the visual timer independently).
    if (this.disguiseShootPoseTimer > 0) {
      this.disguiseShootPoseTimer -= dt;
    } else {
      this.disguiseFrameTimer += dt;
      if (this.disguiseFrameTimer >= 0.15) {
        this.disguiseFrameTimer = 0;
        this.disguiseFrameIndex = (this.disguiseFrameIndex + 1) % 4;
      }
    }

    // Normal-phase idle/shoot animation.
    if (this.normalShootPoseTimer > 0) {
      this.normalShootPoseTimer -= dt;
    } else {
      this.normalFrameTimer += dt;
      if (this.normalFrameTimer >= 0.15) {
        this.normalFrameTimer = 0;
        this.normalFrameIndex = (this.normalFrameIndex + 1) % 4;
      }
    }
  }

  // Called by GameCanvas right when it actually fires, so the disguise
  // draw briefly shows the player's shoot pose instead of idle.
  flashDisguiseShootPose() {
    this.disguiseShootPoseTimer = 0.25;
  }

  // Same idea for the normal phase — briefly shows row 1 (shoot) instead
  // of row 0 (idle).
  flashNormalShootPose() {
    this.normalShootPoseTimer = 0.25;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx, normalSheet, playerSheet, playerExtraSheet) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) {
      const step = Math.floor(this.hitFlashTimer / 0.06);
      if (step % 2 === 0) return;
    }

    // Player's sheet faces right by default — flip when facing left, same
    // convention Player.js itself uses. This was inverted before
    // (`facing === 'right'`), which faced the disguise the wrong way
    // whenever Shapeshifter's own facing (tracks toward the player)
    // didn't happen to match.
    const flip = this.facing === 'left';

    // Glitch transition always uses the shapeshifter's own sheet (row 2),
    // regardless of which phase just started — it's the visual bridge
    // between the two forms. Must share the same aspect-corrected box as
    // the idle/shoot rows below, or the sprite visibly snaps size at the
    // start/end of every transform.
    if (this.glitchTimer > 0) {
      if (normalSheet && normalSheet.loaded) {
        const aspect = normalSheet.frameWidth / normalSheet.frameHeight;
        const drawHeight = DISGUISE_SPRITE_DRAW_HEIGHT;
        const drawWidth = drawHeight * aspect;
        const drawX = this.x + this.width / 2 - drawWidth / 2;
        const drawY = this.y + this.height - drawHeight + 8;
        const drew = normalSheet.draw(ctx, 2, this.glitchFrameIndex, drawX, drawY, drawWidth, drawHeight, flip);
        if (drew) return;
      }
    } else if (this.phase === 'disguise') {
      const stateKey = this.disguiseShootPoseTimer > 0 ? 'shoot' : 'idle';
      const config = ANIM_CONFIG[stateKey];
      const sheet = config.sheet === 'extra' ? playerExtraSheet : playerSheet;

      if (sheet && sheet.loaded) {
        let row, col;
        if (config.cells) {
          [row, col] = config.cells[this.disguiseFrameIndex % config.cells.length];
        } else {
          row = config.row;
          col = this.disguiseFrameIndex;
        }

        // Same aspect-ratio-derived sizing Player.js itself uses — the raw
        // 40x90 hitbox is much narrower/taller than the player sheet's
        // actual cell proportions, so stretching straight into it squashed
        // the disguise badly. Anchored bottom-center on the hitbox so feet
        // still land in the right place.
        const aspect = sheet.frameWidth / sheet.frameHeight;
        const drawHeight = DISGUISE_SPRITE_DRAW_HEIGHT;
        const drawWidth = drawHeight * aspect;
        const drawX = this.x + this.width / 2 - drawWidth / 2;
        const drawY = this.y + this.height - drawHeight;
        const drew = sheet.draw(ctx, row, col, drawX, drawY, drawWidth, drawHeight, flip);
        if (drew) return;
      }
    } else if (normalSheet && normalSheet.loaded) {
      // Normal phase: row 0 = idle, row 1 = shoot.
      const row = this.normalShootPoseTimer > 0 ? 1 : 0;

      // Same aspect-ratio-derived sizing used for the disguise form.
      // Keep the 40x90 hitbox unchanged, but don't stretch the normal
      // sprite into that narrow box.
      const aspect = normalSheet.frameWidth / normalSheet.frameHeight;
      const drawHeight = DISGUISE_SPRITE_DRAW_HEIGHT+10;
      const drawWidth = drawHeight * aspect;
      const drawX = this.x + this.width / 2 - drawWidth / 2;
      const drawY = this.y + this.height - drawHeight+8;

      const drew = normalSheet.draw(
        ctx,
        row,
        this.normalFrameIndex,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
        flip
      );

      if (drew) return;
    }

    // Placeholder fallback — grey silhouette so it's still visibly
    // distinct from a real gunman before real art exists.
    ctx.fillStyle = this.phase === 'disguise' ? '#4a4a6a' : '#6a4a4a';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}