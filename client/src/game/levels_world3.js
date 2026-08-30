// src/game/levels_world3.js
// World 3 (Neon Tundra) level definitions. hasYeti/yetiCount/yetiHealth
// drive Yeti (stationary, throws freezing chunks). hasSpaceship/shipCount/
// shipHealth drive Spaceship (flies, spawns up to 3 icy bees, then goes
// aggressor once they're all dead). hasIceberg drives the moving,
// non-damaging freeze obstacle. No cats/frogs/cactus in this world — those
// were World 2 leftovers.

export const LEVELS = [
  // Level 1 — 1 yeti, 15 HP
  {
    level: 1,
    hasYeti: true,
    yetiCount: 1,
    yetiHealth: 15,
  },
  // Level 2 — 1 spaceship, 15 HP
  {
    level: 2,
    hasSpaceship: true,
    shipCount: 1,
    shipHealth: 15,
    hasIceberg: true,
  },
  // Level 3 — 2 yetis, 15 HP each
  {
    level: 3,
    hasYeti: true,
    yetiCount: 2,
    yetiHealth: 15,
  },
  // Level 4 — 2 spaceships, 10 HP each
  {
    level: 4,
    hasSpaceship: true,
    shipCount: 2,
    shipHealth: 10,
  },
  // Level 5 — 1 ship (10 HP) + 1 yeti (15 HP)
  {
    level: 5,
    hasSpaceship: true,
    shipCount: 1,
    shipHealth: 10,
    hasYeti: true,
    yetiCount: 1,
    yetiHealth: 15,
  },
  // Level 6 — 2 ships (10 HP each) + iceberg obstacle
  {
    level: 6,
    hasSpaceship: true,
    shipCount: 2,
    shipHealth: 10,
    hasIceberg: true,
  },
  // Level 7 — 1 ship (10 HP) + 2 yetis (15 HP each)
  {
    level: 7,
    hasSpaceship: true,
    shipCount: 1,
    shipHealth: 10,
    hasYeti: true,
    yetiCount: 2,
    yetiHealth: 15,
  },
  // Level 8 — 3 ships, 10 HP each
  {
    level: 8,
    hasSpaceship: true,
    shipCount: 3,
    shipHealth: 10,
  },
  // Level 9 — 1 yeti (15 HP) + 1 ship (10 HP) + iceberg obstacle
  {
    level: 9,
    hasYeti: true,
    yetiCount: 1,
    yetiHealth: 15,
    hasSpaceship: true,
    shipCount: 1,
    shipHealth: 10,
    hasIceberg: true,
  },
  // Level 10 — Twin Glaciers boss fight.
  {
    level: 10,
    hasTwinGlaciers: true,
    glacierHealth: 20,
  },
];