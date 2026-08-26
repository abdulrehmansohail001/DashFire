// src/game/entities/Player.js
// Player entity: position, physics, input-driven movement, animation state,
// and rendering via a 4x4 sprite sheet (row = animation, column = frame).
//
// Sprite sheet layout (client/public/sprites/player.png, 313x313 per cell):
//   Row 0: idle   Row 1: run   Row 2: jump   Row 3: shoot
// Run/jump/shoot rows face right by default; when facing left we mirror
// the frame via SpriteSheet's `flip` option rather than needing separate art.

export const GRAVITY = 1800;              // px/s^2
export const JUMP_VELOCITY = -700;        // px/s (negative = upward) — first (ground) jump
export const DOUBLE_JUMP_VELOCITY = -520; // px/s — weaker second (mid-air) jump
export const MOVE_SPEED = 300;            // px/s
export const MAX_JUMPS = 2;               // 1 = single jump only, 2 = adds a mid-air double-jump
export const GROUND_Y = 310;              // y-position of the "floor"
export const CANVAS_WIDTH = 800;

// Animation tuning
const ANIM_ROW = { idle: 0, run: 1, jump: 2, shoot: 3 };
const FRAME_DURATION = { idle: 0.18, run: 0.09, jump: 0.12, shoot: 0.06 }; // seconds per frame, by state
const FRAME_COUNT = 4;
const SHOOT_ANIM_DURATION = 0.25; // how long the "shoot" pose holds after firing

// Visual sprite draw size — independent of the collision hitbox (this.width/
// this.height), since the art has transparent padding around the character.
// Tweak this to make the character look bigger/smaller without touching
// gameplay collision at all.
const SPRITE_DRAW_SIZE = 100;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 90;

    this.vx = 0;
    this.vy = 0;

    this.facing = 'right';
    this.isGrounded = true;
    this.jumpsUsed = 0; // resets to 0 on landing; jump() allowed while jumpsUsed < MAX_JUMPS

    this.health = 3;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.shootCooldown = 0;

    // Animation state
    this.animState = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.shootTimer = 0; // >0 while the shoot pose should be showing
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

  // Jump — must be called only on a fresh keydown edge (not a held key),
  // otherwise holding the key through a landing would re-trigger jumps
  // uncontrollably. GameCanvas only calls this once per actual press.
  // Allows MAX_JUMPS total jumps before landing (MAX_JUMPS=2 -> one
  // ground jump + one real mid-air double-jump).
  jump() {
    if (this.jumpsUsed < MAX_JUMPS) {
      this.vy = this.jumpsUsed === 0 ? JUMP_VELOCITY : DOUBLE_JUMP_VELOCITY;
      this.isGrounded = false;
      this.jumpsUsed += 1;
    }
  }

  // Called by GameCanvas right when a bullet is actually spawned, so the
  // shoot pose is synced with the shot rather than a separate timer drifting.
  triggerShoot() {
    this.shootTimer = SHOOT_ANIM_DURATION;
    this.shootCooldown = 1.0;
  }

  canShoot() {
    return this.shootCooldown <= 0;
  }

  update(dt) {
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
    // Priority: airborne > shooting > running > idle.
    let nextState;
    if (!this.isGrounded) {
      nextState = 'jump';
    } else if (this.shootTimer > 0) {
      nextState = 'shoot';
    } else if (this.vx !== 0) {
      nextState = 'run';
    } else {
      nextState = 'idle';
    }

    if (nextState !== this.animState) {
      this.animState = nextState;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }

    this.frameTimer += dt;
    const duration = FRAME_DURATION[this.animState];
    if (this.frameTimer >= duration) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % FRAME_COUNT;
    }
  }

  takeHit() {
    if (this.invulnerable) return;
    this.health -= 1;
    this.invulnerable = true;
    this.invulnerableTimer = 1.0;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  // spriteSheet is optional — if omitted, or not yet loaded, falls back to
  // the original placeholder rectangle so there's never a blank gap.
  draw(ctx, spriteSheet) {
    if (this.invulnerable && Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
      return;
    }

    if (spriteSheet) {
      const row = ANIM_ROW[this.animState];
      const drawX = this.x + this.width / 2 - SPRITE_DRAW_SIZE / 2;
      const drawY = this.y + this.height - SPRITE_DRAW_SIZE;
      const flip = this.facing === 'left';
      const drew = spriteSheet.draw(
        ctx, row, this.frameIndex, drawX, drawY, SPRITE_DRAW_SIZE, SPRITE_DRAW_SIZE, flip
      );
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