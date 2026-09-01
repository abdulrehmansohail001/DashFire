// src/game/entities/REG.js
// Random Enemy Generator — World 5's ultimate multiverse enemy.
//
// Every 4 seconds the REG randomly transforms into one of five forms:
//   Yeti, DarkMatterBeing, Frog, Enemy (martian cat), Vortex
// and fully inherits that form's class behavior via composition.
//
// HP mechanics:
//   - Starts at config-driven maxHealth (e.g. 14)
//   - On every transformation: +1 HP (capped at maxHealth)
//   - After every transformation: 0.5s invulnerability window
//
// GameCanvas drives the power-specific side effects (pull, teleport,
// freeze, bullet spawning) based on `currentFormName`, same separation
// of concerns used by every other enemy in the game.

import { Yeti } from './Yeti';
import { DarkMatterBeing } from './DarkMatterBeing';
import { Frog } from './Frog';
import { Enemy, ENEMY_GROUND_Y } from './Enemy';
import { Vortex } from './Vortex';

const TRANSFORM_INTERVAL = 4.0;    // seconds between transformations
const INVULN_DURATION = 0.5;       // post-transform invulnerability
const GLITCH_DURATION = 0.35;      // visual glitch effect on transform
const HIT_FLASH_DURATION = 0.18;
const HIT_FLASH_INTERVAL = 0.06;

// Form names must match exactly — GameCanvas switches on these strings.
const FORM_NAMES = ['yeti', 'darkMatter', 'frog', 'enemy', 'vortex'];

// Y positions each form naturally sits at (canvas ground = 400).
const FORM_Y = {
  yeti: 310,        // 400 - 90 (yeti height)
  darkMatter: 230,  // 400 - 170 (dark matter height)
  frog: 340,        // FROG_GROUND_Y
  enemy: 310,       // ENEMY_GROUND_Y (Enemy.js's own gravity clamps to this)
  vortex: 260,      // VORTEX_HEIGHT_Y
};

// Hitbox sizes per form — used for getBounds() and collision.
const FORM_SIZE = {
  yeti: { width: 50, height: 90 },
  darkMatter: { width: 128, height: 170 },
  frog: { width: 44, height: 36 },
  enemy: { width: 40, height: 90 },
  vortex: { width: 70, height: 70 },
};

export class REG {
  constructor(x, y, config = {}) {
    this.spawnX = x;  // remembered for form resets
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 90;

    this.maxHealth = config.regHealth ?? 14;
    this.health = this.maxHealth;
    this.alive = true;

    this.facing = 'left';

    // Transform state
    this.transformTimer = 0;
    this.invulnTimer = 0;
    this.glitchTimer = 0;
    this.hitFlashTimer = 0;

    // The current form name and inner form instance.
    this.currentFormName = null;
    this.currentForm = null;

    // Store the config and placement for creating inner form instances.
    this._config = config;
    this._arenaMinX = config.regArenaMinX ?? 480;
    this._arenaMaxX = config.regArenaMaxX ?? 750;

    // Pick the first form immediately (no heal on the initial pick).
    this._transformTo(this._pickRandomForm(), false);
  }

  // ── Form creation ────────────────────────────────────────────────

  _pickRandomForm() {
    // Pick a different form from the current one.
    const candidates = FORM_NAMES.filter((f) => f !== this.currentFormName);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  _transformTo(formName, heal = true) {
    this.currentFormName = formName;

    // Snap position to the new form's natural y.
    this.y = FORM_Y[formName];
    const size = FORM_SIZE[formName];
    this.width = size.width;
    this.height = size.height;

    // Create the inner form instance.
    switch (formName) {
      case 'yeti':
        this.currentForm = new Yeti(this.x, this.y, this._config);
        break;
      case 'darkMatter':
        this.currentForm = new DarkMatterBeing(this.x, this.y, this._config);
        break;
      case 'frog':
        this.currentForm = new Frog(this.y, this._config, {
          startX: this.x,
          minX: 0,
          maxX: 800 - size.width,
        });
        break;
      case 'enemy':
        this.currentForm = new Enemy(this.x, this.y, {
          health: 999, // irrelevant — REG owns HP
          moveSpeed: this._config.moveSpeed ?? 150,
          bulletSpeed: this._config.bulletSpeed ?? 260,
          patrolMinX: this._arenaMinX,
          patrolMaxX: this._arenaMaxX,
          actionIntervalMin: this._config.actionIntervalMin ?? 1.5,
          actionIntervalMax: this._config.actionIntervalMax ?? 2.5,
          reactionDelayMin: this._config.reactionDelayMin ?? 0.4,
          reactionDelayMax: this._config.reactionDelayMax ?? 0.8,
          fireSequence: this._config.fireSequence ?? [1, 1, 2, 1, 2],
          burstGap: this._config.burstGap ?? 0.15,
        });
        break;
      case 'vortex':
        this.currentForm = new Vortex(this.y, this._config, {
          startX: this.x,
          minX: 0,
          maxX: 800 - size.width,
        });
        break;
    }

    // Heal +1 on transform (capped).
    if (heal && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + 1);
    }

    // Start invulnerability and glitch effect.
    this.invulnTimer = INVULN_DURATION;
    this.glitchTimer = GLITCH_DURATION;
    this.transformTimer = 0;
  }

  // ── Proxied state for GameCanvas ──────────────────────────────────

  /** True while immune to damage (post-transform window). */
  get invulnerable() {
    return this.invulnTimer > 0;
  }

  /** Yeti form: wants to throw an ice projectile. */
  get wantsToThrow() {
    if (this.currentFormName === 'yeti' && this.currentForm) {
      return this.currentForm.wantsToThrow;
    }
    return false;
  }
  set wantsToThrow(v) {
    if (this.currentForm && 'wantsToThrow' in this.currentForm) {
      this.currentForm.wantsToThrow = v;
    }
  }

  /** DarkMatter / Enemy form: wants to fire a bullet. */
  get wantsToFire() {
    if ((this.currentFormName === 'darkMatter' || this.currentFormName === 'enemy') && this.currentForm) {
      return this.currentForm.wantsToFire;
    }
    return false;
  }
  set wantsToFire(v) {
    if (this.currentForm && 'wantsToFire' in this.currentForm) {
      this.currentForm.wantsToFire = v;
    }
  }

  /** Enemy form: bullet speed for EnemyBullet spawning. */
  get bulletSpeed() {
    if (this.currentForm && 'bulletSpeed' in this.currentForm) {
      return this.currentForm.bulletSpeed;
    }
    return 260;
  }

  /** Yeti form: projectile speed. */
  get projectileSpeed() {
    if (this.currentForm && 'projectileSpeed' in this.currentForm) {
      return this.currentForm.projectileSpeed;
    }
    return 220;
  }

  // ── Core methods ──────────────────────────────────────────────────

  takeHit() {
    if (!this.alive || this.invulnerable) return;
    this.health -= 1;
    this.hitFlashTimer = HIT_FLASH_DURATION;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  /**
   * Called by GameCanvas for Enemy form — triggers a delayed
   * jump-and-fire reaction when the player jumps.
   */
  triggerDelayedReaction() {
    if (this.currentFormName === 'enemy' && this.currentForm) {
      this.currentForm.triggerDelayedReaction();
    }
  }

  update(dt, playerX) {
    if (!this.alive) return;

    // Tick timers.
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.glitchTimer > 0) this.glitchTimer -= dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Transform timer.
    this.transformTimer += dt;
    if (this.transformTimer >= TRANSFORM_INTERVAL) {
      this._transformTo(this._pickRandomForm(), true);
    }

    // Update the inner form.
    if (this.currentForm) {
      // Different forms have different update signatures.
      switch (this.currentFormName) {
        case 'yeti':
          this.currentForm.update(dt, playerX);
          break;
        case 'darkMatter':
          this.currentForm.update(dt, playerX, false);
          break;
        case 'frog':
          this.currentForm.update(dt);
          break;
        case 'enemy':
          this.currentForm.update(dt, playerX);
          break;
        case 'vortex':
          this.currentForm.update(dt);
          break;
      }

      // Sync REG's own position from the inner form (some forms move).
      this.x = this.currentForm.x;
      this.y = this.currentForm.y;
      if ('facing' in this.currentForm) {
        this.facing = this.currentForm.facing;
      } else if ('direction' in this.currentForm) {
        this.facing = this.currentForm.direction < 0 ? 'left' : 'right';
      }
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /**
   * Draw the current form. `sheets` is an object:
   * { yeti, darkMatter, frog, enemy, vortex }
   */
  draw(ctx, sheets) {
    if (!this.alive) return;

    // Hit flash blink.
    if (this.hitFlashTimer > 0) {
      const step = Math.floor(this.hitFlashTimer / HIT_FLASH_INTERVAL);
      if (step % 2 === 0) return;
    }

    // Glitch transition effect — bright white flash + scale pulse.
    if (this.glitchTimer > 0) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      const progress = 1 - this.glitchTimer / GLITCH_DURATION;
      const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
      const alpha = 0.4 + 0.6 * (1 - progress);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

      // Draw a glowing silhouette.
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);

      // Multiverse energy lines.
      const colors = ['#ff3a8c', '#3affea', '#ffd93a', '#8c3aff', '#3aff5c'];
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        const offsetY = (i - 2) * (this.height / 5);
        ctx.moveTo(this.x - 10, cy + offsetY + Math.sin(progress * Math.PI * 4 + i) * 8);
        ctx.lineTo(this.x + this.width + 10, cy + offsetY + Math.cos(progress * Math.PI * 4 + i) * 8);
        ctx.stroke();
      }

      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }

    // Invulnerability shimmer — slight transparency + color tint.
    if (this.invulnTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    }

    // Delegate drawing to the inner form.
    if (this.currentForm) {
      const sheet = sheets[this.currentFormName];
      switch (this.currentFormName) {
        case 'yeti':
          this.currentForm.draw(ctx, sheet);
          break;
        case 'darkMatter':
          this.currentForm.draw(ctx, sheet);
          break;
        case 'frog':
          this.currentForm.draw(ctx, sheet);
          break;
        case 'enemy':
          this.currentForm.draw(ctx, sheet);
          break;
        case 'vortex':
          this.currentForm.draw(ctx, sheet);
          break;
      }
    }

    if (this.invulnTimer > 0) {
      ctx.restore();
    }

    // Draw a multiverse aura ring around the REG.
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const radius = Math.max(this.width, this.height) / 2 + 8;
    ctx.save();
    ctx.strokeStyle = `hsl(${(Date.now() * 0.1) % 360}, 80%, 60%)`;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}
