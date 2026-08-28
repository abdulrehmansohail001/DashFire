// src/game/entities/Frog.js
// Martian hopping hazard — never fires anything; the only "attack" is its
// own hitbox touching the player's, which GameCanvas turns into a
// player.takeHit() call. Player.js already has a 1s invulnerability
// window built into takeHit(), so no new damage-cooldown logic is needed
// anywhere for contact damage to be safe (no multi-frame HP drain from
// standing overlap).
//
// Movement is a real physics-driven hop cycle, not a fixed-timer
// animation: pause (crouched, waiting) -> launch -> rise -> peak -> fall
// -> land -> back to pause. frameIndex is derived from which physics
// phase it's actually in, so once real art exists (a hop-cycle sheet),
// the animation will already be perfectly synced to the motion — no
// retuning needed later.
//
// Shootable: has health, counts toward the level's win condition exactly
// like a gunman or eagle.

const HIT_FLASH_DURATION = 0.18;
const HIT_FLASH_INTERVAL = 0.06;
const LAUNCH_PHASE_DURATION = 0.08; // brief coiled-leap frame before rise physics take over
const PEAK_PHASE_DURATION = 0.06;   // brief hang-time frame right at the top of the arc
const LAND_PHASE_DURATION = 0.12;   // brief impact frame before settling back into pause

export class Frog {
  // placement lets multiple frogs on one level get distinct starting
  // positions and patrol lanes, same pattern as Eagle's placement param.
  constructor(groundY, config, placement = {}) {
    this.groundY = groundY; // y-position of hitbox top when grounded — never changes
    this.width = 44;
    this.height = 36;

    this.minX = placement.minX ?? 60;
    this.maxX = placement.maxX ?? 740 - this.width;
    this.x = placement.startX ?? (this.minX + this.maxX) / 2;
    this.y = groundY;

    this.hopSpeed = config.frogHopSpeed ?? 130;       // px/s horizontal during a hop
    this.hopVelocity = config.frogHopVelocity ?? 480; // initial upward speed of a hop
    this.gravity = config.frogGravity ?? 1400;
    this.pauseMin = config.frogPauseMin ?? 0.4;
    this.pauseMax = config.frogPauseMax ?? 0.9;

    this.health = config.frogHealth ?? 4;
    this.maxHealth = this.health;
    this.alive = true;

    this.vy = 0;
    this.direction = Math.random() < 0.5 ? -1 : 1;

    this.state = 'pause'; // 'pause' | 'launch' | 'rise' | 'peak' | 'fall' | 'land'
    this.stateTimer = 0;
    this.pauseDuration = this.randomPause();

    this.frameIndex = 0;
    this.hitFlashTimer = 0;
  }

  randomPause() {
    return this.pauseMin + Math.random() * (this.pauseMax - this.pauseMin);
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = HIT_FLASH_DURATION;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  launchHop() {
    // bounce off patrol bounds; otherwise small chance to reverse direction
    // mid-patrol so it doesn't feel like a metronome
    if (this.x <= this.minX) this.direction = 1;
    else if (this.x >= this.maxX) this.direction = -1;
    else if (Math.random() < 0.15) this.direction *= -1;

    this.vy = -this.hopVelocity;
    this.state = 'launch';
    this.stateTimer = 0;
  }

  update(dt) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    this.stateTimer += dt;

    if (this.state === 'pause') {
      this.frameIndex = 0;
      if (this.stateTimer >= this.pauseDuration) {
        this.launchHop();
      }
      return; // grounded and waiting — no movement this frame
    }

    // airborne physics apply to launch/rise/peak/fall
    this.vy += this.gravity * dt;
    this.y += this.vy * dt;
    this.x += this.direction * this.hopSpeed * dt;
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));

    if (this.state === 'launch') {
      this.frameIndex = 1;
      if (this.stateTimer > LAUNCH_PHASE_DURATION) {
        this.state = 'rise';
      }
    } else if (this.state === 'rise') {
      this.frameIndex = 2;
      if (this.vy >= -60) {
        this.state = 'peak';
        this.stateTimer = 0;
        this.frameIndex = 3;
      }
    } else if (this.state === 'peak') {
      this.frameIndex = 3;
      if (this.stateTimer > PEAK_PHASE_DURATION) {
        this.state = 'fall';
      }
    } else if (this.state === 'fall') {
      this.frameIndex = 4;
    }

    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      this.state = 'land';
      this.stateTimer = 0;
      this.frameIndex = 5;
      this.pauseDuration = this.randomPause();
    }

    if (this.state === 'land' && this.stateTimer > LAND_PHASE_DURATION) {
      this.state = 'pause';
      this.stateTimer = 0;
      this.frameIndex = 0;
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx, spriteSheet) {
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) {
      const step = Math.floor(this.hitFlashTimer / HIT_FLASH_INTERVAL);
      if (step % 2 === 0) return; // blink: skip this frame
    }

    if (spriteSheet && spriteSheet.loaded) {
      const drawSize = 70;
      const drawX = this.x + this.width / 2 - drawSize / 2;
      const drawY = this.y + this.height - drawSize;
      const flip = this.direction < 0;
      const drew = spriteSheet.draw(ctx, 0, this.frameIndex, drawX, drawY, drawSize, drawSize, flip);
      if (drew) return;
    }

    // Placeholder: a squashed blob that flattens when grounded/landing and
    // stretches taller mid-hop, so the motion reads even without real art.
    const squash = this.state === 'pause' || this.state === 'land' ? 1.25 : 0.8;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.fillStyle = '#b5451f';
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 2, (this.height / 2) * squash, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffb454';
    const eyeOffsetX = this.direction >= 0 ? this.width * 0.22 : -this.width * 0.22;
    ctx.beginPath();
    ctx.arc(cx + eyeOffsetX, cy - this.height * 0.25, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}