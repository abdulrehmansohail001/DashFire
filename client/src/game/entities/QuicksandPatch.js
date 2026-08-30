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
//
// Smoke animation state machine (8-frame sheet, 4 cols x 2 rows,
// row-major 0-7): frames 0-2 play once when the player first gets stuck
// (rising smoke), then loops frames 2-5 continuously while still stuck,
// then plays frames 6-7 once when released (dissipating), then goes
// fully idle (no smoke) until the next time the player gets stuck.

const ENTER_FRAME_DURATION = 0.12;
const STUCK_FRAME_DURATION = 0.15;
const RELEASE_FRAME_DURATION = 0.15;

export class QuicksandPatch {
  constructor(x, y, width = 90, height = 14) {
    this.x = x;
    this.y = y; // sits AT the ground line, not above it — this is ground, not a floating hazard
    this.width = width;
    this.height = height;

    this.pulseTimer = 0; // placeholder-only glow animation, purely cosmetic

    this.playerStuck = false;
    this.smokeState = 'idle'; // 'idle' | 'entering' | 'stuck' | 'releasing'
    this.smokeFrame = 0;
    this.smokeTimer = 0;
  }

  update(dt, playerStuck = false) {
    this.pulseTimer += dt;

    const wasStuck = this.playerStuck;
    this.playerStuck = playerStuck;

    if (playerStuck && !wasStuck) {
      this.smokeState = 'entering';
      this.smokeFrame = 0;
      this.smokeTimer = 0;
    } else if (!playerStuck && wasStuck) {
      this.smokeState = 'releasing';
      this.smokeFrame = 6;
      this.smokeTimer = 0;
    }

    if (this.smokeState === 'entering') {
      this.smokeTimer += dt;
      if (this.smokeTimer >= ENTER_FRAME_DURATION) {
        this.smokeTimer = 0;
        this.smokeFrame += 1;
        if (this.smokeFrame > 2) {
          this.smokeFrame = 2;
          this.smokeState = 'stuck';
        }
      }
    } else if (this.smokeState === 'stuck') {
      this.smokeTimer += dt;
      if (this.smokeTimer >= STUCK_FRAME_DURATION) {
        this.smokeTimer = 0;
        this.smokeFrame += 1;
        if (this.smokeFrame > 5) this.smokeFrame = 2; // loops 2-3-4-5
      }
    } else if (this.smokeState === 'releasing') {
      this.smokeTimer += dt;
      if (this.smokeTimer >= RELEASE_FRAME_DURATION) {
        this.smokeTimer = 0;
        this.smokeFrame += 1;
        if (this.smokeFrame > 7) {
          this.smokeState = 'idle';
          this.smokeFrame = 0;
        }
      }
    }
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

  draw(ctx, image, smokeSheet) {
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

    if (this.smokeState !== 'idle' && smokeSheet && smokeSheet.loaded) {
      const SMOKE_Y_NUDGE = 14; // pushes the base down so it actually touches the ground, was floating above it
      const smokeWidth = this.width * 0.9; // was 1.5 — too big
      const smokeHeight = smokeWidth * (smokeSheet.frameHeight / smokeSheet.frameWidth);
      const smokeX = this.x + this.width / 2 - smokeWidth / 2;
      const smokeY = this.y - smokeHeight + this.height + SMOKE_Y_NUDGE;
      const row = Math.floor(this.smokeFrame / 4);
      const col = this.smokeFrame % 4;
      smokeSheet.draw(ctx, row, col, smokeX, smokeY, smokeWidth, smokeHeight, false);
    }
  }
}