// src/game/entities/Vortex.js
// World 4 "logic bender" enemy — a single static sprite (no frame sheet;
// the spin is done in code via canvas rotation, not animation frames)
// that floats back-and-forth across the arena at a fixed height, like
// Eagle's patrol. Killable — has health, counts toward the win condition.
//
// The twist: on contact it deals damage AND calls player.teleportMirror(),
// which snaps the player to the mirrored x position across the arena's
// horizontal center. Standing near an edge is what makes this dangerous
// (mirrors you all the way across); standing near the middle barely moves
// you. GameCanvas is responsible for calling takeHit()/teleportMirror() on
// overlap, not this class — Vortex only tracks its own movement/rotation/
// health, same separation of concerns as Enemy (which doesn't know about
// EnemyBullet spawning logic either).

export class Vortex {
  constructor(y, config = {}, placement = {}) {
    this.x = placement.startX ?? 400;
    this.y = y;
    this.width = 56;
    this.height = 56;

    this.minX = placement.minX ?? 0;
    this.maxX = placement.maxX ?? (800 - this.width);
    this.speed = config.vortexSpeed ?? 90;
    this.vx = this.speed;

    this.rotation = 0;
    this.rotationSpeed = config.vortexRotationSpeed ?? 3.2; // radians/sec

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

    this.rotation += this.rotationSpeed * dt;
    if (this.rotation > Math.PI * 2) this.rotation -= Math.PI * 2;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx, image) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) {
      const step = Math.floor(this.hitFlashTimer / 0.06);
      if (step % 2 === 0) return;
    }

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      ctx.fillStyle = '#6a3aa0';
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#c9a6ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 3.2; a += 0.2) {
        const r = (a / (Math.PI * 3.2)) * (this.width / 2 - 4);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-8, -4, 4, 0, Math.PI * 2);
      ctx.arc(8, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-8, -4, 2, 0, Math.PI * 2);
      ctx.arc(8, -4, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
