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
    health: 5,
    moveSpeed: 120,
    bulletSpeed: 400,
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
    bulletSpeed: 400,
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
    bulletSpeed: 400,
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
    health: 2,
    moveSpeed: 160,
    bulletSpeed: 260,
    actionIntervalMin: 1.8,
    actionIntervalMax: 2.6,
    reactionDelayMin: 0.5,
    reactionDelayMax: 0.85,
    fireSequence: [1, 1, 2],
    burstGap: 0.16,
  },
    // Level 5 — more frequent bursts, wall obstacle
  {
    level: 5,
    enemyCount: 1,
    hasObstacle: true,
    health: 2,
    moveSpeed: 170,
    bulletSpeed: 280,
    actionIntervalMin: 1.6,
    actionIntervalMax: 2.3,
    reactionDelayMin: 0.45,
    reactionDelayMax: 0.8,
    fireSequence: [1, 1, 2, 1, 2],
    burstGap: 0.15,
  },
  // Level 6 — 2 hits to kill, fast bullets, tight reaction
  {
    level: 6,
    enemyCount: 1,
    health: 2,
    moveSpeed: 185,
    bulletSpeed: 300,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.1,
    reactionDelayMin: 0.4,
    reactionDelayMax: 0.7,
    fireSequence: [1, 2, 1, 2],
    burstGap: 0.14,
  },
  // Level 7 — TWO gunmen now
  {
    level: 7,
    enemyCount: 2,
    health: 2,
    moveSpeed: 150,
    bulletSpeed: 260,
    actionIntervalMin: 1.8,
    actionIntervalMax: 2.6,
    reactionDelayMin: 0.5,
    reactionDelayMax: 0.9,
    fireSequence: [1, 1, 2],
    burstGap: 0.18,
  },
  // Level 8 — 2 gunmen, tougher
  {
    level: 8,
    enemyCount: 2,
    health: 2,
    moveSpeed: 165,
    bulletSpeed: 280,
    actionIntervalMin: 1.6,
    actionIntervalMax: 2.3,
    reactionDelayMin: 0.45,
    reactionDelayMax: 0.8,
    fireSequence: [1, 2, 1, 2],
    burstGap: 0.15,
  },
  // Level 9 — 2 gunmen, near-max aggression
  {
    level: 9,
    enemyCount: 2,
    health: 3,
    moveSpeed: 180,
    bulletSpeed: 300,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.0,
    reactionDelayMin: 0.35,
    reactionDelayMax: 0.65,
    fireSequence: [1, 2, 2],
    burstGap: 0.13,
  },
  // Level 10 — final boss pace: 2 gunmen, fastest, toughest
  {
    level: 10,
    enemyCount: 2,
    health: 3,
    moveSpeed: 200,
    bulletSpeed: 320,
    actionIntervalMin: 1.2,
    actionIntervalMax: 1.8,
    reactionDelayMin: 0.3,
    reactionDelayMax: 0.6,
    fireSequence: [2, 1, 2, 2],
    burstGap: 0.12,
  },
];