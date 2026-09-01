// src/game/levels_world5.js
// World 5 level definitions.
// Level 10 is intentionally left as the TimeDistorter boss.

export const LEVELS = [
  // Level 1 — 1 Shapeshifter, 10 HP
  {
    level: 1,
    hasShapeshifter: true,
    shapeshifterCount: 1,
    shapeshifterHealth: 10,
  },
  // Level 2 — 1 REG, 10 HP
  {
    level: 2,
    hasREG: true,
    regCount: 1,
    regHealth: 10,
  },
  // Level 3 — 1 Shapeshifter + 1 Sitting Duck, 10 HP each
  {
    level: 3,
    hasShapeshifter: true,
    shapeshifterCount: 1,
    shapeshifterHealth: 10,
    hasSittingDuck: true,
  },
  // Level 4 — 2 Shapeshifters, 10 HP each
  {
    level: 4,
    hasShapeshifter: true,
    shapeshifterCount: 2,
    shapeshifterHealth: 10,
  },
  // Level 5 — 1 REG + 1 Sitting Duck, 10 HP each
  {
    level: 5,
    hasREG: true,
    regCount: 1,
    regHealth: 10,
    hasSittingDuck: true,
  },
  // Level 6 — 2 REGs, 10 HP each
  {
    level: 6,
    hasREG: true,
    regCount: 2,
    regHealth: 10,
  },
  // Level 7 — 1 REG + 1 Shapeshifter, 10 HP each
  {
    level: 7,
    hasREG: true,
    regCount: 1,
    regHealth: 10,
    hasShapeshifter: true,
    shapeshifterCount: 1,
    shapeshifterHealth: 10,
  },
  // Level 8 — 1 REG + 2 Shapeshifters, 10 HP each
  {
    level: 8,
    hasREG: true,
    regCount: 1,
    regHealth: 10,
    hasShapeshifter: true,
    shapeshifterCount: 2,
    shapeshifterHealth: 10,
  },
  // Level 9 — all three: 1 REG + 1 Shapeshifter + 1 Sitting Duck
  {
    level: 9,
    hasREG: true,
    regCount: 1,
    regHealth: 10,
    hasShapeshifter: true,
    shapeshifterCount: 1,
    shapeshifterHealth: 10,
    hasSittingDuck: true,
  },
  // Level 10 — final boss: TimeDistorter
  {
    level: 10,
    hasTimeDistorter: true,
    bossHealth: 30,
  },
];
