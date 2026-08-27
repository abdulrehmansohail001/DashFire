// src/game/entities/Background.js
// Cycles through a 1x8 horizontal sprite sheet of background frames 
// (same lunar ground in every frame; the planet drifts and stars shimmer smoothly
// across all 8 steps, looping back seamlessly) to give the backdrop a sense of 
// slow motion. Reuses the existing SpriteSheet class.

export class Background {
  constructor(sheet, frameDuration = 0.5) {
    this.sheet = sheet;
    this.frameDuration = frameDuration; // seconds each background frame holds
    this.timer = 0;

    // Cycles through all 8 cells of the 1x8 horizontal strip.
    // Row is always 0 because all frames are in a single line.
    this.sequence = [];
    for (let col = 0; col < 8; col++) {
      this.sequence.push({ row: 0, col });
    }
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
    if (!this.sheet || !this.sheet.loaded) {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      return;
    }

    const { row, col } = this.sequence[this.index];

    // Delegate directly to your SpriteSheet's built-in draw method
    this.sheet.draw(ctx, row, col, 0, 0, canvasWidth, canvasHeight);
  }
}
