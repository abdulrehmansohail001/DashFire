// src/game/levels_world2.js
// World 2 (Mars Invasion) level definitions. Same shape as World 1's
// levels.js — enemyCount/health/etc drive the "cat" (Enemy class, reskinned
// via worlds.js sprite mapping), hasFrog/frogCount/frogHealth drive Frog,
// hasCactus is a fixed-position hazard with no health (can't be killed,
// doesn't block a win). No eagles in this world.

export const LEVELS = [
  // Level 1 — introduces the Yeti: standing, throws freezing ice chunks.
  // Everything else copied from World 2 for now (per plan, to be redesigned
  // level-by-level once the core Neon Tundra mechanics are all built).
  {
    level: 1,
    enemyCount: 2,
    health: 10,
    moveSpeed: 120,
    bulletSpeed: 260,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.4,
    reactionDelayMin: 0.7,
    reactionDelayMax: 1.1,
    fireSequence: [1, 1, 2],
    burstGap: 0.2,

    hasYeti: true,
    yetiCount: 1,
    yetiHealth: 8,
    yetiThrowIntervalMin: 1.3, // was 1.8 — a bit more frequent
    yetiThrowIntervalMax: 2.0, // was 2.8
    yetiProjectileSpeed: 220,
  },
  // Level 2 — 3 cats, 10 HP each
  {
    level: 2,
    enemyCount: 3,
    health: 10,
    moveSpeed: 120,
    bulletSpeed: 260,
    actionIntervalMin: 1.4,
    actionIntervalMax: 2.4,
    reactionDelayMin: 0.7,
    reactionDelayMax: 1.1,
    fireSequence: [1, 1, 2],
    burstGap: 0.2,
  },
  // Level 3 — first frog: 1 frog (5 HP) + 2 cats (10 HP)
  {
    level: 3,
    enemyCount: 2,
    health: 10,
    moveSpeed: 130,
    bulletSpeed: 260,
    actionIntervalMin: 1.3,
    actionIntervalMax: 2.2,
    reactionDelayMin: 0.6,
    reactionDelayMax: 1.0,
    fireSequence: [1, 1, 2],
    burstGap: 0.18,

    hasFrog: true,
    frogCount: 1,
    frogHealth: 5,
  },
  // Level 4 — 2 frogs (5 HP each) + 1 cat (10 HP)
  {
    level: 4,
    enemyCount: 1,
    health: 10,
    moveSpeed: 140,
    bulletSpeed: 260,
    actionIntervalMin: 1.3,
    actionIntervalMax: 2.1,
    reactionDelayMin: 0.55,
    reactionDelayMax: 0.95,
    fireSequence: [1, 1, 2],
    burstGap: 0.17,

    hasFrog: true,
    frogCount: 2,
    frogHealth: 5,
  },
  // Level 5 — frogs only: 3 frogs, 5 HP each
  {
    level: 5,
    enemyCount: 0,

    hasFrog: true,
    frogCount: 3,
    frogHealth: 5,
  },
  // Level 6 — first cactus: cactus + 1 frog (5 HP) + 1 cat (10 HP)
  {
    level: 6,
    enemyCount: 1,
    health: 10,
    moveSpeed: 150,
    bulletSpeed: 260,
    actionIntervalMin: 1.2,
    actionIntervalMax: 2.0,
    reactionDelayMin: 0.5,
    reactionDelayMax: 0.85,
    fireSequence: [1, 2, 1, 2],
    burstGap: 0.16,

    hasCactus: true,
    hasFrog: true,
    frogCount: 1,
    frogHealth: 5,
  },
  // Level 7 — cactus + 2 cats (10 HP each)
  {
    level: 7,
    enemyCount: 2,
    health: 10,
    moveSpeed: 160,
    bulletSpeed: 260,
    actionIntervalMin: 1.1,
    actionIntervalMax: 1.9,
    reactionDelayMin: 0.45,
    reactionDelayMax: 0.8,
    fireSequence: [1, 2, 1, 2],
    burstGap: 0.15,

    hasCactus: true,
  },
  // Level 8 — cactus + 3 frogs (5 HP each), no cats
  {
    level: 8,
    enemyCount: 0,

    hasCactus: true,
    hasFrog: true,
    frogCount: 3,
    frogHealth: 5,
  },
  // Level 9 — cactus + 1 frog (5 HP) + 2 cats (10 HP each)
  {
    level: 9,
    enemyCount: 2,
    health: 10,
    moveSpeed: 170,
    bulletSpeed: 260,
    actionIntervalMin: 1.0,
    actionIntervalMax: 1.8,
    reactionDelayMin: 0.4,
    reactionDelayMax: 0.75,
    fireSequence: [2, 1, 2],
    burstGap: 0.14,

    hasCactus: true,
    hasFrog: true,
    frogCount: 1,
    frogHealth: 5,
  },
  // Level 10 — left as-is, will revisit later
    // Level 10 — Bloat King: enraged hopping frog boss. Hops around instead
  // of sitting still, spawns a 2-HP baby frog on every landing (capped at
  // 5 alive), and fires on its own independent random timer.
  {
    level: 10,
    enemyCount: 0,
    hasBossFrog: true,
    bossHealth: 20,
    bulletSpeed: 260,          // reused for the boss's fireball
    bossFireIntervalMin: 2.5,
    bossFireIntervalMax: 4.5,
  },
];