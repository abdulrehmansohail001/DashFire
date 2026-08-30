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
    this.playerStuck = false; // tracks whether to show smoke
  }

  update(dt, playerStuck = false) {
    this.pulseTimer += dt;
    this.playerStuck = playerStuck; // just toggle smoke on/off
  }

  // Horizontal-only overlap check — GameCanvas calls this against the
  // player's x-range while grounded, not a full AABB overlap, since this
  // patch is walked ONTO (ground-level), not collided with from the side.
  overlapsX(playerX, playerWidth) {
    return playerX + playerWidth > this.x && playerX < this.x + this.width;
  }

  // Check if player is FULLY on the patch (both feet) — player's entire
  // horizontal span must be within the patch's bounds to enter quicksand.
  isFullyOn(playerX, playerWidth) {
    return playerX >= this.x && playerX + playerWidth <= this.x + this.width;
  }

  // Constrain a pull target (dark matter dragging the stuck player) so the
  // player cannot be pulled beyond the patch edges. Returns the clamped X.
  constrainPullX(pullTargetX, playerWidth) {
    const minX = this.x; // player's left edge can't go left of patch
    const maxX = this.x + this.width - playerWidth; // player's right edge can't exceed patch right
    return Math.max(minX, Math.min(maxX, pullTargetX));
  }

  draw(ctx, image, smokeImage) {
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, this.x, this.y, this.width, this.height);
    } else {
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

    // Draw smoke when player is stuck
    if (this.playerStuck && smokeImage && smokeImage.complete && smokeImage.naturalWidth > 0) {
      const smokeWidth = this.width * 1.5;
      const smokeHeight = smokeWidth;
      const smokeX = this.x + this.width / 2 - smokeWidth / 2;
      const smokeY = this.y - smokeHeight * 0.6;
      ctx.drawImage(smokeImage, smokeX, smokeY, smokeWidth, smokeHeight);
    }
  }
}
