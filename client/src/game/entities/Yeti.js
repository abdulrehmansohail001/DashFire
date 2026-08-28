// src/game/entities/Yeti.js
// Standing Yeti — unlike Enemy (which patrols/jumps) or Eagle (which flies
// a patrol lane), the Yeti plants itself at a fixed spot and never moves.
// It just tracks which way the player currently is (facing flips each
// frame based on playerX, same idea as Enemy's dynamic facing) and, on a
// randomized timer, throws one big ice projectile in that direction.
// Shootable — has health, counts toward the level's win condition,
// GameCanvas polls `wantsToThrow` each frame the same way it polls
// Eagle's `wantsToThrow` / Enemy's `wantsToFire`.

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

    this.throwIntervalMin = config.yetiThrowIntervalMin ?? 1.8;
    this.throwIntervalMax = config.yetiThrowIntervalMax ?? 2.8;
    this.projectileSpeed = config.yetiProjectileSpeed ?? 220;

    this.throwTimer = 0;
    this.throwInterval = this.randomThrowInterval();
    this.wantsToThrow = false;

    // Simple two-state animation until real art: idle vs throw pose.
    this.throwPoseTimer = 0;
  }

  randomThrowInterval() {
    return this.throwIntervalMin + Math.random() * (this.throwIntervalMax - this.throwIntervalMin);
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
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

    this.throwTimer += dt;
    if (this.throwTimer >= this.throwInterval) {
      this.throwTimer = 0;
      this.throwInterval = this.randomThrowInterval();
      this.wantsToThrow = true;
      this.throwPoseTimer = 0.3;
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  // spriteSheet optional — falls back to a placeholder icy silhouette.
  draw(ctx, spriteSheet) {
    if (!this.alive) return;

    if (spriteSheet && spriteSheet.loaded) {
      const flip = this.facing === 'left';
      const row = this.throwPoseTimer > 0 ? 1 : 0; // row 0 = idle, row 1 = throw (once art exists)
      const drew = spriteSheet.draw(ctx, row, 0, this.x, this.y, this.width, this.height, flip);
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