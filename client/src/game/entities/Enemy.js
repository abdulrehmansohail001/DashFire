// src/game/entities/Enemy.js
// Enemy gunman. Behavior (jump/step/fire-in-place, burst pattern, reaction
// delay, speed, health, bullet speed, patrol zone) is DATA-DRIVEN via the
// `config` object passed into the constructor — difficulty across all 10
// levels lives in levels.js as plain data, this file doesn't change per level.
//
// - On a random internal timer, it picks one of: jump-and-fire, step-and-fire, fire-in-place.
// - It also reacts to the PLAYER jumping, but with a short delay instead of instantly.
// - Firing uses a burst pattern from config.fireSequence, looping forever.
// - Firing is event-driven: GameCanvas checks `wantsToFire` each frame and
//   spawns the actual EnemyBullet when it's true (reading enemy.bulletSpeed).
// - Blinks briefly after every hit (hitFlashTimer), and tracks maxHealth
//   separately from health so the HUD HP bar can compute a percentage.
//
// Rendering: 4x4 sprite sheet. Row 0: idle  Row 1: patrol/step  Row 2: jump  Row 3: shoot.

export const ENEMY_GRAVITY = 1800;
export const ENEMY_JUMP_VELOCITY = -600;
export const ENEMY_GROUND_Y = 310;

const DEFAULTS = {
  health: 1,
  moveSpeed: 150,
  bulletSpeed: 260,
  patrolMinX: 550,
  patrolMaxX: 750,
  actionIntervalMin: 1.8,
  actionIntervalMax: 2.8,
  reactionDelayMin: 0.5,
  reactionDelayMax: 0.9,
  fireSequence: [1, 1, 2, 1, 2],
  burstGap: 0.15,
};

const ANIM_ROW = { idle: 0, patrol: 1, jump: 2, shoot: 3 };
const FRAME_DURATION = { idle: 0.2, patrol: 0.12, jump: 0.12, shoot: 0.07 };
const FRAME_COUNT = 4;
const SHOOT_ANIM_DURATION = 0.25;
const SPRITE_DRAW_SIZE = 100;

const HIT_FLASH_DURATION = 0.18; // seconds the enemy blinks after taking a hit
const HIT_FLASH_INTERVAL = 0.06; // seconds per on/off blink step

export class Enemy {
  constructor(x, y, config = {}) {
    const cfg = { ...DEFAULTS, ...config };

    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 90;

    this.vx = 0;
    this.vy = 0;
    this.isGrounded = true;

    this.health = cfg.health;
    this.maxHealth = cfg.health; // fixed reference for HP bar %, never decremented
    this.moveSpeed = cfg.moveSpeed;
    this.bulletSpeed = cfg.bulletSpeed;
    this.patrolMinX = cfg.patrolMinX;
    this.patrolMaxX = cfg.patrolMaxX;
    this.actionIntervalMin = cfg.actionIntervalMin;
    this.actionIntervalMax = cfg.actionIntervalMax;
    this.reactionDelayMin = cfg.reactionDelayMin;
    this.reactionDelayMax = cfg.reactionDelayMax;
    this.fireSequence = cfg.fireSequence;
    this.burstGap = cfg.burstGap;

    this.alive = true;

    this.actionTimer = 0;
    this.actionInterval = this.randomInterval();

    this.moveTargetX = null;
    this.wantsToFire = false;

    this.fireSequenceIndex = 0;
    this.burstRemaining = 0;
    this.burstTimer = 0;

    this.pendingReactionTimer = null;

        this.facing = 'left'; // updated every frame in update() to track the player
    this.animState = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.shootTimer = 0;
    this.hitFlashTimer = 0; // >0 while blinking from a recent hit
  }

  randomInterval() {
    return this.actionIntervalMin + Math.random() * (this.actionIntervalMax - this.actionIntervalMin);
  }

  startBurst() {
    if (!this.alive) return;
    const count = this.fireSequence[this.fireSequenceIndex];
    this.fireSequenceIndex = (this.fireSequenceIndex + 1) % this.fireSequence.length;

    this.wantsToFire = true;
    this.shootTimer = SHOOT_ANIM_DURATION;
    this.burstRemaining = count - 1;
    this.burstTimer = 0;
  }

  jumpAndFire() {
    if (!this.alive) return;
    if (this.isGrounded) {
      this.vy = ENEMY_JUMP_VELOCITY;
      this.isGrounded = false;
    }
    this.startBurst();
  }

  moveStepAndFire() {
    if (!this.alive) return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const step = 40 + Math.random() * 40;
    let targetX = this.x + dir * step;
    targetX = Math.max(this.patrolMinX, Math.min(this.patrolMaxX, targetX));
    this.moveTargetX = targetX;
  }

  fireInPlace() {
    if (!this.alive) return;
    this.startBurst();
  }

  chooseRandomAction() {
    const roll = Math.random();
    if (roll < 0.45) {
      this.jumpAndFire();
    } else if (roll < 0.72) {
      this.moveStepAndFire();
    } else {
      this.fireInPlace();
    }
  }

  triggerDelayedReaction() {
    if (!this.alive) return;
    this.pendingReactionTimer =
      this.reactionDelayMin + Math.random() * (this.reactionDelayMax - this.reactionDelayMin);
  }

    update(dt, playerX) {
    if (!this.alive) return;

    if (typeof playerX === 'number') {
      this.facing = playerX < this.x ? 'left' : 'right';
    }

    if (this.pendingReactionTimer !== null) {
      this.pendingReactionTimer -= dt;
      if (this.pendingReactionTimer <= 0) {
        this.pendingReactionTimer = null;
        this.jumpAndFire();
      }
    }

    this.vy += ENEMY_GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.y >= ENEMY_GROUND_Y) {
      this.y = ENEMY_GROUND_Y;
      this.vy = 0;
      this.isGrounded = true;
    }

    if (this.moveTargetX !== null) {
      const diff = this.moveTargetX - this.x;
      if (Math.abs(diff) < 2) {
        this.x = this.moveTargetX;
        this.moveTargetX = null;
        this.startBurst();
      } else {
        this.x += Math.sign(diff) * this.moveSpeed * dt;
      }
    }

    if (this.burstRemaining > 0) {
      this.burstTimer += dt;
      if (this.burstTimer >= this.burstGap) {
        this.burstTimer = 0;
        this.burstRemaining -= 1;
        this.wantsToFire = true;
        this.shootTimer = SHOOT_ANIM_DURATION;
      }
    }

    if (this.shootTimer > 0) {
      this.shootTimer -= dt;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    this.actionTimer += dt;
    if (this.actionTimer >= this.actionInterval) {
      this.actionTimer = 0;
      this.actionInterval = this.randomInterval();
      this.chooseRandomAction();
    }

    this.updateAnimation(dt);
  }

  updateAnimation(dt) {
    let nextState;
    if (!this.isGrounded) {
      nextState = 'jump';
    } else if (this.shootTimer > 0) {
      nextState = 'shoot';
    } else if (this.moveTargetX !== null) {
      nextState = 'patrol';
    } else {
      nextState = 'idle';
    }

    if (nextState !== this.animState) {
      this.animState = nextState;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }

    this.frameTimer += dt;
    const duration = FRAME_DURATION[this.animState];
    if (this.frameTimer >= duration) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % FRAME_COUNT;
    }
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    this.hitFlashTimer = HIT_FLASH_DURATION; // blink regardless of whether this kills it
    if (this.health <= 0) {
      this.alive = false;
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

    if (spriteSheet) {
      const row = ANIM_ROW[this.animState];
      const drawX = this.x + this.width / 2 - SPRITE_DRAW_SIZE / 2;
      const drawY = this.y + this.height - SPRITE_DRAW_SIZE;
            const drew = spriteSheet.draw(
        ctx, row, this.frameIndex, drawX, drawY, SPRITE_DRAW_SIZE, SPRITE_DRAW_SIZE, this.facing === 'right'
      );
      if (drew) return;
    }

    ctx.fillStyle = '#a83232';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = '#111';
    ctx.fillRect(this.x - 6, this.y + 10, 6, 6);
  }
}