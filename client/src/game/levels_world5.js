// src/game/levels_world5.js
// World 5 level definitions — placeholder scaffolding copied from World 4.
// Swap out enemy types, health, and boss as World 5 content is built.

export const LEVELS = [
    // Level 1 — introduces the Shapeshifter, World 5's first real enemy
    // (rest of this file is still the temporary World-4 copy).
    {
        level: 1,
        hasShapeshifter: true,
        shapeshifterCount: 1,
        shapeshifterHealth: 6,
    },
    // Level 2 — 1 REG (14 HP) — the multiverse shapeshifter
    {
        level: 2,
        hasREG: true,
        regCount: 1,
        regHealth: 14,
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
    // Level 10 — Placeholder boss (Black Hole Boss reused until World 5 boss is built)
    {
        level: 10,
        hasBlackHoleBoss: true,
        bossHealth: 20,
    },
];
