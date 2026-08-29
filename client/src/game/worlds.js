// src/game/worlds.js
// Top-level world registry. Each world owns its own sprite asset specs
// (path + frame grid dimensions — these genuinely differ per generated
// sheet, so they live here per-world rather than being assumed constant)
// and its own 10-level campaign. GameCanvas reads WORLDS[worldIndex] to
// know which sheets to load and which levels to run — no per-world
// branching lives in GameCanvas itself.
//
// A world with an empty `levels` array is treated as "not built yet" —
// WorldSelect automatically keeps it locked until levels are added here.
// A missing sprite (e.g. World 2 has no eagle/boss yet) is fine: pass
// `null` and every consumer (GameCanvas, Enemy/Eagle/Boss draw calls,
// drawHudPortrait) already falls back gracefully.

import { LEVELS as WORLD_1_LEVELS } from './levels';
import { LEVELS as WORLD_2_LEVELS } from './levels_world2';
import { LEVELS as WORLD_3_LEVELS } from './levels_world3';

export const WORLDS = [
  {
    id: 0,
    name: 'Lunar Front',
    missionTitle: 'MISSION-MOON',
    sprites: {
      player: { path: '/sprites/player.png', frameWidth: 313, frameHeight: 313, columns: 4, rows: 4 },
      playerExtra: { path: '/sprites/player_extra.png', frameWidth: 125, frameHeight: 125, columns: 4, rows: 4 },
      enemy: { path: '/sprites/enemy.png', frameWidth: 313, frameHeight: 313, columns: 4, rows: 4 },
      eagle: { path: '/sprites/eagle.png', frameWidth: 180, frameHeight: 180, columns: 8, rows: 1 },
      boss: { path: '/sprites/boss.png', frameWidth: 500 / 3, frameHeight: 250, columns: 3, rows: 2 },
      background: { path: '/sprites/moon_bg.jpg', frameWidth: 366, frameHeight: 352, columns: 8, rows: 1 },
      obstacle: '/sprites/obstacle.png', // plain Image, not a SpriteSheet grid
      cactus: '/sprites/cactus.png',
    },
    levels: WORLD_1_LEVELS,
  },
  {
    id: 1,
    name: 'Mars Invasion',
    missionTitle: 'MARS INVASION',
    sprites: {
      player: { path: '/sprites/player.png', frameWidth: 313, frameHeight: 313, columns: 4, rows: 4 },
      playerExtra: { path: '/sprites/player_extra.png', frameWidth: 125, frameHeight: 125, columns: 4, rows: 4 },
      enemy: { path: '/sprites/martian_cat.png', frameWidth: 310, frameHeight: 310, columns: 4, rows: 4 },
      eagle: null,   // World 2 has no eagle — replaced by Frog
            boss: { path: '/sprites/bossfrog.png', frameWidth: 125, frameHeight: 250, columns: 4, rows: 2 },
      background: { path: '/sprites/mars_bg.jpg', frameWidth: 366, frameHeight: 352, columns: 8, rows: 1 },
      obstacle: '/sprites/obstacle.png',
      cactus: '/sprites/cactus.png',
      frog: { path: '/sprites/frog.png', frameWidth: 220, frameHeight: 311, columns: 8, rows: 1 },
    },
    levels: WORLD_2_LEVELS,
  },
  {
    id: 2,
    name: 'Neon Tundra',
    missionTitle: 'NEON TUNDRA',
    sprites: {
      player: { path: '/sprites/player.png', frameWidth: 313, frameHeight: 313, columns: 4, rows: 4 },
      playerExtra: { path: '/sprites/player_extra.png', frameWidth: 125, frameHeight: 125, columns: 4, rows: 4 },
      enemy: null,    // TODO: Yeti — not built yet, placeholder art from Enemy.js applies
      yeti: { path: '/sprites/yeti.png', frameWidth: 431, frameHeight: 431, columns: 4, rows: 2 },
            spaceship: { path: '/sprites/spaceship_beeform.png', frameWidth: 354, frameHeight: 454, columns: 4, rows: 2 },
      iceBee: { path: '/sprites/icebee.png', frameWidth: 420, frameHeight: 480, columns: 4, rows: 1 },
            iceberg: null, // TODO: iceberg.png
      eagle: null,    // World 3 has no plain eagle — replaced by the Spaceship/Bee system
      boss: null,     // TBD later
           background: { path: '/sprites/aurora_bg.png', frameWidth: 1586 / 4, frameHeight: 496, columns: 4, rows: 2 },
      obstacle: '/sprites/obstacle.png',
      cactus: null,   // TODO: freezing cactus art, separate from World 2's cactus.png
    },
    levels: WORLD_3_LEVELS,
  },
  { id: 3, name: 'World 4', sprites: {}, levels: [] },
  { id: 4, name: 'World 5', sprites: {}, levels: [] },
];