// src/game/levels_world5.js
// World 5 level definitions.
// Level 10 is intentionally left as the existing boss placeholder.

export const LEVELS = [
  // Level 1 — 1 REG, 10 HP
  {
    level: 1,
    hasREG: true,
    regCount: 1,
    regHealth: 10,
  },
  // Level 2 — 2 Shapeshifters, 10 HP each
  {
    level: 2,
    hasShapeshifter: true,
    shapeshifterCount: 2,
    shapeshifterHealth: 10,
  },
  // Level 3 — 1 REG + 1 Shapeshifter, 10 HP each
  {
    level: 3,
    hasREG: true,
    regCount: 1,
    regHealth: 10,
    hasShapeshifter: true,
    shapeshifterCount: 1,
    shapeshifterHealth: 10,
  },
  // Level 4 — 1 REG + 1 Sitting Duck
  {
    level: 4,
    hasREG: true,
    regCount: 1,
    regHealth: 10,
    hasSittingDuck: true,
  },
  // Level 5 — 2 REGs, 10 HP each
  {
    level: 5,
    hasREG: true,
    regCount: 2,
    regHealth: 10,
  },
  // Level 6 — 1 Sitting Duck + 2 Shapeshifters, 10 HP each
  {
    level: 6,
    hasSittingDuck: true,
    hasShapeshifter: true,
    shapeshifterCount: 2,
    shapeshifterHealth: 10,
  },
  // Level 7 — 1 each: REG, Shapeshifter, Sitting Duck
  {
    level: 7,
    hasREG: true,
    regCount: 1,
    regHealth: 10,
    hasShapeshifter: true,
    shapeshifterCount: 1,
    shapeshifterHealth: 10,
    hasSittingDuck: true,
  },
  // Level 8 — 1 Sitting Duck + 2 REGs, 10 HP each
  {
    level: 8,
    hasSittingDuck: true,
    hasREG: true,
    regCount: 2,
    regHealth: 10,
  },
  // Level 9 — 1 Sitting Duck + 1 Shapeshifter + 2 REGs
  {
    level: 9,
    hasSittingDuck: true,
    hasShapeshifter: true,
    shapeshifterCount: 1,
    shapeshifterHealth: 10,
    hasREG: true,
    regCount: 2,
    regHealth: 10,
  },
  // Level 10 — TBD; left as-is.
  {
    level: 10,
    hasBlackHoleBoss: true,
    bossHealth: 20,
  },
];
