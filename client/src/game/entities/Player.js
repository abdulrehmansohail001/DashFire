// src/game/entities/Player.js
// Player entity: position, physics, input-driven movement, animation state,
// and rendering via TWO 4x4 sprite sheets.
//
// Main sheet (client/public/sprites/player.png, 313x313/cell):
//   Row 0: idle   Row 1: run   Row 2: jump   Row 3: shoot
// Extra sheet (client/public/sprites/player_extra.png, 343x286/cell):
//   Row 0: sit (4-frame transition, holds final seated frame while held)
//   Row 1-2: death (one continuous 8-frame fall, spans both rows)
//   Row 3: victory (4-frame build-up, holds final pose)
//
// Run/jump/shoot rows face right by default; when facing left we mirror
// the frame via SpriteSheet's `flip` option rather than needing separate art.
//
// Death/victory are "outro" animations: once triggered via triggerDeath()/
// triggerVictory(), the player is "outroLocked" — update() skips ALL physics
// (gravity, movement, ground clamp) and only advances the animation frame,
// so the character freezes in place and just plays the sequence once.
// GameCanvas polls `animComplete` to know when it's safe to show the
// result screen / accept restart input.

export const GRAVITY = 1800;              // px/s^2
export const JUMP_VELOCITY = -700;        // px/s (negative = upward) — first (ground) jump
export const DOUBLE_JUMP_VELOCITY = -520; // px/s — weaker second (mid-air) jump
export const MOVE_SPEED = 300;            // px/s
export const MAX_JUMPS = 2;               // 1 = single jump only, 2 = adds a mid-air double-jump
export const GROUND_Y = 310;              // y-position of the hitbox top when grounded
export const CANVAS_WIDTH = 800;

// Per-animation config: which sheet, which row(s), how many frames, and
// whether it loops or holds its final frame once it reaches the end.
// `cells` (death only) is an explicit [row, col] list for animations that
// span more than one row of a sheet; everything else uses `row` + a
// straight 0..frames-1 column walk.
const ANIM_CONFIG = {
  idle:    { sheet: 'main',  row: 0, frames: 4, loop: true },
  run:     { sheet: 'main',  row: 1, frames: 4, loop: true },
  jump:    { sheet: 'main',  row: 2, frames: 4, loop: true },
  shoot:   { sheet: 'main',  row: 3, frames: 4, loop: true },
    sit:     { sheet: 'extra', cells: [[0, 0], [0, 1], [0, 2], [0, 2]], loop: false },
  death:   { sheet: 'extra', cells: [[1, 0], [1, 1], [1, 2], [1, 3], [2, 0], [2, 1], [2, 2], [2, 3]], loop: false },
  victory: { sheet: 'extra', row: 3, frames: 4, loop: false },
};

const FRAME_DURATION = {
  idle: 0.18, run: 0.09, jump: 0.12, shoot: 0.06,
  sit: 0.1, death: 0.12, victory: 0.15,
};
const SHOOT_ANIM_DURATION = 0.25; // how long the "shoot" pose holds after firing

// Visual sprite draw size — independent of the collision hitbox (this.width/
// this.height), since the art has transparent padding around the character.
// Height is fixed; width is derived per-sheet from that sheet's own cell
// aspect ratio (main sheet is square so this is a no-op there; the extra
// sheet's cells are wider than tall, so sit/death frames draw wider
// automatically instead of being squished into a square box).
const SPRITE_DRAW_HEIGHT = 100;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // Hitbox spans roughly the full sprite (head to feet), not just the
    // legs — a shorter box left the head outside collision range entirely.
    this.width = 40;
    this.height = 90;

    this.vx = 0;
    this.vy = 0;

    this.facing = 'right';
    this.isGrounded = true;
    this.jumpsUsed = 0; // resets to 0 on landing; jump() allowed while jumpsUsed < MAX_JUMPS

    this.health = 10;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.shootCooldown = 0;

    this.isSitting = false; // set every frame from GameCanvas based on ArrowDown held

    // Animation state
    this.animState = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.shootTimer = 0;      // >0 while the shoot pose should be showing
    this.outroLocked = false; // true once death/victory has been triggered
    this.animComplete = false; // true once a non-looping animation reaches & holds its final frame
  }

  // Movement only — held-key state, safe to read every frame.
  handleInput(keys) {
    if (keys['ArrowLeft'] || keys['a']) {
      this.vx = -MOVE_SPEED;
      this.facing = 'left';
    } else if (keys['ArrowRight'] || keys['d']) {
      this.vx = MOVE_SPEED;
      this.facing = 'right';
    } else {
      this.vx = 0;
    }
  }

  // Called every frame with whether ArrowDown is currently held. Sitting is
  // a held pose, not a discrete action — jump/shoot still take priority (see
  // updateAnimation), so this is safe to call unconditionally.
  setSitting(isDown) {
    this.isSitting = isDown;
  }

  // Jump — must be called only on a fresh keydown edge (not a held key).
  // Allows MAX_JUMPS total jumps before landing (MAX_JUMPS=2 -> one ground
  // jump + one real mid-air double-jump).
  jump() {
    if (this.jumpsUsed < MAX_JUMPS) {
      this.vy = this.jumpsUsed === 0 ? JUMP_VELOCITY : DOUBLE_JUMP_VELOCITY;
      this.isGrounded = false;
      this.jumpsUsed += 1;
    }
  }

  triggerShoot() {
    this.shootTimer = SHOOT_ANIM_DURATION;
    this.shootCooldown = 1.0;
  }

  canShoot() {
    return this.shootCooldown <= 0;
  }

  // Locks the player into the death sequence: freezes physics, plays the
  // 8-frame fall once, then holds the final frame. GameCanvas checks
  // animComplete to know when to reveal the game-over screen.
  triggerDeath() {
    this.outroLocked = true;
    this.animState = 'death';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.animComplete = false;
  }

  // Same idea for the victory pose, triggered once all enemies are dead.
  triggerVictory() {
    this.outroLocked = true;
    this.animState = 'victory';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.animComplete = false;
  }

  update(dt) {
    if (this.outroLocked) {
      // Death/victory: no physics, no input — just advance the held animation.
      this.updateAnimation(dt);
      return;
    }

    this.vy += GRAVITY * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      this.isGrounded = true;
      this.jumpsUsed = 0; // landed — refill jumps
    }

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;

    if (this.invulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }

    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    if (this.shootTimer > 0) {
      this.shootTimer -= dt;
    }

    this.updateAnimation(dt);
  }

  updateAnimation(dt) {
    if (!this.outroLocked) {
      // Priority: airborne > shooting > sitting > running > idle.
      let nextState;
      if (!this.isGrounded) {
        nextState = 'jump';
      } else if (this.shootTimer > 0) {
        nextState = 'shoot';
      } else if (this.isSitting) {
        nextState = 'sit';
      } else if (this.vx !== 0) {
        nextState = 'run';
      } else {
        nextState = 'idle';
      }

      if (nextState !== this.animState) {
        this.animState = nextState;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.animComplete = false;
      }
    }

    const config = ANIM_CONFIG[this.animState];
    const totalFrames = config.cells ? config.cells.length : config.frames;

    this.frameTimer += dt;
    const duration = FRAME_DURATION[this.animState];
    if (this.frameTimer >= duration) {
      this.frameTimer = 0;

      if (config.loop) {
        this.frameIndex = (this.frameIndex + 1) % totalFrames;
      } else if (this.frameIndex < totalFrames - 1) {
        this.frameIndex += 1;
        if (this.frameIndex === totalFrames - 1) this.animComplete = true;
      } else {
        this.animComplete = true; // already on the held final frame
      }
    }
  }

  takeHit() {
    if (this.invulnerable) return;
    this.health -= 1;
    this.invulnerable = true;
    this.invulnerableTimer = 1.0;
  }

  // Shield pickup — reuses the same invulnerable/flicker system as the
  // post-hit grace period, just for a longer duration and without a health
  // change.
  grantShield(durationSec) {
    this.invulnerable = true;
    this.invulnerableTimer = Math.max(this.invulnerableTimer, durationSec);
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  // mainSheet/extraSheet are optional — if the one this animState needs
  // isn't loaded yet, falls back to the original placeholder rectangle so
  // there's never a blank gap.
  draw(ctx, mainSheet, extraSheet) {
    // Skip the hit-flicker while an outro is playing — invulnerable is
    // often still true from the hit that triggered death, and flickering
    // through the death animation looks glitchy rather than intentional.
    if (!this.outroLocked && this.invulnerable && Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
      return;
    }

    const config = ANIM_CONFIG[this.animState];
    const sheet = config.sheet === 'extra' ? extraSheet : mainSheet;

    if (sheet && sheet.loaded) {
      let row, col;
      if (config.cells) {
        [row, col] = config.cells[this.frameIndex];
      } else {
        row = config.row;
        col = this.frameIndex;
      }

      const aspect = sheet.frameWidth / sheet.frameHeight;
      const drawHeight = SPRITE_DRAW_HEIGHT;
      const drawWidth = SPRITE_DRAW_HEIGHT * aspect;
      const drawX = this.x + this.width / 2 - drawWidth / 2;
      const drawY = this.y + this.height - drawHeight;
      const flip = this.facing === 'left';

      const drew = sheet.draw(ctx, row, col, drawX, drawY, drawWidth, drawHeight, flip);
      if (drew) return;
    }

    // Placeholder rectangle fallback (sheet missing/not loaded yet)
    ctx.fillStyle = this.facing === 'right' ? '#3ad1ff' : '#3affb0';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = '#111';
    const noseX = this.facing === 'right' ? this.x + this.width - 6 : this.x;
    ctx.fillRect(noseX, this.y + 10, 6, 6);
  }
}