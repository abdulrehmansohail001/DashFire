// src/game/levels_world4.js
// World 4 (Farthest Black Hole) level definitions. hasDarkMatter/
// darkMatterCount/darkMatterHealth drive DarkMatterBeing (stationary,
// fires like a gunman, triggers the stillness-pull mechanic). hasVortex/
// vortexCount/vortexHealth drive Vortex ("spiral" — teleport-mirrors the
// player). hasQuicksand/quicksandX/quicksandWidth drive QuicksandPatch
// (non-solid ground hazard). Level 10's boss is TBD — left as a
// placeholder, untouched.

export const LEVELS = [
  // Level 1 — 1 dark matter being, 12 HP
  {
    level: 1,
    hasDarkMatter: true,
    darkMatterCount: 1,
    darkMatterHealth: 12,
  },
  // Level 2 — 1 vortex (10 HP) + quicksand
  {
    level: 2,
    hasVortex: true,
    vortexCount: 1,
    vortexHealth: 10,
    hasQuicksand: true,
  },
  // Level 3 — 1 dark matter being (12 HP) + quicksand
  {
    level: 3,
    hasDarkMatter: true,
    darkMatterCount: 1,
    darkMatterHealth: 12,
    hasQuicksand: true,
  },
  // Level 4 — 2 vortices (10 HP each) + quicksand
  {
    level: 4,
    hasVortex: true,
    vortexCount: 2,
    vortexHealth: 10,
    hasQuicksand: true,
  },
  // Level 5 — 2 dark matter beings, 12 HP each
  {
    level: 5,
    hasDarkMatter: true,
    darkMatterCount: 2,
    darkMatterHealth: 12,
  },
  // Level 6 — 2 dark matter beings (12 HP each) + 1 vortex (10 HP)
  {
    level: 6,
    hasDarkMatter: true,
    darkMatterCount: 2,
    darkMatterHealth: 12,
    hasVortex: true,
    vortexCount: 1,
    vortexHealth: 10,
  },
  // Level 7 — 3 vortices, 10 HP each
  {
    level: 7,
    hasVortex: true,
    vortexCount: 3,
    vortexHealth: 10,
  },
  // Level 8 — one of all three: dark matter, vortex, quicksand
  {
    level: 8,
    hasDarkMatter: true,
    darkMatterCount: 1,
    darkMatterHealth: 12,
    hasVortex: true,
    vortexCount: 1,
    vortexHealth: 10,
    hasQuicksand: true,
  },
  // Level 9 — 2 dark matter beings, 1 vortex, 1 quicksand
  {
    level: 9,
    hasDarkMatter: true,
    darkMatterCount: 2,
    darkMatterHealth: 12,
    hasVortex: true,
    vortexCount: 1,
    vortexHealth: 10,
    hasQuicksand: true,
  },
  // Level 10 — Black Hole boss fight.
  {
    level: 10,
    hasBlackHoleBoss: true,
    bossHealth: 20,
  },
];