// src/game/levels.js
// Data-driven level definitions. Each entry configures how many enemies
// spawn and how tough/aggressive they are. Enemy.js reads these fields
// directly — add/tune levels here only, never touch Enemy.js again.
//
// enemyCount: how many gunmen spawn this level (patrol zones auto-split
//             across the arena so they don't overlap)
// health: hits required to kill each enemy
// moveSpeed: px/s for step-move actions
// bulletSpeed: px/s for bullets this enemy fires
// actionIntervalMin/Max: seconds between the enemy's autonomous actions
//   (lower = more aggressive/frequent jump-move-fire)
// reactionDelayMin/Max: how fast it reacts to the player jumping
// fireSequence: burst pattern, e.g. [1,1,2] = single, single, double, repeat
// burstGap: seconds between shots within one burst

export const LEVELS = [
    // Level 1 — tutorial pace, 10 HP so the health bar has room to show progress
  {
    level: 1,
    enemyCount: 1,
    health: 10,
    moveSpeed: 120,
    bulletSpeed: 260,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.4,
    reactionDelayMin: 0.7,
    reactionDelayMax: 1.1,
    fireSequence: [1,1,2],
    burstGap: 0.2,
  },
  // Level 2 — slightly faster, still single shots
   {
    level: 2,
    enemyCount: 2,
    health: 5,
    moveSpeed: 120,
    bulletSpeed: 260,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.4,
    reactionDelayMin: 0.7,
    reactionDelayMax: 1.1,
    fireSequence: [1,1,2],
    burstGap: 0.2,
  },
  // Level 3 — introduces occasional double-bursts
   {
    level: 3,
    enemyCount: 2,
    health: 10,
    moveSpeed: 120,
    bulletSpeed: 260,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.4,
    reactionDelayMin: 0.7,
    reactionDelayMax: 1.1,
    fireSequence: [1,1,2],
    burstGap: 0.2,
  },
    // Level 4 — takes 2 hits now, bullets faster, wall obstacle introduced
  {
    level: 4,
    enemyCount: 1,
    hasObstacle: true,
    health: 10,
    moveSpeed: 120,
    bulletSpeed: 260,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.4,
    reactionDelayMin: 0.7,
    reactionDelayMax: 1.1,
    fireSequence: [1,1,2],
    burstGap: 0.2,
  },
    // Level 5 — more frequent bursts, wall obstacle
  {
    level: 5,
    enemyCount: 2,
    hasObstacle: true,
    health: 10,
    moveSpeed: 120,
    bulletSpeed: 260,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.4,
    reactionDelayMin: 0.7,
    reactionDelayMax: 1.1,
    fireSequence: [1,1,2],
    burstGap: 0.2,
  },
    // Level 6 — first eagle level: 2 gunmen at 10 HP each, PLUS a flying eagle
  // that patrols at a fixed height and lobs arcing bombs. hasEagle: true is
  // the switch GameCanvas checks to actually spawn it — everything else
  // (Eagle.js, EagleProjectile.js, the throw/arc/collision logic in
  // GameCanvas) was already correct, it just never had a level flip it on.
  {
    level: 6,
    enemyCount: 2,
    health: 10,
    moveSpeed: 185,
    bulletSpeed: 260,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.1,
    reactionDelayMin: 0.4,
    reactionDelayMax: 0.7,
    fireSequence: [1, 2, 1, 2],
    burstGap: 0.14,

    hasEagle: true,
    eagleHealth: 6,
    eagleSpeed: 100,
    eagleThrowIntervalMin: 1.4,
    eagleThrowIntervalMax: 2.4,
    eagleThrowSpeedMin: -160,
    eagleThrowSpeedMax: 160,
  },
    // Level 7 — one gunman + two eagles patrolling separate lanes
  {
    level: 7,
    enemyCount: 1,
    health: 10,
    moveSpeed: 185,
    bulletSpeed: 260,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.1,
    reactionDelayMin: 0.4,
    reactionDelayMax: 0.7,
    fireSequence: [1, 2, 1, 2],
    burstGap: 0.14,

    hasEagle: true,
    eagleCount: 2,
    eagleHealth: 5,
    eagleSpeed: 100,
    eagleThrowIntervalMin: 1.4,
    eagleThrowIntervalMax: 2.4,
    eagleThrowSpeedMin: -160,
    eagleThrowSpeedMax: 160,
  },
  // Level 8 — eagle-only level: 3 eagles, 5 HP each, no ground gunmen
  {
    level: 8,
    enemyCount: 0,

    hasEagle: true,
    eagleCount: 3,
    eagleHealth: 5,
    eagleSpeed: 110,
    eagleThrowIntervalMin: 1.2,
    eagleThrowIntervalMax: 2.1,
    eagleThrowSpeedMin: -170,
    eagleThrowSpeedMax: 170,
  },
  // Level 9 — what Level 7 used to be: 2 gunmen behind a wall, plus one eagle
  {
    level: 9,
    hasObstacle: true,
    enemyCount: 2,
    health: 1,
    moveSpeed: 185,
    bulletSpeed: 260,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.1,
    reactionDelayMin: 0.4,
    reactionDelayMax: 0.7,
    fireSequence: [1, 2, 1, 2],
    burstGap: 0.14,

    hasEagle: true,
    eagleHealth: 6,
    eagleSpeed: 100,
    eagleThrowIntervalMin: 1.4,
    eagleThrowIntervalMax: 2.4,
    eagleThrowSpeedMin: -160,
    eagleThrowSpeedMax: 160,
  },
  // Level 10 — final boss: mostly-stationary war machine that fires at
  // you and periodically summons a basic gunman (up to 2 alive at once)
  // to shield itself. No static gunmen this level — the boss spawns them.
  {
    level: 10,
    enemyCount: 0,
    hasBoss: true,
    bossHealth: 20,
    health: 2,          // HP of each shield gunman the boss spawns
    moveSpeed: 190,
    bulletSpeed: 260,   // also reused for the boss's own bullets
    actionIntervalMin: 1.3,
    actionIntervalMax: 2.0,
    reactionDelayMin: 0.35,
    reactionDelayMax: 0.65,
    fireSequence: [1, 2],
    burstGap: 0.15,
  },
];