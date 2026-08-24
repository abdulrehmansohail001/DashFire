// src/game/entities/Enemy.js
// Enemy gunman: stationary placeholder for now. Fires spawn from its position
// (handled by ObstacleSpawner). 1 hit from a player bullet kills it.

export class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;

    this.health = 1;
    this.alive = true;
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.fillStyle = '#a83232';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // gun nozzle, pointing left toward the player
    ctx.fillStyle = '#111';
    ctx.fillRect(this.x - 6, this.y + 10, 6, 6);
  }
}