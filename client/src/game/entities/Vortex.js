// src/game/entities/Vortex.js
// World 4 "logic bender" enemy — a floating patrol that hovers at a lower
// fixed height than the earlier eagle patrollers. It uses a sprite-sheet
// animation instead of a canvas-spin effect, keeping the motion readable and
// consistent with the rest of the game's framed enemies.
//
// The twist: on contact it deals damage AND calls player.teleportMirror(),
// which snaps the player to the mirrored x position across the arena's
// horizontal center. Standing near an edge is what makes this dangerous
// (mirrors you all the way across); standing near the middle barely moves
// you. GameCanvas is responsible for calling takeHit()/teleportMirror() on
// overlap, not this class — Vortex only tracks its own movement/animation/
// health, same separation of concerns as Enemy (which doesn't know about
// EnemyBullet spawning logic either).

const FRAME_COUNT = 8;
const FRAME_DURATION = 0.09;
const HIT_FLASH_INTERVAL = 0.06;

export class Vortex {
  constructor(y, config = {}, placement = {}) {
    this.x = placement.startX ?? 400;
    this.y = y;
    this.width = 70;
    this.height = 70;

    this.minX = placement.minX ?? 0;
    this.maxX = placement.maxX ?? (800 - this.width);
    this.speed = config.vortexSpeed ?? 90;
    this.vx = this.speed;

    this.frameIndex = 0;
    this.frameTimer = 0;

    this.health = config.vortexHealth ?? 6;
    this.maxHealth = this.health;
    this.alive = true;

    this.hitFlashTimer = 0;
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = 0.18;
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

    this.frameTimer += dt;
    if (this.frameTimer >= FRAME_DURATION) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % FRAME_COUNT;
    }

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
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
      const row = Math.floor(this.frameIndex / 4);
      const col = this.frameIndex % 4;
      const drew = spriteSheet.draw(ctx, row, col, this.x, this.y, this.width, this.height);
      if (drew) return;
    }

    ctx.fillStyle = '#6a3aa0';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#c9a6ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 3.2; a += 0.2) {
      const r = (a / (Math.PI * 3.2)) * (this.width / 2 - 4);
      const px = this.x + this.width / 2 + Math.cos(a) * r;
      const py = this.y + this.height / 2 + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}
