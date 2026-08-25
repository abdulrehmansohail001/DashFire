// src/game/entities/Player.js
// Player entity: position, physics, input-driven movement, rendering.
// Placeholder rendering = colored rectangle. Swap drawPlaceholder() for
// sprite-sheet drawing later without touching movement/physics logic.

export const GRAVITY = 1800;       // px/s^2
export const JUMP_VELOCITY = -700; // px/s (negative = upward)
export const MOVE_SPEED = 300;     // px/s
export const MAX_JUMPS = 2;        // 1 = single jump only, 2 = adds a mid-air double-jump
export const GROUND_Y = 340;       // y-position of the "floor"
export const CANVAS_WIDTH = 800;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;

    this.vx = 0;
    this.vy = 0;

        this.facing = 'right';
    this.isGrounded = true;
    this.jumpsUsed = 0; // resets to 0 on landing; jump() allowed while jumpsUsed < MAX_JUMPS

    this.health = 3;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
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
  // otherwise landing while the key is still physically held (e.g. from a
  // fast double-tap) re-triggers a jump instantly. GameCanvas is
  // responsible for only calling this once per actual press.
    // Allows MAX_JUMPS total jumps before landing (MAX_JUMPS=2 -> one
  // ground jump + one real mid-air double-jump).
  jump() {
    if (this.jumpsUsed < MAX_JUMPS) {
      this.vy = JUMP_VELOCITY;
      this.isGrounded = false;
      this.jumpsUsed += 1;
    }
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

  draw(ctx) {
    if (this.invulnerable && Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
      return;
    }

    ctx.fillStyle = this.facing === 'right' ? '#3ad1ff' : '#3affb0';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = '#111';
    const noseX = this.facing === 'right' ? this.x + this.width - 6 : this.x;
    ctx.fillRect(noseX, this.y + 10, 6, 6);
  }
}
