// src/game/entities/Enemy.js
// Enemy gunman: reacts and moves unpredictably instead of standing still.
// - On a random internal timer, it picks one of: jump-and-fire, step-and-fire, fire-in-place.
// - It also reacts to the PLAYER jumping: when the player leaves the ground,
//   the enemy jumps and fires too (linked behavior).
// - Firing is event-driven: GameCanvas checks `wantsToFire` each frame and
//   spawns the actual bullet/obstacle when it's true.

export const ENEMY_GRAVITY = 1800;
export const ENEMY_JUMP_VELOCITY = -600;
export const ENEMY_MOVE_SPEED = 150;
export const ENEMY_GROUND_Y = 340;
export const ENEMY_PATROL_MIN_X = 550;
export const ENEMY_PATROL_MAX_X = 750;

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
  }

  randomInterval() {
    return 1.2 + Math.random() * 1.5; // seconds between random actions
  }

  jumpAndFire() {
    if (!this.alive) return;
    if (this.isGrounded) {
      this.vy = ENEMY_JUMP_VELOCITY;
      this.isGrounded = false;
    }
    this.wantsToFire = true;
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
    this.wantsToFire = true;
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

  update(dt) {
    if (!this.alive) return;

    // vertical physics (jump/land)
    this.vy += ENEMY_GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.y >= ENEMY_GROUND_Y) {
      this.y = ENEMY_GROUND_Y;
      this.vy = 0;
      if (!this.isGrounded) {
        this.wantsToFire = true; // fire again on landing
      }
      this.isGrounded = true;
    }

    // horizontal step movement toward moveTargetX
    if (this.moveTargetX !== null) {
      const diff = this.moveTargetX - this.x;
      if (Math.abs(diff) < 2) {
        this.x = this.moveTargetX;
        this.moveTargetX = null;
        this.wantsToFire = true; // fire once it settles into the new spot
      } else {
        this.x += Math.sign(diff) * ENEMY_MOVE_SPEED * dt;
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