// src/game/entities/DarkMatterBeing.js
// World 4 enemy — a stationary "dark matter" turret. Fires straight at
// the player like a gunman (GameCanvas reuses EnemyBullet directly for
// its shots — same class, same damage, nothing new there). The actual
// blackhole-themed twist — pulling the player toward it after 1.5s of
// stillness — lives on Player (stillTimer/pulled) and is orchestrated by
// GameCanvas, since it depends on how many beings are alive at once, not
// any single being's own state. This class only tracks its own position,
// health, facing, and firing timer — no contact damage of its own.

const STANDING_FRAMES = [0, 1, 2];
const FIRING_FRAMES = [3, 4];
const PULL_FRAMES = [5, 6, 7];
const FRAME_DURATION = 0.12;

export class DarkMatterBeing {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.width = 128;
    this.height = 170;

    this.facing = 'left';

    this.health = config.darkMatterHealth ?? 8;
    this.maxHealth = this.health;
    this.alive = true;

    this.fireIntervalMin = config.darkMatterFireIntervalMin ?? 1.5;
    this.fireIntervalMax = config.darkMatterFireIntervalMax ?? 2.3;
    this.bulletSpeed = config.darkMatterBulletSpeed ?? 260;
    this.fireTimer = 0;
    this.fireInterval = this.randomFireInterval();
    this.wantsToFire = false;

    this.hitFlashTimer = 0;
    this.animationState = 'standing';
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  randomFireInterval() {
    return this.fireIntervalMin + Math.random() * (this.fireIntervalMax - this.fireIntervalMin);
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = 0.18;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  update(dt, playerX, isPlayerPulled = false) {
    if (!this.alive) return;

    if (typeof playerX === 'number') {
      this.facing = playerX < this.x ? 'left' : 'right';
    }

    if (isPlayerPulled) {
      this.animationState = 'pulling';
      this.frameIndex = 0;
      this.frameTimer = 0;
    } else if (this.wantsToFire) {
      this.animationState = 'firing';
    } else {
      this.animationState = 'standing';
    }

    this.fireTimer += dt;
    if (this.fireTimer >= this.fireInterval) {
      this.fireTimer = 0;
      this.fireInterval = this.randomFireInterval();
      this.wantsToFire = true;
      this.animationState = 'firing';
      this.frameIndex = 0;
      this.frameTimer = 0;
    }

    if (this.animationState === 'firing' || this.animationState === 'pulling') {
      this.frameTimer += dt;
      const frameList = this.animationState === 'firing' ? FIRING_FRAMES : PULL_FRAMES;
      if (this.frameTimer >= FRAME_DURATION) {
        this.frameTimer = 0;
        this.frameIndex = (this.frameIndex + 1) % frameList.length;
      }
    } else {
      this.frameTimer += dt;
      if (this.frameTimer >= FRAME_DURATION) {
        this.frameTimer = 0;
        this.frameIndex = (this.frameIndex + 1) % STANDING_FRAMES.length;
      }
    }

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx, spriteSheet) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) {
      const step = Math.floor(this.hitFlashTimer / 0.06);
      if (step % 2 === 0) return;
    }

    if (spriteSheet && spriteSheet.loaded) {
      const frameList = this.animationState === 'firing' ? FIRING_FRAMES : this.animationState === 'pulling' ? PULL_FRAMES : STANDING_FRAMES;
      const frameIndex = frameList[this.frameIndex % frameList.length];
      const row = Math.floor(frameIndex / spriteSheet.columns);
      const col = frameIndex % spriteSheet.columns;
      const drew = spriteSheet.draw(ctx, row, col, this.x, this.y, this.width, this.height, this.facing === 'left');
      if (drew) return;
    }

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.fillStyle = '#0a0a12';
    ctx.beginPath();
    ctx.arc(cx, cy, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a3aff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, this.width / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}
