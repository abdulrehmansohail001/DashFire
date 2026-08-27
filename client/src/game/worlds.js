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

export const WORLDS = [
  {
    id: 0,
    name: 'Lunar Front',
    sprites: {
      player: { path: '/sprites/player.png', frameWidth: 313, frameHeight: 313, columns: 4, rows: 4 },
      playerExtra: { path: '/sprites/player_extra.png', frameWidth: 125, frameHeight: 125, columns: 4, rows: 4 },
      enemy: { path: '/sprites/enemy.png', frameWidth: 313, frameHeight: 313, columns: 4, rows: 4 },
      eagle: { path: '/sprites/eagle.png', frameWidth: 180, frameHeight: 180, columns: 8, rows: 1 },
      boss: { path: '/sprites/boss.png', frameWidth: 500 / 3, frameHeight: 250, columns: 3, rows: 2 },
      background: { path: '/sprites/moon_bg.jpg', frameWidth: 366, frameHeight: 352, columns: 8, rows: 1 },
      obstacle: '/sprites/obstacle.png', // plain Image, not a SpriteSheet grid
    },
    levels: WORLD_1_LEVELS,
  },
  {
    id: 1,
    name: 'Martian Wastes',
    sprites: {
      player: { path: '/sprites/player.png', frameWidth: 313, frameHeight: 313, columns: 4, rows: 4 },
      playerExtra: { path: '/sprites/player_extra.png', frameWidth: 125, frameHeight: 125, columns: 4, rows: 4 },
      enemy: null,   // TODO: martian_cat.png once generated
      eagle: null,   // World 2 has no eagle — replaced by Frog (separate entity, not built yet)
      boss: null,
      background: null, // TODO: mars_bg.jpg
      obstacle: '/sprites/obstacle.png',
    },
    levels: [], // not built yet — keeps World 2 locked in WorldSelect until filled in
  },
  { id: 2, name: 'World 3', sprites: {}, levels: [] },
  { id: 3, name: 'World 4', sprites: {}, levels: [] },
  { id: 4, name: 'World 5', sprites: {}, levels: [] },
];