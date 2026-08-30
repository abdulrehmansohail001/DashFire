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

// Freeze-crystal overlay: a 4-frame sheet where each frame's own artwork
// is bottom-aligned within its (identical-sized) frame slot — smallest
// crystal near the bottom, tallest filling most of it. Because the
// destination draw box stays the SAME size every frame, cycling through
// the 4 frames alone produces the "grows up from the ground" effect with
// no extra scaling logic needed here.
const FREEZE_FRAME_COUNT = 4;
const FREEZE_FRAME_DURATION = 0.09; // quick growth — reaches full height in ~0.36s, then holds

// Vortex teleport-blink: 4 ghost frames flicker at the new (mirrored)
// position before the real sprite resumes. If a dedicated ghostSheet is
// passed into draw() and loaded, its own frames are used; otherwise this
// falls back to redrawing the player's current pose at fading alpha —
// see the ghostSheet branch in draw() below.
const GHOST_FRAME_DURATION = 0.08; // seconds per ghost step
const GHOST_FRAME_COUNT = 4;
const GHOST_ALPHA_LEVELS = [0.75, 0.55, 0.35, 0.2];

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

    // Freeze status (World 3+): a freeze-capable hit damages AND locks all
    // input (move/jump/shoot) for frozenTimer seconds. Deliberately
    // independent of invulnerableTimer — freeze duration (1-1.5s) is
    // randomized to run slightly LONGER than the 1s invulnerability window,
    // so there's a real gap where the player is frozen but no longer
    // invulnerable, and a second qualifying hit in that gap lands fresh
    // damage + its own new freeze. That's the intended risk, not a bug.
    this.frozen = false;
    this.frozenTimer = 0;
    this.freezeAnimTimer = 0; // resets to 0 every fresh freeze hit; drives the crystal growth frame
    this.teleportCooldownTimer = 0; // guards Vortex's mirror-teleport from re-triggering instantly
    this.teleportGhostActive = false; // true for the 4-step ghost-blink window right after a teleport
    this.teleportGhostTimer = 0;

    // World 4 DarkMatterBeing pull: stillTimer counts up while grounded +
    // not moving (shooting does NOT reset it); GameCanvas starts a pull
    // once it hits 1.0s and at least one being is alive. pullSpeed/
    // pullTargetX are updated live every frame by GameCanvas while pulled
    // is true (see startPull/updatePullTarget/endPull below).
    this.stillTimer = 0;
    this.pulled = false;
    this.pulledTimer = 0;
    this.pullTargetX = 0;
    this.pullSpeed = 0;

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
    if (this.frozen || this.pulled) {
      this.vx = 0;
      return;
    }
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
    if (this.frozen || this.pulled) return;
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
    return this.shootCooldown <= 0 && !this.frozen && !this.teleportGhostActive;
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

    if (this.pulled) {
      const dir = this.pullTargetX > this.x ? 1 : -1;
      const step = this.pullSpeed * dt;
      if (Math.abs(this.pullTargetX - this.x) <= step) {
        this.x = this.pullTargetX;
      } else {
        this.x += dir * step;
      }

      // While being pulled, the run cycle should always face away from the
      // dark-matter source so it reads like the player is struggling against
      // the drag, regardless of which way they were facing when the pull
      // started.
      this.facing = this.pullTargetX < this.x ? 'right' : 'left';
    }

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

    if (this.frozen) {
      this.frozenTimer -= dt;
      this.freezeAnimTimer += dt;
      if (this.frozenTimer <= 0) {
        this.frozen = false;
      }
    }

    if (this.teleportCooldownTimer > 0) {
      this.teleportCooldownTimer -= dt;
    }

    if (this.teleportGhostActive) {
      this.teleportGhostTimer += dt;
      if (this.teleportGhostTimer >= GHOST_FRAME_DURATION * GHOST_FRAME_COUNT) {
        this.teleportGhostActive = false;
      }
    }

    if (this.pulled) {
      this.pulledTimer -= dt;
      if (this.pulledTimer <= 0) {
        this.endPull();
      }
    } else if (this.isGrounded && this.vx === 0) {
      this.stillTimer += dt;
    } else {
      this.stillTimer = 0;
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
    // outroLocked (death/victory) must always be allowed to play out, even
    // if the player is also frozen — otherwise a freeze-hit that brings
    // health to 0 permanently soft-locks the game: frozen would return
    // here every frame, animComplete would never become true, and the
    // frozenTimer countdown itself only lives in the physics block that
    // outroLocked already skips, so frozen would never even expire on its
    // own. Death/victory takes priority over the frozen pose-hold.
    if (this.frozen && !this.outroLocked) return; // pose holds entirely — no state change, no frame advance

    if (!this.outroLocked) {
      // Priority: airborne > shooting > sitting > pulled/run > idle.
      let nextState;
      if (!this.isGrounded) {
        nextState = 'jump';
      } else if (this.shootTimer > 0) {
        nextState = 'shoot';
      } else if (this.isSitting) {
        nextState = 'sit';
      } else if (this.pulled || this.vx !== 0) {
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

  // Freeze-capable hit — same invulnerability gate as a normal hit (so this
  // doesn't stack/double-dip during the 1s post-hit window), but ALSO locks
  // the player for a randomized 1-1.5s. Used by Yeti, icy bees, and the
  // freezing cactus.
  takeFreezeHit(freezeMin = 1.0, freezeMax = 1.5) {
    if (this.invulnerable) return;
    this.health -= 1;
    this.invulnerable = true;
    this.invulnerableTimer = 1.0;
    this.frozen = true;
    this.frozenTimer = freezeMin + Math.random() * (freezeMax - freezeMin);
    this.freezeAnimTimer = 0;
  }

  // Freeze WITHOUT damage — deliberately does NOT touch `invulnerable`.
  // That flag also gates every OTHER damage source (takeHit/takeFreezeHit
  // both bail out while invulnerable) and drives the hurt-blink render, so
  // setting it here would wrongly make the player immune to real attacks
  // AND blink as if hurt, while just standing frozen from a harmless
  // obstacle. Re-trigger while still in contact is instead guarded by
  // `frozen` itself — can't re-freeze while already frozen, and by the
  // time it wears off the iceberg has drifted (see GameCanvas pushback).
  freezeOnly(freezeMin = 1.0, freezeMax = 1.5) {
    if (this.frozen) return;
    this.frozen = true;
    this.frozenTimer = freezeMin + Math.random() * (freezeMax - freezeMin);
    this.freezeAnimTimer = 0;
  }

  // Starts a pull toward targetX at the given speed. Does nothing if
  // already mid-pull (GameCanvas should call updatePullTarget instead in
  // that case to keep the target/speed live-updated each frame).
  startPull(targetX, speed) {
    if (this.pulled) return;
    this.pulled = true;
    this.pulledTimer = 1.5;
    this.pullTargetX = targetX;
    this.pullSpeed = speed;
  }

  // Called every frame while pulled is true, so the target/speed stay
  // current as beings die or the closest one changes.
  updatePullTarget(targetX, speed) {
    if (!this.pulled) return;
    this.pullTargetX = targetX;
    this.pullSpeed = speed;
  }

  // Ends the pull early (all beings died) or naturally (timer ran out —
  // called internally from update()). Resets stillTimer so a fresh 1.5s
  // window starts immediately after.
  endPull() {
    this.pulled = false;
    this.pulledTimer = 0;
    this.stillTimer = 0;
  }

  teleportMirror(canvasWidth = 800) {
    if (this.teleportCooldownTimer > 0) return;
    this.x = canvasWidth - this.x - this.width;
    this.teleportCooldownTimer = 0.75;
    this.teleportGhostActive = true;
    this.teleportGhostTimer = 0;
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
   draw(ctx, mainSheet, extraSheet, freezeSheet, ghostSheet) {
    // Only the player's OWN sprite should flicker during invulnerability —
    // the freeze crystal overlay is drawn unconditionally further down, so
    // it no longer blinks in sync with this. Ghost phase takes priority
    // over the invuln blink (they can't both be steering opacity at once).
    const isGhostPhase = this.teleportGhostActive;
    const skipSpriteThisFrame =
      !this.outroLocked && !isGhostPhase && this.invulnerable && Math.floor(this.invulnerableTimer * 10) % 2 === 0;

    if (!skipSpriteThisFrame) {
      let drew = false;

      // TODO (dedicated ghost art): once a real ghost sheet exists, this
      // branch draws ITS frames (indexed by ghostStep, 0-3) instead of the
      // fallback. Nothing else in this file needs to change — just make
      // sure GameCanvas passes a loaded ghostSheet into player.draw().
      if (isGhostPhase && ghostSheet && ghostSheet.loaded) {
        const ghostStep = Math.min(
          GHOST_FRAME_COUNT - 1,
          Math.floor(this.teleportGhostTimer / GHOST_FRAME_DURATION)
        );
        const aspect = ghostSheet.frameWidth / ghostSheet.frameHeight;
        const drawHeight = SPRITE_DRAW_HEIGHT;
        const drawWidth = SPRITE_DRAW_HEIGHT * aspect;
        const drawX = this.x + this.width / 2 - drawWidth / 2;
        const drawY = this.y + this.height - drawHeight;
        const flip = this.facing === 'left';

        drew = ghostSheet.draw(ctx, 0, ghostStep, drawX, drawY, drawWidth, drawHeight, flip);
      }

      if (!drew) {
        const config = ANIM_CONFIG[this.animState];
        const sheet = config.sheet === 'extra' ? extraSheet : mainSheet;

        ctx.save();
        if (isGhostPhase) {
          const ghostStep = Math.min(
            GHOST_FRAME_COUNT - 1,
            Math.floor(this.teleportGhostTimer / GHOST_FRAME_DURATION)
          );
          ctx.globalAlpha = GHOST_ALPHA_LEVELS[ghostStep];
        }

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

          drew = sheet.draw(ctx, row, col, drawX, drawY, drawWidth, drawHeight, flip);
        }

        if (!drew) {
          // Placeholder rectangle fallback (sheet missing/not loaded yet)
          ctx.fillStyle = this.facing === 'right' ? '#3ad1ff' : '#3affb0';
          ctx.fillRect(this.x, this.y, this.width, this.height);

          ctx.fillStyle = '#111';
          const noseX = this.facing === 'right' ? this.x + this.width - 6 : this.x;
          ctx.fillRect(noseX, this.y + 10, 6, 6);
        }
        ctx.restore();
      }
    }

    if (this.frozen) {
      let drewCrystals = false;

      if (freezeSheet && freezeSheet.loaded) {
        const frameIdx = Math.min(
          FREEZE_FRAME_COUNT - 1,
          Math.floor(this.freezeAnimTimer / FREEZE_FRAME_DURATION)
        );
        const aspect = freezeSheet.frameWidth / freezeSheet.frameHeight;
        // Single centered cluster, not a flanking pair — size off height
        // like a normal overlay, growing from the feet up.
        const crystalHeight = this.height * 0.9;
        const crystalWidth = crystalHeight * aspect;
        const crystalX = this.x + this.width / 2 - crystalWidth / 2;
        const crystalY = this.y + this.height - crystalHeight; // bottom-anchored to the feet

        drewCrystals = freezeSheet.draw(ctx, 0, frameIdx, crystalX, crystalY, crystalWidth, crystalHeight, false);
      }

      if (!drewCrystals) {
        // Fallback rectangle overlay (sheet missing/not loaded yet)
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#8fe9ff';
        ctx.fillRect(this.x - 4, this.y - 4, this.width + 8, this.height + 8);
        ctx.restore();

        ctx.strokeStyle = '#d6faff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 4, this.y - 4, this.width + 8, this.height + 8);
      }
    }
  }
}