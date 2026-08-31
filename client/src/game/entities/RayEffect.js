// src/game/entities/RayEffect.js
// Pure visual overlay — wavy orange rays shown in the zone between the
// player and BlackHoleBoss's flight line while the boss is in the LEFT
// third (the player-bullet-slow zone). No gameplay state of its own,
// just a 4-frame looping animation. GameCanvas owns when/where it draws;
// this class only tracks the frame cycle.

const FRAME_DURATION = 0.1;
const FRAME_COUNT = 4;

export class RayEffect {
  constructor() {
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  update(dt) {
    this.frameTimer += dt;
    if (this.frameTimer >= FRAME_DURATION) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % FRAME_COUNT;
    }
  }

  draw(ctx, spriteSheet, x, y, width, height, opacity = 0.5) {
    if (!spriteSheet || !spriteSheet.loaded) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    spriteSheet.draw(ctx, 0, this.frameIndex, x, y, width, height, false);
    ctx.restore();
  }
}