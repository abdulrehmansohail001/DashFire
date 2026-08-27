// src/game/entities/Boss.js
// Level 10 final boss — massive, mostly-stationary war machine. Barely
// moves (a tiny visual bob only, hitbox stays fixed), cycles through a
// fixed 6-frame loop: 2 idle frames, 2 charge-up frames, 1 firing frame,
// 1 frame where it summons a basic gunman to shield itself. GameCanvas
// polls `wantsToFire` / `wantsToSpawn` each frame (same pattern as
// Enemy's wantsToFire / Eagle's wantsToThrow) — this class only tracks
// its own animation and health, GameCanvas decides what actually happens.

const FRAME_DURATIONS = [0.6, 0.6, 0.35, 0.35, 0.25, 0.45]; // idle,idle,charge,charge,fire,spawn
const FIRE_FRAME = 4;
const SPAWN_FRAME = 5;

const HIT_FLASH_DURATION = 0.18; // seconds the boss blinks after taking a hit
const HIT_FLASH_INTERVAL = 0.06; // seconds per on/off blink step

const SPRITE_DRAW_HEIGHT = 260; // sheet cells are ~166.67x250 (tall portrait) — scale height, keep aspect
const SPRITE_ASPECT = (500 / 3) / 250;
const SPRITE_DRAW_WIDTH = SPRITE_DRAW_HEIGHT * SPRITE_ASPECT;

export class Boss {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.width = 130;
    this.height = 200;
    this.facing = 'left'; // never turns — always faces the player's side

    this.health = config.bossHealth ?? 25;
    this.maxHealth = this.health;
    this.alive = true;

    this.frameIndex = 0;
    this.frameTimer = 0;
    this.bobTimer = 0;

        this.wantsToFire = false;
    this.wantsToSpawn = false;
    this.hitFlashTimer = 0; // >0 while blinking from a recent hit
  }
  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = HIT_FLASH_DURATION; // blink regardless of whether this kills it
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  update(dt) {
    if (!this.alive) return;

    this.bobTimer += dt; // visual-only sway, hitbox never moves

    this.frameTimer += dt;
    const duration = FRAME_DURATIONS[this.frameIndex];
    if (this.frameTimer >= duration) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % FRAME_DURATIONS.length;

      if (this.frameIndex === FIRE_FRAME) {
        this.wantsToFire = true;
      } else if (this.frameIndex === SPAWN_FRAME) {
        this.wantsToSpawn = true;
      }
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx, spriteSheet) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) {
      const step = Math.floor(this.hitFlashTimer / HIT_FLASH_INTERVAL);
      if (step % 2 === 0) return; // blink: skip this frame
    }

    const bob = Math.sin(this.bobTimer * 2) * 3; // barely-there hover motion

        if (spriteSheet && spriteSheet.loaded) {
      const col = this.frameIndex % 3;
      const row = Math.floor(this.frameIndex / 3);
      const drawX = this.x + this.width / 2 - SPRITE_DRAW_WIDTH / 2;
      const drawY = this.y + this.height - SPRITE_DRAW_HEIGHT + bob;
      const drew = spriteSheet.draw(
        ctx, row, col, drawX, drawY, SPRITE_DRAW_WIDTH, SPRITE_DRAW_HEIGHT, false
      );
      if (drew) return;
    }

    ctx.fillStyle = '#3a0a0a';
    ctx.fillRect(this.x, this.y + bob, this.width, this.height);
    ctx.fillStyle = '#ff2a2a';
    ctx.beginPath();
    ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.2 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}