// src/game/entities/Cactus.js
// Stationary hazard — an Obstacle/Frog hybrid: solid like the wall
// obstacle (blocks the player's walk and the player's bullets, same
// asymmetric rule as Obstacle — enemy bullets pass straight through, so
// jumping over it still gets you a clean shot), but ALSO hurts on contact
// like the frog does. No cooldown logic needed here — player.takeHit()
// already has its own 1s invulnerability window, so standing against it
// doesn't drain HP every single frame.

export class Cactus {
  constructor(x, y, width = 40, height = 90) {
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
    // Placeholder: a simple green cactus silhouette until real art exists
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(this.x + this.width * 0.3, this.y, this.width * 0.4, this.height);
    ctx.fillRect(this.x, this.y + this.height * 0.35, this.width * 0.3, this.height * 0.25);
    ctx.fillRect(this.x + this.width * 0.7, this.y + this.height * 0.25, this.width * 0.3, this.height * 0.25);
  }
}