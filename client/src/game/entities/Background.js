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

    // Cycles through every cell of the sheet, row-major, regardless of
    // grid shape — a 1x8 horizontal strip and a 4x2 grid both just work,
    // reading whatever columns/rows the sheet was actually built with.
    // Guarded against a missing sheet (a world with no background art
    // yet, like World 4 on day one) — falls back to a single dummy frame
    // instead of crashing, and draw() already renders the dark fallback
    // fill in that case anyway.
    this.sequence = [];
    if (sheet) {
      for (let row = 0; row < sheet.rows; row++) {
        for (let col = 0; col < sheet.columns; col++) {
          this.sequence.push({ row, col });
        }
      }
    } else {
      this.sequence = [{ row: 0, col: 0 }];
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
