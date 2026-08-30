// src/game/entities/BlackHoleBoss.js
// World 4 boss — flies a fixed-height horizontal bounce patrol across
// the full canvas width (same bounce math as Spaceship). Never fires
// anything itself. Spawns a 2-HP DarkMatterBeing every 2.5-4s (random)
// via wantsToSpawnBeing — GameCanvas enforces the "max 3 ALIVE at once"
// cap (not a total-ever-spawned cap), checking the current alive count
// each time this flag fires, same pattern as World 1's Boss and its
// shield-gunmen.
//
// currentZone ('left' | 'middle' | 'right') is recalculated every frame
// from this boss's own x position, dividing the 800-wide canvas into
// three equal thirds. GameCanvas reads this every frame to drive the
// three zone effects (player bullet slow, being bullet speed-up,
// middle-zone quicksand trap) — this class has zero awareness of any of
// those effects, it only tracks its own position/health/spawn timer.

const ZONE_WIDTH = 800 / 3;

export class BlackHoleBoss {
  constructor(y, config = {}, placement = {}) {
    this.x = placement.startX ?? 400;
    this.y = y;
    this.width = 70;
    this.height = 70;

    this.minX = placement.minX ?? 0;
    this.maxX = placement.maxX ?? (800 - this.width);
    this.speed = config.blackHoleSpeed ?? 80;
    this.vx = this.speed;

    this.health = config.bossHealth ?? 20;
    this.maxHealth = this.health;
    this.alive = true;

    this.spawnIntervalMin = config.blackHoleSpawnIntervalMin ?? 2.5;
    this.spawnIntervalMax = config.blackHoleSpawnIntervalMax ?? 4.0;
    this.spawnTimer = 0;
    this.spawnInterval = this.randomSpawnInterval();
    this.wantsToSpawnBeing = false;

    this.currentZone = 'middle'; // recalculated every update() from actual x

    this.hitFlashTimer = 0;
  }

  randomSpawnInterval() {
    return this.spawnIntervalMin + Math.random() * (this.spawnIntervalMax - this.spawnIntervalMin);
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

    const center = this.x + this.width / 2;
    if (center < ZONE_WIDTH) {
      this.currentZone = 'left';
    } else if (center < ZONE_WIDTH * 2) {
      this.currentZone = 'middle';
    } else {
      this.currentZone = 'right';
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnInterval = this.randomSpawnInterval();
      this.wantsToSpawnBeing = true;
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
      const flip = this.vx < 0;
      const drew = spriteSheet.draw(ctx, 0, 0, this.x, this.y, this.width, this.height, flip);
      if (drew) return;
    }

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.fillStyle = '#05050a';
    ctx.beginPath();
    ctx.arc(cx, cy, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9a4aff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, this.width / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}
