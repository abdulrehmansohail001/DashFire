// src/game/entities/Obstacle.js
// Stationary wall placed between the player and the enemy. Blocks the
// player's walk and the player's bullets, and stops the enemy from
// crossing past it — but enemy bullets pass straight through it, so
// the player has to jump over to get a clean shot in.

export class Obstacle {
  constructor(x, y, width = 44, height = 100) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx, image) {
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, this.x, this.y, this.width, this.height);
      return;
    }
    ctx.fillStyle = '#555';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// AABB collision check
export function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}