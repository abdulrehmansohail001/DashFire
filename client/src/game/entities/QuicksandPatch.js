// src/game/entities/QuicksandPatch.js
// World 4 obstacle — a glowing ground-level patch, part of the terrain
// rather than a wall: unlike Obstacle/Cactus it is NOT solid, so the
// player can freely walk onto it (no collision blocking). GameCanvas is
// what actually enters/exits the player's "stuck" state on Player.js —
// this class just tracks its own position/size and draws itself, same
// separation of concerns as every other hazard in this codebase (Iceberg
// doesn't know about freeze, Cactus doesn't know about contact damage).
//
// Non-killable — no health field at all, same category as Iceberg/Cactus.
// currently a placeholder glow; swap for a still sprite once art exists.

export class QuicksandPatch {
  constructor(x, y, width = 90, height = 14) {
    this.x = x;
    this.y = y; // sits AT the ground line, not above it — this is ground, not a floating hazard
    this.width = width;
    this.height = height;

    this.pulseTimer = 0; // placeholder-only glow animation, purely cosmetic
  }

  update(dt) {
    this.pulseTimer += dt;
  }

  // Horizontal-only overlap check — GameCanvas calls this against the
  // player's x-range while grounded, not a full AABB overlap, since this
  // patch is walked ONTO (ground-level), not collided with from the side.
  overlapsX(playerX, playerWidth) {
    return playerX + playerWidth > this.x && playerX < this.x + this.width;
  }

  draw(ctx, image) {
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, this.x, this.y, this.width, this.height);
      return;
    }

    // Placeholder: pulsing white-glow patch, ready to swap for a still
    // sprite later — no code changes needed elsewhere when that happens.
    const pulse = 0.5 + 0.5 * Math.sin(this.pulseTimer * 3);
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.25 * pulse;
    ctx.fillStyle = '#f2f6ff';
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 2,
      this.height / 2,
      0, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 2,
      this.height / 2,
      0, 0, Math.PI * 2
    );
    ctx.stroke();
  }
}
