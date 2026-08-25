// src/game/entities/Background.js
// Cycles through a 2x2 sprite sheet of background frames (same lunar
// ground in every frame, only sky elements like stars/planet position
// differ) to give the illusion of a subtly-alive backdrop without any
// parallax scrolling logic. Reuses the existing SpriteSheet class — a
// background is really just a full-canvas-sized "sprite."

export class Background {
  constructor(sheet, frameDuration = 2.0) {
    this.sheet = sheet;
    this.frameDuration = frameDuration; // seconds each background frame holds
    this.timer = 0;

    // Cycles through all 4 quadrants of the sheet in order.
    this.sequence = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ];
    this.index = 0;
  }

  update(dt) {
    this.timer += dt;
    if (this.timer >= this.frameDuration) {
      this.timer = 0;
      this.index = (this.index + 1) % this.sequence.length;
    }
  }

  draw(ctx, canvasWidth, canvasHeight) {
    const { row, col } = this.sequence[this.index];
    const drew = this.sheet.draw(ctx, row, col, 0, 0, canvasWidth, canvasHeight, false);
    if (!drew) {
      // Flat fallback while the image loads, so there's never a blank frame.
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }
}