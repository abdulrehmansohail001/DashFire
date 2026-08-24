// src/game/entities/Enemy.js
// Enemy gunman: reacts and moves unpredictably instead of standing still.
// - On a random internal timer, it picks one of: jump-and-fire, step-and-fire, fire-in-place.
// - It also reacts to the PLAYER jumping, but with a short delay instead of instantly
//   (see REACTION_DELAY) so it doesn't feel robotically synced to the player.
// - Firing uses a burst pattern that loops forever: 1,1,2,1,2 bullets per trigger
//   (see FIRE_SEQUENCE). A "trigger" is any of jump-and-fire / step-and-fire /
//   fire-in-place / landing / delayed player-jump reaction.
// - Firing is event-driven: GameCanvas checks `wantsToFire` each frame and
//   spawns the actual EnemyBullet when it's true. For a 2-bullet burst, this
//   flag flips true twice, spaced by BURST_GAP, so GameCanvas doesn't need
//   to know anything about bursts.

export const ENEMY_GRAVITY = 1800;
export const ENEMY_JUMP_VELOCITY = -600;
export const ENEMY_MOVE_SPEED = 150;
export const ENEMY_GROUND_Y = 340;
export const ENEMY_PATROL_MIN_X = 550;
export const ENEMY_PATROL_MAX_X = 750;

// Bullets-per-trigger pattern, loops forever: 1,1,2,1,2,1,1,2,1,2,...
const FIRE_SEQUENCE = [1, 1, 2, 1, 2];
const BURST_GAP = 0.15; // seconds between shots within a multi-bullet burst

// How long the enemy waits after the player jumps before it reacts.
const REACTION_DELAY = 0.35; // seconds

export class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;

    this.vx = 0;
    this.vy = 0;
    this.isGrounded = true;

    this.health = 1;
    this.alive = true;

    // random autonomous action timer
    this.actionTimer = 0;
    this.actionInterval = this.randomInterval();

    // horizontal step-move target (null = not currently stepping)
    this.moveTargetX = null;

    // flag GameCanvas checks each frame to know when to spawn a bullet
    this.wantsToFire = false;

    // burst-fire state
    this.fireSequenceIndex = 0;
    this.burstRemaining = 0;
    this.burstTimer = 0;

    // delayed reaction to the player jumping (null = no reaction pending)
    this.pendingReactionTimer = null;
  }

  randomInterval() {
    return 1.2 + Math.random() * 1.5; // seconds between random actions
  }

  // Kicks off a burst: fires the first bullet immediately, queues the rest
  // (if any) to fire BURST_GAP apart, and advances the pattern index.
  startBurst() {
    if (!this.alive) return;
    const count = FIRE_SEQUENCE[this.fireSequenceIndex];
    this.fireSequenceIndex = (this.fireSequenceIndex + 1) % FIRE_SEQUENCE.length;

    this.wantsToFire = true; // first shot fires this frame
    this.burstRemaining = count - 1; // remaining shots to trickle out
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
    targetX = Math.max(ENEMY_PATROL_MIN_X, Math.min(ENEMY_PATROL_MAX_X, targetX));
    this.moveTargetX = targetX;
  }

  fireInPlace() {
    if (!this.alive) return;
    this.startBurst();
  }

  chooseRandomAction() {
    const roll = Math.random();
    if (roll < 0.34) {
      this.jumpAndFire();
    } else if (roll < 0.67) {
      this.moveStepAndFire();
    } else {
      this.fireInPlace();
    }
  }

  // Called by GameCanvas when the player jumps. Doesn't react immediately —
  // just arms a delay timer; the actual jump-and-fire happens in update()
  // once REACTION_DELAY has elapsed.
  triggerDelayedReaction() {
    if (!this.alive) return;
    this.pendingReactionTimer = REACTION_DELAY;
  }

  update(dt) {
    if (!this.alive) return;

    // delayed reaction to the player's jump
    if (this.pendingReactionTimer !== null) {
      this.pendingReactionTimer -= dt;
      if (this.pendingReactionTimer <= 0) {
        this.pendingReactionTimer = null;
        this.jumpAndFire();
      }
    }

    // vertical physics (jump/land)
    this.vy += ENEMY_GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.y >= ENEMY_GROUND_Y) {
      this.y = ENEMY_GROUND_Y;
      this.vy = 0;
      if (!this.isGrounded) {
        this.startBurst(); // fire again on landing
      }
      this.isGrounded = true;
    }

    // horizontal step movement toward moveTargetX
    if (this.moveTargetX !== null) {
      const diff = this.moveTargetX - this.x;
      if (Math.abs(diff) < 2) {
        this.x = this.moveTargetX;
        this.moveTargetX = null;
        this.startBurst(); // fire once it settles into the new spot
      } else {
        this.x += Math.sign(diff) * ENEMY_MOVE_SPEED * dt;
      }
    }

    // continue a multi-bullet burst, spaced BURST_GAP apart
    if (this.burstRemaining > 0) {
      this.burstTimer += dt;
      if (this.burstTimer >= BURST_GAP) {
        this.burstTimer = 0;
        this.burstRemaining -= 1;
        this.wantsToFire = true;
      }
    }

    // random autonomous action timer
    this.actionTimer += dt;
    if (this.actionTimer >= this.actionInterval) {
      this.actionTimer = 0;
      this.actionInterval = this.randomInterval();
      this.chooseRandomAction();
    }
  }

  takeHit() {
    if (!this.alive) return;
    this.health -= 1;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.fillStyle = '#a83232';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // gun nozzle, pointing left toward the player
    ctx.fillStyle = '#111';
    ctx.fillRect(this.x - 6, this.y + 10, 6, 6);
  }
}