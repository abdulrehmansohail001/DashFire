// src/game/entities/Background.js
// Cycles through a 4x4 sprite sheet of background frames (same lunar
// ground in every frame; the planet drifts and stars shimmer smoothly
// across all 16 steps, looping back to frame 1 seamlessly) to give the
// backdrop a sense of slow motion without any parallax-scrolling logic.
// Reuses the existing SpriteSheet class — a background is really just a
// full-canvas-sized "sprite."

export class Background {
  constructor(sheet, frameDuration = 0.5) {
    this.sheet = sheet;
    this.frameDuration = frameDuration; // seconds each background frame holds
    this.timer = 0;

    // Cycles through all 16 cells of the 4x4 sheet, in reading order,
    // matching the frame order requested in the generation prompt.
    this.sequence = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.sequence.push({ row, col });
      }
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
    const { row, col } = this.sequence[this.index];
    const drew = this.sheet.draw(ctx, row, col, 0, 0, canvasWidth, canvasHeight, false);
    if (!drew) {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }
}