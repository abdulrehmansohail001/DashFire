// src/game/GameCanvas.jsx
// React wrapper around the Canvas game loop. React only mounts the canvas
// and manages the HUD state (health, level, gameState) — the actual
// per-frame loop runs outside React's render cycle via requestAnimationFrame.
//
// Levels are entirely data-driven from levels.js: startLevel() builds
// however many Enemy instances a level needs, with that level's difficulty
// config, and spreads their patrol zones across the arena so they don't
// overlap. No per-level code branches live in this file.
//
// HUD: player HP (circle portrait + bar) top-left, enemy HP (bar + circle
// portrait) top-right above the enemy's patrol zone. Both portraits are
// cropped from each sprite sheet's idle frame via SpriteSheet.drawPortrait.

import { useEffect, useRef, useState } from 'react';
import { Player } from './entities/Player';
import { isColliding, Obstacle } from './entities/Obstacle';
import { Cactus } from './entities/Cactus';
import { QuicksandPatch } from './entities/QuicksandPatch';
import { Iceberg } from './entities/Iceberg';
import { SittingDuck } from './entities/SittingDuck';
import { Glacier } from './entities/Glacier';
import { GlacierProjectile } from './entities/GlacierProjectile';
import { Vortex } from './entities/Vortex';
import { DarkMatterBeing } from './entities/DarkMatterBeing';
import { Shapeshifter } from './entities/Shapeshifter';
import { BlackHoleBoss } from './entities/BlackHoleBoss';
import { RayEffect } from './entities/RayEffect';
import { Enemy } from './entities/Enemy';
import { Bullet } from './entities/Bullet';
import { EnemyBullet } from './entities/EnemyBullet';
import { SpriteSheet } from './entities/SpriteSheet';
import { WORLDS } from './worlds';
import { Background } from './entities/Background';
import { Eagle } from './entities/Eagle';
import { EagleProjectile } from './entities/EagleProjectile';
import { Yeti } from './entities/Yeti';
import { YetiProjectile } from './entities/YetiProjectile';
import { Spaceship } from './entities/Spaceship';
import { IcyBee } from './entities/IcyBee';
import { Boss } from './entities/Boss';
import { TimeDistorter } from './entities/TimeDistorter';
import { playSound } from './sound';
import { IceBeeProjectile } from './entities/IceBeeProjectile';
import { ShipProjectile } from './entities/ShipProjectile';
import { BossFireball } from './entities/BossFireball';
import { Frog } from './entities/Frog';
import { BossFrog } from './entities/BossFrog';
import { REG } from './entities/REG';
import { ENEMY_GROUND_Y as GUNMAN_REST_Y } from './entities/Enemy'; // Enemy.js's OWN ground constant (310) — different from this file's local ENEMY_GROUND_Y (340), which is only the pre-physics spawn y
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const ENEMY_GROUND_Y = 340;
const PLAYER_MAX_HEALTH = 10;

// Eagle flies at a height reachable only via a genuine double-jump, not a
// single jump. Bullets only travel horizontally, so the player can only
// hit the eagle if their gun-height AT THE MOMENT OF FIRING overlaps this
// range. A single jump's best bullet-height is ~y205 (never reaches this
// box); a realistically-timed (not frame-perfect) double jump lands
// around y140-170, which sits comfortably inside it.
const EAGLE_HEIGHT_Y = 150;

// Arena span enemies are allowed to patrol within, split evenly per enemy.
const ARENA_MIN_X = 480;
const ARENA_MAX_X = 750;

// Full-width patrol span eagles are allowed to fly within, split evenly
// per eagle when a level has more than one.
const EAGLE_ARENA_MIN_X = 0;
const EAGLE_ARENA_MAX_X = 800; // matches player's full reachable range (x: 0 to 760) — no dead corner
const EAGLE_WIDTH = 60;

// World 3 nested enemy: ship flies at eagle height, bees fly a bit lower.
const SHIP_HEIGHT_Y = 140; // was 90 — sits lower
const ICEBEE_HEIGHT_Y = SHIP_HEIGHT_Y + 100; // was +70 — bees sit noticeably lower than the ship
const VORTEX_HEIGHT_Y = 260; // hover lower than the eagle's flight lane, closer to the ground

// Twin Glaciers boss fight — fixed at opposite edges, stationary.
const GLACIER_Y = 235; // 180-tall body, feet at y=400 ground line + ~15px nudge lower
const GLACIER_LEFT_X = 0; // flush with the left corner
const GLACIER_RIGHT_X = 800 - 180; // flush with the right corner — 180 = glacier width
const GLACIER_FIGHT_GRACE_SECONDS = 1.5; // neither glacier fires for this long at fight start
const GLACIER_STALL_BEE_INTERVAL = 2.5; // no hit on EITHER glacier for this long -> spawn a bee
const MAX_GLACIER_STALL_BEES = 5; // cap so a bad run can't spiral into an unlimited swarm

function buildSpaceshipsForLevel(levelConfig) {
  if (!levelConfig.hasSpaceship) return [];
  const shipCount = levelConfig.shipCount ?? 1;
  const minX = EAGLE_ARENA_MIN_X;
  const maxX = EAGLE_ARENA_MAX_X - 90;
  const slotWidth = (maxX - minX) / shipCount;
  const ships = [];

  for (let i = 0; i < shipCount; i++) {
    const startX = minX + slotWidth * (i + 0.5);
    ships.push(new Spaceship(SHIP_HEIGHT_Y, levelConfig, { startX, minX, maxX }));
  }

  return ships;
}

// Full-width patrol span frogs are allowed to hop within.
const FROG_GROUND_Y = 340; // same baseline as gunmen — feet land on the same ground line
const FROG_ARENA_MIN_X = 0;
const FROG_ARENA_MAX_X = 800; // matches player's full reachable range — no dead corner
const FROG_WIDTH = 44;

// Boss sits fixed near the right edge; the shield gunmen it spawns patrol
// a lane in front of it so they never overlap the boss's own hitbox.
const BOSS_X = 640;
const BOSS_Y = 220; // feet at y=400, same ground line as everything else; lowered slightly so it sits cleaner with the arena
const BLACKHOLE_HEIGHT_Y = 100; // fixed flight height, same idea as SHIP_HEIGHT_Y

// 3 fixed spawn slots for the black hole's beings — evenly spread across
// the same right-side zone gunmen/yetis already use (ARENA_MIN_X to
// ARENA_MAX_X), positioned ahead of each other rather than randomly.
// Each slot holds at most one alive being; occupancy is checked via
// each being's own .slotIndex, tagged on at spawn time.
const BLACKHOLE_BEING_SLOT_X = [
  ARENA_MIN_X + (ARENA_MAX_X - ARENA_MIN_X) * (0.5 / 3),
  ARENA_MIN_X + (ARENA_MAX_X - ARENA_MIN_X) * (1.5 / 3),
  ARENA_MIN_X + (ARENA_MAX_X - ARENA_MIN_X) * (2.5 / 3),
];
const MAX_BOSS_SHIELD_ENEMIES = 2;
const MAX_TIME_GUNMEN = 1; // TimeDistorter: one time-gunman at a time, with a 3-HP health pool
const SHIELD_PATROL_MIN_X = 480;
const SHIELD_PATROL_MAX_X = 620;

// World 2 boss (BossFrog) actually hops around, unlike World 1's
// stationary Boss — give it a wide lane across most of the canvas (not
// boxed into the right half) and a swarm cap for its babies. Max bound
// has the boss's own width subtracted so its hop never clips past the
// right edge of the canvas.
// Muzzle height gunmen/martian cats fire from (ENEMY_GROUND_Y=310, their
// own height=90, same 0.35 ratio Enemy.js uses) — boss fire anchors to
// this absolute height instead of its own much-taller hitbox ratio, so
// all fire attacks sit in the same visual lane.
const GUNMEN_FIRE_HEIGHT_Y = GUNMAN_REST_Y + 90 * 0.35 - 2; // matches the actual settled y gunmen fire from, not the pre-physics spawn constant

const BOSSFROG_ARENA_MIN_X = 0;
const BOSSFROG_HOP_MAX_X = 800 - 110; // boss's OWN right hop bound (110 = BossFrog's width) — do not reuse this for babies, it's already width-adjusted for the boss specifically
const MAX_BOSSFROG_BABIES = 5;

// Sheets/images are cached by path+dimensions so switching worlds never
// reloads or recreates an asset that's shared across worlds (e.g. the
// player sprite), while still giving each world its own enemy/eagle/boss/
// background art. A world can pass `null` for any sprite it doesn't have
// yet (e.g. World 2 has no eagle/boss) — every draw call downstream
// already handles a null sheet gracefully (falls back to a placeholder).
const spriteSheetCache = {};
function getSheet(spec) {
  if (!spec) return null;
  const key = `${spec.path}|${spec.frameWidth}|${spec.frameHeight}|${spec.columns}|${spec.rows}`;
  if (!spriteSheetCache[key]) {
    spriteSheetCache[key] = new SpriteSheet(spec.path, spec.frameWidth, spec.frameHeight, spec.columns, spec.rows);
  }
  return spriteSheetCache[key];
}

const imageCache = {};
function getImage(path) {
  if (!path) return null;
  if (!imageCache[path]) {
    const img = new Image();
    img.src = path;
    imageCache[path] = img;
  }
  return imageCache[path];
}

// Ghost-blink overlay for Vortex's teleport (universal player-status
// effect, same reasoning as freezeCrystalSheet above — not per-world). 
const ghostSheet = getSheet({
  path: '/sprites/ghost.png',
  frameWidth: 244,
  frameHeight: 240,
  columns: 4,
  rows: 1,
});

// Freeze-crystal overlay is a universal player-status effect, not a
// per-world reskin, so it's a fixed global asset rather than something
// declared in worlds.js.
const freezeCrystalSheet = getSheet({
  path: '/sprites/freeze_crystals.png',
  frameWidth: 300,
  frameHeight: 700,
  columns: 4,
  rows: 1,
});
// Duck costume for SittingDuck's transformation — universal player-status
// asset, same reasoning as freezeCrystalSheet/ghostSheet above (not
// per-world). TODO: once duck.png exists, uncomment and fill in its real
// frame dimensions (2 rows: row 0 idle, row 1 walk, at least 2 columns):
const duckSheet = getSheet({
  path: '/sprites/duck.png',
  frameWidth: 301,
  frameHeight: 301,
  columns: 4,
  rows: 4,
});
// Builds N enemies for a level config, splitting the arena into N
// non-overlapping patrol slots and starting each enemy in the middle of its slot.
function buildEnemiesForLevel(levelConfig) {
  const enemyCount = levelConfig.enemyCount ?? 0;
  if (enemyCount <= 0) return []; // e.g. an eagle-only level with no gunmen
  const slotWidth = (ARENA_MAX_X - ARENA_MIN_X) / enemyCount;
  const enemies = [];

  for (let i = 0; i < enemyCount; i++) {
    const slotMin = ARENA_MIN_X + i * slotWidth;
    const slotMax = slotMin + slotWidth;
    const startX = slotMin + slotWidth / 2;

    enemies.push(
      new Enemy(startX, ENEMY_GROUND_Y, {
        health: levelConfig.health,
        moveSpeed: levelConfig.moveSpeed,
        bulletSpeed: levelConfig.bulletSpeed,
        actionIntervalMin: levelConfig.actionIntervalMin,
        actionIntervalMax: levelConfig.actionIntervalMax,
        reactionDelayMin: levelConfig.reactionDelayMin,
        reactionDelayMax: levelConfig.reactionDelayMax,
        fireSequence: levelConfig.fireSequence,
        burstGap: levelConfig.burstGap,
        patrolMinX: slotMin,
        patrolMaxX: slotMax,
      })
    );
  }

  return enemies;
}
function buildREGsForLevel(levelConfig) {
  if (!levelConfig.hasREG) return [];
  const regCount = levelConfig.regCount ?? 1;
  const slotWidth = (ARENA_MAX_X - ARENA_MIN_X) / regCount;
  const regs = [];

  for (let i = 0; i < regCount; i++) {
    const startX = ARENA_MIN_X + slotWidth * (i + 0.5);
    regs.push(new REG(startX, 310, {
      ...levelConfig,
      regHealth: levelConfig.regHealth ?? 14,
      regArenaMinX: ARENA_MIN_X,
      regArenaMaxX: ARENA_MAX_X,
    }));
  }

  return regs;
}

function buildShapeshiftersForLevel(levelConfig) {
  if (!levelConfig.hasShapeshifter) return [];
  const count = levelConfig.shapeshifterCount ?? 1;
  const slotWidth = (ARENA_MAX_X - ARENA_MIN_X) / count;
  const shapeshifters = [];

  for (let i = 0; i < count; i++) {
    const startX = ARENA_MIN_X + slotWidth * (i + 0.5);
    shapeshifters.push(new Shapeshifter(startX, 310, levelConfig));
  }

  return shapeshifters;
}

// DarkMatterBeing is stationary like Yeti, so it shares the exact same
// arena-slot spread pattern — only the class and the ground y differ.
function buildDarkMatterBeingsForLevel(levelConfig) {
  if (!levelConfig.hasDarkMatter) return [];
  const darkMatterCount = levelConfig.darkMatterCount ?? 1;
  const slotWidth = (ARENA_MAX_X - ARENA_MIN_X) / darkMatterCount;
  const beings = [];

  for (let i = 0; i < darkMatterCount; i++) {
    const startX = ARENA_MIN_X + slotWidth * (i + 0.5);
    // The sprite sheet is a full-body 4x2 tall form, so the resting y is
    // set lower to keep its feet on the ground line instead of squeezing it
    // into the old 44x90 placeholder bounds.
    beings.push(new DarkMatterBeing(startX, 230, levelConfig));
  }

  return beings;
}

// Single fixed patch per level, same simple shape as Cactus/Obstacle —
// non-solid (no collision blocking), so this doesn't need slot-splitting.
function buildQuicksandForLevel(levelConfig) {
  if (!levelConfig.hasQuicksand) return null;
  const x = levelConfig.quicksandX ?? 380;
  const width = levelConfig.quicksandWidth ?? 90;
  return new QuicksandPatch(x, 394, width); // y sits at the ground line itself
}

// Builds N yetis for a level config. Unlike Enemy/Eagle, yetis never move —
// "standing" is the whole point — so this just spreads their fixed spots
// across the arena when there's more than one.
function buildYetisForLevel(levelConfig) {
  if (!levelConfig.hasYeti) return [];
  const yetiCount = levelConfig.yetiCount ?? 1;
  const slotWidth = (ARENA_MAX_X - ARENA_MIN_X) / yetiCount;
  const yetis = [];

  for (let i = 0; i < yetiCount; i++) {
    const startX = ARENA_MIN_X + slotWidth * (i + 0.5);
    // NOT ENEMY_GROUND_Y (340) — that constant only looks right for the
    // gunman because Enemy.js has its own gravity/ground-clamp physics
    // that self-corrects it to 310 every frame. Yeti is stationary with
    // no physics at all, so whatever y it spawns with is permanent —
    // needs the real value (canvas ground line 400 - yeti height 90).
    yetis.push(new Yeti(startX, 310, levelConfig));
  }

  return yetis;
}
// Builds N eagles for a level config. All eagles now share the FULL patrol
// width instead of being locked into non-overlapping lanes — only their
// starting spot is staggered, plus a randomized speed and flight-height
// jitter, so with multiple eagles they naturally cross paths and pass each
// other instead of each looking robotically confined to its own slice.
function buildEaglesForLevel(levelConfig) {
  if (!levelConfig.hasEagle) return [];
  const eagleCount = levelConfig.eagleCount ?? 1;
  const span = EAGLE_ARENA_MAX_X - EAGLE_ARENA_MIN_X - EAGLE_WIDTH;
  const eagles = [];

  for (let i = 0; i < eagleCount; i++) {
    const startX = EAGLE_ARENA_MIN_X + (span * (i + 0.5)) / eagleCount; // stagger only, not a hard lane
    const speedMultiplier = 0.8 + Math.random() * 0.4; // 0.8x - 1.2x, so they don't move in lockstep
    const yJitter = (Math.random() - 0.5) * 24; // stays within the double-jump-reachable band

    eagles.push(
      new Eagle(EAGLE_HEIGHT_Y + yJitter, levelConfig, {
        startX,
        minX: EAGLE_ARENA_MIN_X,
        maxX: EAGLE_ARENA_MAX_X - EAGLE_WIDTH,
        speedMultiplier,
      })
    );
  }

  return eagles;
}

function buildVorticesForLevel(levelConfig) {
  if (!levelConfig.hasVortex) return [];
  const vortexCount = levelConfig.vortexCount ?? 1;
  const width = 56;
  const span = EAGLE_ARENA_MAX_X - EAGLE_ARENA_MIN_X - width;
  const vortices = [];

  for (let i = 0; i < vortexCount; i++) {
    const startX = EAGLE_ARENA_MIN_X + (span * (i + 0.5)) / vortexCount;
    vortices.push(
      new Vortex(VORTEX_HEIGHT_Y, levelConfig, {
        startX,
        minX: EAGLE_ARENA_MIN_X,
        maxX: EAGLE_ARENA_MAX_X - width,
      })
    );
  }

  return vortices;
}
// Builds N frogs for a level config, same staggered-full-width approach as
// eagles (start positions spread across the patrol span, each with a
// small speed/pause jitter so multiple frogs don't hop in lockstep).
function buildFrogsForLevel(levelConfig) {
  if (!levelConfig.hasFrog) return [];
  const frogCount = levelConfig.frogCount ?? 1;
  const span = FROG_ARENA_MAX_X - FROG_ARENA_MIN_X - FROG_WIDTH;
  const frogs = [];

  for (let i = 0; i < frogCount; i++) {
    const startX = FROG_ARENA_MIN_X + (span * (i + 0.5)) / frogCount;
    const jitterConfig = {
      ...levelConfig,
      frogHopSpeed: (levelConfig.frogHopSpeed ?? 130) * (0.85 + Math.random() * 0.3),
      frogPauseMin: (levelConfig.frogPauseMin ?? 0.4) * (0.85 + Math.random() * 0.3),
    };

    frogs.push(
      new Frog(FROG_GROUND_Y, jitterConfig, {
        startX,
        minX: FROG_ARENA_MIN_X,
        maxX: FROG_ARENA_MAX_X - FROG_WIDTH,
      })
    );
  }

  return frogs;
}
// Draws a circular HUD portrait — sprite sheet's idle frame if loaded,
// otherwise a flat-color circle with a single-letter fallback so the HUD
// never shows a blank gap while art is loading.
function drawHudPortrait(ctx, sheet, centerX, centerY, radius, fallbackColor, fallbackLabel, cropOptions) {
  ctx.save();

  const drew = sheet
    ? cropOptions
      ? sheet.drawPortrait(
        ctx, 0, 0, centerX, centerY, radius,
        cropOptions.cropRatio, cropOptions.cropTopRatio, cropOptions.cropLeftRatio
      )
      : sheet.drawPortrait(ctx, 0, 0, centerX, centerY, radius)
    : false;

  if (!drew) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = fallbackColor;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallbackLabel, centerX, centerY);
    ctx.textBaseline = 'alphabetic';
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

// Draws a labeled HP bar that fades green -> red as pct drops.
function drawHpBar(ctx, x, y, width, height, pct, label, labelAlign) {
  const clamped = Math.max(0, Math.min(1, pct));

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x - 3, y - 3, width + 6, height + 6);

  ctx.fillStyle = '#444';
  ctx.fillRect(x, y, width, height);

  const green = { r: 34, g: 197, b: 94 };
  const red = { r: 220, g: 38, b: 38 };
  const r = Math.round(red.r + (green.r - red.r) * clamped);
  const g = Math.round(red.g + (green.g - red.g) * clamped);
  const b = Math.round(red.b + (green.b - red.b) * clamped);
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(x, y, width * clamped, height);

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = '#fff';
  ctx.font = '11px monospace';
  ctx.textAlign = labelAlign;
  ctx.fillText(label, labelAlign === 'left' ? x : x + width, y - 6);
}
// Draws the level number + control hints in the empty gap between the two
// HP bar clusters at the top of the canvas — stays in canvas coordinate
// space so it never drifts over gameplay near the ground, unlike a
// screen-space DOM overlay would on different aspect ratios.
function drawTopCenterHud(ctx, levelDisplay) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';

  ctx.font = 'bold 12px monospace';
  ctx.fillText(`LEVEL ${levelDisplay}/10`, CANVAS_WIDTH / 2, 20);

  ctx.font = '10px monospace';
  ctx.fillStyle = '#ccc';
  ctx.fillText('A/D MOVE  •  SPACE JUMP  •  F SHOOT', CANVAS_WIDTH / 2, 34);

  ctx.restore();
}

function drawTimeDistorterOverlay(ctx, boss) {
  if (!(boss instanceof TimeDistorter) || !boss.alive) return;
  if (boss.phase !== 'reversal' && boss.phase !== 'inversion') return;

  const label = boss.phase === 'reversal' ? 'REVERSAL' : 'INVERSION';
  const tint = boss.phase === 'reversal'
    ? { r: 130, g: 255, b: 150 }
    : { r: 255, g: 130, b: 130 };

  const wave = performance.now() * 0.006;
  const baseX = CANVAS_WIDTH / 2;
  const baseY = CANVAS_HEIGHT / 2;

  ctx.save();
  ctx.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.12)`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px "Press Start 2P", monospace';
  ctx.lineWidth = 2;

  for (let i = -4; i <= 4; i += 1) {
    const x = baseX + i * 2.4;
    const y = baseY + Math.sin(wave + i * 0.7) * 12;
    const alpha = 0.06 + ((4 - Math.abs(i)) / 20);
    ctx.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${alpha})`;
    ctx.fillText(label, x, y);
  }

  ctx.translate(baseX, baseY);
  ctx.rotate(Math.sin(wave) * 0.08);
  ctx.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.26)`;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeText(label, 0, Math.sin(wave * 1.7) * 10);
  ctx.fillText(label, 0, Math.sin(wave * 1.7) * 10);
  ctx.restore();
}

export default function GameCanvas({ worldIndex = 0, initialLevelIndex = 0, onLevelComplete, onExitToMenu }) {
  const world = WORLDS[worldIndex] ?? WORLDS[0];
  const LEVELS = world.levels; // every existing LEVELS[...] reference below now resolves per-world, unchanged

  const playerSheet = getSheet(world.sprites.player);
  const playerExtraSheet = getSheet(world.sprites.playerExtra);
  const enemySheet = getSheet(world.sprites.enemy ?? world.sprites.martianCat);
  const martianCatSheet = getSheet(world.sprites.martianCat ?? world.sprites.enemy);
  const eagleSheet = getSheet(world.sprites.eagle);
  const yetiSheet = getSheet(world.sprites.yeti);
  const shipSheet = getSheet(world.sprites.spaceship);
  const glacierSheet = getSheet(world.sprites.glacier);
  const iceBeeSheet = getSheet(world.sprites.iceBee);
  const bossSheet = getSheet(world.sprites.boss);
  const moonBgSheet = getSheet(world.sprites.background);
  const obstacleImage = getImage(world.sprites.obstacle);
  const cactusImage = getImage(world.sprites.cactus);
  const sittingDuckImage = getImage(world.sprites.sittingDuck);
  const quicksandImage = getImage(world.sprites.quicksand);
  const icebergImage = getImage(world.sprites.iceberg);
  const vortexSheet = getSheet(world.sprites.vortex);
  const regGlitchSheet = getSheet(world.sprites.regGlitch);
  const darkMatterSheet = getSheet(world.sprites.darkMatter);
    const shapeshifterSheet = getSheet(world.sprites.shapeshifter);
  const pullPushRaysSheet = getSheet(world.sprites.pullPushRays);
  const pullPushRaysGreenSheet = getSheet(world.sprites.pullPushRaysGreen);
  const frogSheet = getSheet(world.sprites.frog);
  const smokeSheet = getSheet(world.sprites.smoke);

  const canvasRef = useRef(null);
  const [health, setHealth] = useState(10);
  const [levelNumber, setLevelNumber] = useState(LEVELS[initialLevelIndex].level);
  const [runSummary, setRunSummary] = useState({ stars: 0, coins: 0, hp: PLAYER_MAX_HEALTH, rewarded: false });
  const [resultOverlay, setResultOverlay] = useState(null);
  // 'playing' | 'dying' | 'gameover' | 'celebrating' | 'levelComplete' | 'gameComplete'
  // 'dying'/'celebrating' are animation-only holds: the death/victory sprite
  // sequence plays out (gameplay paused) before flipping to the actual
  // result screen, so results never appear mid-animation.
  const [gameState, setGameState] = useState('playing');

  const playerRef = useRef(new Player(100, 310));
  const enemiesRef = useRef(buildEnemiesForLevel(LEVELS[initialLevelIndex]));
  const backgroundRef = useRef(new Background(moonBgSheet, 0.20));
  const enemyBulletsRef = useRef([]);
  const bulletsRef = useRef([]);
  const obstacleRef = useRef(LEVELS[initialLevelIndex].hasObstacle ? new Obstacle(380, 300) : null);
  const cactusRef = useRef(LEVELS[initialLevelIndex].hasCactus ? new Cactus(380, 310) : null);
  const quicksandRef = useRef(buildQuicksandForLevel(LEVELS[initialLevelIndex]));
  // Boss-level (World 4 L10) smoke patches — 3 QuicksandPatch tiles covering
  // the middle third (x 266–533) so the same smoke animation plays when the
  // player is stuck in the BlackHoleBoss quicksand zone. Only non-null on the
  // boss level; normal levels leave this null.
  const bossSmokeRef = useRef(
    LEVELS[initialLevelIndex].hasBlackHoleBoss
      ? (() => {
        const ZONE_WIDTH = 800 / 3;
        const tileW = ZONE_WIDTH / 3;
        return [
          new QuicksandPatch(ZONE_WIDTH, 394, tileW),
          new QuicksandPatch(ZONE_WIDTH + tileW, 394, tileW),
          new QuicksandPatch(ZONE_WIDTH + tileW * 2, 394, tileW),
        ];
      })()
      : null
  );
  const icebergRef = useRef(
    LEVELS[initialLevelIndex].hasIceberg ? new Iceberg(345, { ...LEVELS[initialLevelIndex], minX: 0, maxX: 800 - 26 }) : null
  );
  const sittingDuckRef = useRef(
    LEVELS[initialLevelIndex].hasSittingDuck
      ? new SittingDuck(358, { ...LEVELS[initialLevelIndex], sittingDuckSpeed: 75, minX: 0, maxX: 800 - 90 })
      : null
  );
  const eaglesRef = useRef(buildEaglesForLevel(LEVELS[initialLevelIndex]));
  const vorticesRef = useRef(buildVorticesForLevel(LEVELS[initialLevelIndex]));
  const darkMattersRef = useRef(buildDarkMatterBeingsForLevel(LEVELS[initialLevelIndex]));
  const regsRef = useRef(buildREGsForLevel(LEVELS[initialLevelIndex]));
  const shapeshiftersRef = useRef(buildShapeshiftersForLevel(LEVELS[initialLevelIndex]));
  const rayEffectRef = useRef(new RayEffect());
  const rayEffectGreenRef = useRef(new RayEffect());
  const yetisRef = useRef(buildYetisForLevel(LEVELS[initialLevelIndex]));
  const yetiProjectilesRef = useRef([]);
  const spaceshipsRef = useRef(buildSpaceshipsForLevel(LEVELS[initialLevelIndex]));
  const iceBeesRef = useRef([]); // spawned dynamically at runtime by the spaceship, never built up front
  const iceBeeProjectilesRef = useRef([]);
  const shipProjectilesRef = useRef([]);
  const leftGlacierRef = useRef(LEVELS[initialLevelIndex].hasTwinGlaciers ? new Glacier(GLACIER_LEFT_X, GLACIER_Y, 'left', LEVELS[initialLevelIndex]) : null);
  const rightGlacierRef = useRef(LEVELS[initialLevelIndex].hasTwinGlaciers ? new Glacier(GLACIER_RIGHT_X, GLACIER_Y, 'right', LEVELS[initialLevelIndex]) : null);
  const glacierFightTimerRef = useRef(0); // counts up from level start — gates the 3s firing grace period
  const glacierStallTimerRef = useRef(0); // counts up since the last successful hit on either glacier
  const glacierStallBeeCountRef = useRef(0); // total bees spawned via the stall mechanic this level, capped
  const eagleProjectilesRef = useRef([]);
  const frogsRef = useRef(buildFrogsForLevel(LEVELS[initialLevelIndex]));
  const bossRef = useRef(
    LEVELS[initialLevelIndex].hasBoss
      ? new Boss(BOSS_X, BOSS_Y, LEVELS[initialLevelIndex])
      : LEVELS[initialLevelIndex].hasBossFrog
        ? new BossFrog(FROG_GROUND_Y, {
          ...LEVELS[initialLevelIndex],
          arenaMinX: BOSSFROG_ARENA_MIN_X,
          arenaMaxX: BOSSFROG_HOP_MAX_X,
        })
        : LEVELS[initialLevelIndex].hasBlackHoleBoss
          ? new BlackHoleBoss(BLACKHOLE_HEIGHT_Y, LEVELS[initialLevelIndex], { startX: 400, minX: 0, maxX: 800 - 70 })
          : LEVELS[initialLevelIndex].hasTimeDistorter
            ? new TimeDistorter(BOSS_X, BOSS_Y, LEVELS[initialLevelIndex])
            : null
  );
  const timeGunmenRef = useRef([]); // World 5 boss: spawned by TimeDistorter, capped at 3 alive
  const levelConfigRef = useRef(LEVELS[initialLevelIndex]);
  const keysRef = useRef({});
  const gameStateRef = useRef('playing');
  const levelIndexRef = useRef(initialLevelIndex); // 0-based index into LEVELS
  const outroTargetRef = useRef(null); // 'levelComplete' | 'gameComplete' — which screen to show once the victory animation finishes
  const coinsEarnedRef = useRef(0);

  const awardCoinReward = () => {
    const reward = 200 + Math.floor(Math.random() * 51);
    coinsEarnedRef.current += reward;
    setRunSummary((prev) => ({
      ...prev,
      coins: coinsEarnedRef.current,
      hp: Math.max(playerRef.current.health, 0),
      rewarded: true,
    }));
  };

  const startLevel = (index, keepHealth = true) => {
    levelIndexRef.current = index;
    const config = LEVELS[index];

    playerRef.current.x = 100;
    playerRef.current.y = 310;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    if (!keepHealth) {
      playerRef.current.health = PLAYER_MAX_HEALTH;
    } else {
      playerRef.current.health = Math.min(PLAYER_MAX_HEALTH, playerRef.current.health + 1);
    }

    coinsEarnedRef.current = 0;
    setRunSummary({ stars: 0, coins: 0, hp: playerRef.current.health, rewarded: false });
    setResultOverlay(null);

    enemiesRef.current = buildEnemiesForLevel(config);
    enemyBulletsRef.current = [];
    bulletsRef.current = [];
    obstacleRef.current = config.hasObstacle ? new Obstacle(380, 300) : null;
    cactusRef.current = config.hasCactus ? new Cactus(380, 310) : null;
    quicksandRef.current = buildQuicksandForLevel(config);
    icebergRef.current = config.hasIceberg ? new Iceberg(345, { ...config, minX: 0, maxX: 800 - 26 }) : null;
    sittingDuckRef.current = config.hasSittingDuck
      ? new SittingDuck(358, { ...config, sittingDuckSpeed: 75, minX: 0, maxX: 800 - 90 })
      : null;
    eaglesRef.current = buildEaglesForLevel(config);
    vorticesRef.current = buildVorticesForLevel(config);
    darkMattersRef.current = buildDarkMatterBeingsForLevel(config);
    regsRef.current = buildREGsForLevel(config);
    shapeshiftersRef.current = buildShapeshiftersForLevel(config);
    yetisRef.current = buildYetisForLevel(config);
    yetiProjectilesRef.current = [];
    spaceshipsRef.current = buildSpaceshipsForLevel(config);
    iceBeesRef.current = [];
    iceBeeProjectilesRef.current = [];
    shipProjectilesRef.current = [];
    leftGlacierRef.current = config.hasTwinGlaciers ? new Glacier(GLACIER_LEFT_X, GLACIER_Y, 'left', config) : null;
    rightGlacierRef.current = config.hasTwinGlaciers ? new Glacier(GLACIER_RIGHT_X, GLACIER_Y, 'right', config) : null;
    glacierFightTimerRef.current = 0;
    glacierStallTimerRef.current = 0;
    glacierStallBeeCountRef.current = 0;
    eagleProjectilesRef.current = [];
    frogsRef.current = buildFrogsForLevel(config);
    bossRef.current = config.hasBoss
      ? new Boss(BOSS_X, BOSS_Y, config)
      : config.hasBossFrog
        ? new BossFrog(FROG_GROUND_Y, { ...config, arenaMinX: BOSSFROG_ARENA_MIN_X, arenaMaxX: BOSSFROG_HOP_MAX_X })
        : config.hasBlackHoleBoss
          ? new BlackHoleBoss(BLACKHOLE_HEIGHT_Y, config, { startX: 400, minX: 0, maxX: 800 - 70 })
          : config.hasTimeDistorter
            ? new TimeDistorter(BOSS_X, BOSS_Y, config)
            : null;
    timeGunmenRef.current = [];
    bossSmokeRef.current = config.hasBlackHoleBoss
      ? (() => {
        const ZONE_WIDTH = 800 / 3;
        const tileW = ZONE_WIDTH / 3;
        return [
          new QuicksandPatch(ZONE_WIDTH, 394, tileW),
          new QuicksandPatch(ZONE_WIDTH + tileW, 394, tileW),
          new QuicksandPatch(ZONE_WIDTH + tileW * 2, 394, tileW),
        ];
      })()
      : null;
    levelConfigRef.current = config;

    gameStateRef.current = 'playing';
    setGameState('playing');
    setLevelNumber(config.level);
    setHealth(playerRef.current.health);
  };

  const restartCurrentLevel = () => {
    playerRef.current = new Player(100, 310);
    startLevel(levelIndexRef.current, false);
  };

  const computeStarsForHp = (hpLeft) => {
    if (hpLeft >= 8) return 3;
    if (hpLeft >= 4) return 2;
    if (hpLeft >= 1) return 1;
    return 0;
  };

  const finalizeRunSummary = (hpLeft) => {
    const stars = computeStarsForHp(hpLeft);
    const summary = { stars, coins: coinsEarnedRef.current, hp: hpLeft, rewarded: true };
    setRunSummary(summary);
    return summary;
  };


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function shoot() {
      if (gameStateRef.current !== 'playing') return;
      const player = playerRef.current;
      if (!player.canShoot()) return;
      const direction = player.facing;
      const bulletX = direction === 'right' ? player.x + player.width : player.x;
      const bulletY = player.y + player.height * 0.35 - 2; // ~gun height, not box-center
      // BlackHoleBoss LEFT-zone effect: player's own shots spawn at half
      // speed while the boss is currently in the left third, regardless of
      // where the player is standing.
      const blackHoleZone = bossRef.current && bossRef.current.currentZone ? bossRef.current.currentZone : null;
      const bulletSpeedMultiplier = blackHoleZone === 'left' ? 0.5 : 1;
      bulletsRef.current.push(new Bullet(bulletX, bulletY, direction, bulletSpeedMultiplier));
      player.triggerShoot();
      playSound('shoot', 0.5);
    }

    const JUMP_KEYS = ['ArrowUp', ' ', 'w', 'W'];

    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;

      if (gameStateRef.current === 'gameover' && (e.key === 'r' || e.key === 'R')) {
        restartCurrentLevel();
      }

      if (gameStateRef.current === 'levelComplete' && (e.key === 'n' || e.key === 'N' || e.key === ' ')) {
        onLevelComplete && onLevelComplete(levelIndexRef.current, runSummary);
      }

      if (gameStateRef.current === 'gameComplete' && (e.key === 'r' || e.key === 'R')) {
        onLevelComplete && onLevelComplete(levelIndexRef.current, runSummary);
      }

      if (gameStateRef.current === 'levelComplete' && (e.key === 'r' || e.key === 'R')) {
        restartCurrentLevel();
      }

      if (gameStateRef.current === 'gameComplete' && (e.key === 'n' || e.key === 'N' || e.key === ' ')) {
        onLevelComplete && onLevelComplete(levelIndexRef.current, runSummary);
      }

      if (e.key === 'Escape' && gameStateRef.current === 'playing') {
        onExitToMenu && onExitToMenu();
      }

      if ((e.key === 'f' || e.key === 'F') && gameStateRef.current === 'playing') {
        shoot();
      }

      const invertActive = bossRef.current instanceof TimeDistorter && bossRef.current.invertActive;

      if (!e.repeat && gameStateRef.current === 'playing') {
        if (!invertActive && JUMP_KEYS.includes(e.key)) {
          playerRef.current.jump();
        } else if (invertActive && e.key === 'ArrowDown') {
          // Vertical inversion: down now jumps.
          playerRef.current.jump();
        }
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let lastTime = performance.now();
    let animationFrameId;

    function update(dt) {
      const player = playerRef.current;

      // Death/victory animation is playing out — freeze gameplay, just let
      // the outro-locked player advance its own frames, and flip to the
      // real result screen once it's done.
      if (gameStateRef.current === 'dying' || gameStateRef.current === 'celebrating') {
        player.update(dt);
        if (player.animComplete) {
          if (gameStateRef.current === 'dying') {
            gameStateRef.current = 'gameover';
            setGameState('gameover');
          } else {
            gameStateRef.current = outroTargetRef.current;
            setGameState(outroTargetRef.current);
          }
        }
        return;
      }

      if (gameStateRef.current !== 'playing') return;

      const wasGrounded = player.isGrounded;

      const invertActive = bossRef.current instanceof TimeDistorter && bossRef.current.invertActive;
      if (invertActive) {
        // Horizontal: left<->right (both arrow keys and WASD-style a/d).
        // Vertical: down now jumps (handled as a keydown edge above);
        // jump-keys held now triggers the sit pose instead of a jump.
        const raw = keysRef.current;
        const shadowKeys = {
          ...raw,
          ArrowLeft: raw['ArrowRight'],
          ArrowRight: raw['ArrowLeft'],
          a: raw['d'],
          d: raw['a'],
        };
        player.handleInput(shadowKeys);
        player.setSitting(JUMP_KEYS.some((k) => !!raw[k]));
      } else {
        player.handleInput(keysRef.current);
        player.setSitting(!!keysRef.current['ArrowDown']);
      }

      const prevPlayerX = player.x;
      const wasPlayerVxZero = player.vx === 0;
      player.update(dt);
      if (!player.reversing) player.recordHistory(dt); // TimeDistorter reversal source buffer

      // Solid wall: push the player back out if it's grounded-level overlap.
      // No y-overlap once the player jumps above it, so this naturally lets
      // the player pass overhead.
      const obstacle = obstacleRef.current;
      if (obstacle && isColliding(player.getBounds(), obstacle.getBounds())) {
        if (prevPlayerX < obstacle.x) {
          player.x = obstacle.x - player.width;
        } else {
          player.x = obstacle.x + obstacle.width;
        }
      }

      // Cactus: Obstacle/Frog hybrid — same solid push-back as the wall
      // above, PLUS contact damage like a frog. player.takeHit() already
      // has its own invulnerability window, so standing against it doesn't
      // drain HP every frame.
      const cactus = cactusRef.current;
      if (cactus && isColliding(player.getBounds(), cactus.getBounds())) {
        if (prevPlayerX < cactus.x) {
          player.x = cactus.x - player.width;
        } else {
          player.x = cactus.x + cactus.width;
        }
      }

      // Quicksand: NOT solid — no push-back, the player walks freely onto
      // it. Only triggers when player is FULLY on the patch (both feet) while
      // grounded. Jumping over it is unaffected mid-air; landing back on it
      // while already stuck is a no-op since enterQuicksand() is idempotent.
      // Escaping only happens via a successful hit on a Vortex/DarkMatterBeing
      // — see the bullet collision blocks further down.
      const quicksand = quicksandRef.current;
      if (quicksand) {
        quicksand.update(dt, player.stuck);
        if (player.isGrounded && quicksand.isFullyOn(player.x, player.width)) {
          player.enterQuicksand();
        }
      }

      // Iceberg: moves on its own every frame regardless of the player.
      // Solid like the cactus (push-back), but freezes on contact instead
      // of just blocking — and never deals damage.
      const iceberg = icebergRef.current;
      if (iceberg) {
        iceberg.update(dt);
        if (isColliding(player.getBounds(), iceberg.getBounds())) {
          // Extra clearance (not just flush) plus a flat 1s freeze (matching
          // the normal 1s invulnerability window exactly, same as fire hits)
          // — without this, the still-drifting iceberg could close the gap
          // again right as invulnerability lapsed, causing a freeze/unfreeze
          // loop while still in contact.
          const ICEBERG_PUSHBACK_MARGIN = 45;
          if (prevPlayerX < iceberg.x) {
            player.x = iceberg.x - player.width - ICEBERG_PUSHBACK_MARGIN;
          } else {
            player.x = iceberg.x + iceberg.width + ICEBERG_PUSHBACK_MARGIN;
          }
          player.freezeOnly(1.0, 1.0);
        }
      }

      // SittingDuck: not solid — simple overlap check, no pushback.
      // Damages once (gated by the hit's own invulnerability window) and
      // triggers the duck status (gated separately on the player side).
      if (sittingDuckRef.current) {
        sittingDuckRef.current.update(dt);
        if (isColliding(player.getBounds(), sittingDuckRef.current.getBounds())) {
          player.takeHit();
          player.enterDuck(3.0);
        }
      }

      const enemies = enemiesRef.current;
      const playerJustJumped = wasGrounded && !player.isGrounded;

      for (const enemy of enemies) {
        if (!enemy.alive) continue;

        if (playerJustJumped) {
          enemy.triggerDelayedReaction();
        }

        enemy.update(dt, player.x);

        if (enemy.wantsToFire) {
          enemy.wantsToFire = false;
          const bulletY = enemy.y + enemy.height * 0.35 - 2; // ~gun height, not box-center
          const bulletX = enemy.facing === 'right' ? enemy.x + enemy.width : enemy.x;
          enemyBulletsRef.current.push(
            new EnemyBullet(bulletX, bulletY, enemy.facing, enemy.bulletSpeed)
          );
        }
      }

      enemyBulletsRef.current.forEach((o) => o.update(dt));
      enemyBulletsRef.current = enemyBulletsRef.current.filter((o) => !o.isOffScreen());

      bulletsRef.current.forEach((b) => b.update(dt));
      bulletsRef.current = bulletsRef.current.filter((b) => !b.isOffScreen(CANVAS_WIDTH));

      const playerBounds = player.getBounds();
      for (const bullet of enemyBulletsRef.current) {
        if (isColliding(playerBounds, bullet.getBounds())) {
          player.takeHit();
          playSound('hit', 0.6);
        }
      }

      // Eagles: patrol/throw update per eagle, then all their projectiles
      // (pooled together) get their own arc + collision. Every eagle is
      // shootable, and ALL must be defeated (with the ground gunmen) to
      // clear the level.
      const eagles = eaglesRef.current;
      for (const eagle of eagles) {
        if (!eagle.alive) continue;

        eagle.update(dt);
        if (eagle.wantsToThrow) {
          eagle.wantsToThrow = false;
          const throwX = eagle.x + eagle.width / 2;
          const throwY = eagle.y + eagle.height;
          const throwVx = eagle.randomThrowVx();
          eagleProjectilesRef.current.push(new EagleProjectile(throwX, throwY, throwVx));
        }
      }

      eagleProjectilesRef.current.forEach((p) => p.update(dt));
      eagleProjectilesRef.current = eagleProjectilesRef.current.filter((p) => {
        if (isColliding(playerBounds, p.getBounds())) {
          player.takeHit();
          return false; // consumed on hit
        }
        return !p.hasLanded(400); // 400 = ground line; despawn once it lands, hit or not
      });

      const vortices = vorticesRef.current;
      for (const vortex of vortices) {
        if (!vortex.alive) continue;
        vortex.update(dt);
        if (isColliding(playerBounds, vortex.getBounds())) {
          player.takeHit();
          player.teleportMirror(CANVAS_WIDTH);
        }
      }

      // DarkMatterBeing: stationary, fires like a gunman (reuses
      // EnemyBullet directly — no contact damage of its own, only its
      // shots hurt). The pull mechanic itself is driven from here every
      // frame: start a pull once stillTimer crosses 0.5s and a being is
      // alive, keep the target/speed live-updated toward whichever alive
      // being is closest while pulled, and force-end early if the being
      // count drops to 0 mid-pull.
      const darkMatters = darkMattersRef.current;
      const BASE_PULL_SPEED = 120; // px/s per alive being — 2 alive = 240px/s
      for (const being of darkMatters) {
        if (!being.alive) continue;
        being.update(dt, player.x, player.pulled);

        const playerBounds = player.getBounds();
        const sameVerticalBand =
          playerBounds.y + playerBounds.height > being.y + 12 &&
          playerBounds.y < being.y + being.height - 12;

        if (sameVerticalBand && isColliding(playerBounds, being.getBounds())) {
          if (prevPlayerX < being.x) {
            player.x = being.x - player.width;
          } else {
            player.x = being.x + being.width;
          }
          if (player.pulled) {
            player.endPull();
          }
        }
        if (being.wantsToFire) {
          being.wantsToFire = false;
          const bulletX = being.facing === 'right' ? being.x + being.width : being.x;
          const beingBulletSpeed =
            bossRef.current && bossRef.current.currentZone === 'right'
              ? being.bulletSpeed * 2
              : being.bulletSpeed;
          enemyBulletsRef.current.push(
            new EnemyBullet(bulletX, GUNMEN_FIRE_HEIGHT_Y, being.facing, beingBulletSpeed)
          );
        }
      }

      const regs = regsRef.current;
      for (const reg of regs) {
        if (!reg.alive) continue;

        reg.update(dt, player.x);

        if (reg.currentFormName === 'yeti' && reg.wantsToThrow) {
          reg.wantsToThrow = false;
          const throwY = reg.y + reg.height * 0.05;
          const throwX = reg.facing === 'right' ? reg.x + reg.width : reg.x;
          yetiProjectilesRef.current.push(
            new YetiProjectile(throwX, throwY, reg.facing, reg.projectileSpeed)
          );
        }

        if ((reg.currentFormName === 'darkMatter' || reg.currentFormName === 'enemy') && reg.wantsToFire) {
          reg.wantsToFire = false;
          // darkMatter form must fire from the same fixed height the
          // standalone DarkMatterBeing uses (GUNMEN_FIRE_HEIGHT_Y), not a
          // ratio of its own (much taller) body height — that ratio only
          // happens to line up correctly for the 'enemy' form, since its
          // height matches a standalone gunman's.
          const bulletY = reg.currentFormName === 'darkMatter'
            ? GUNMEN_FIRE_HEIGHT_Y
            : reg.y + reg.height * 0.35 - 2;
          const bulletX = reg.facing === 'right' ? reg.x + reg.width : reg.x;
          enemyBulletsRef.current.push(
            new EnemyBullet(bulletX, bulletY, reg.facing, reg.bulletSpeed)
          );
        }

        if (reg.currentFormName === 'frog' && isColliding(playerBounds, reg.getBounds())) {
          player.takeHit();
          playSound('hit', 0.6);
        }

        if (reg.currentFormName === 'vortex' && isColliding(playerBounds, reg.getBounds())) {
          player.takeHit();
          player.teleportMirror(CANVAS_WIDTH);
        }
      }

      // Shapeshifter: fires on its own timer in both phases, PLUS one
      // bonus shot the instant the player starts moving on the x-axis
      // while disguised (edge-triggered — only on the frame vx goes from
      // 0 to nonzero, not every frame it's held).
      const shapeshifters = shapeshiftersRef.current;
      const playerJustStartedMovingX = wasPlayerVxZero && player.vx !== 0;
      for (const ss of shapeshifters) {
        if (!ss.alive) continue;
        ss.update(dt, player.x);

        if (ss.wantsToFire) {
          ss.wantsToFire = false;
          if (ss.phase === 'disguise') {
            ss.flashDisguiseShootPose();
          } else {
            ss.flashNormalShootPose();
          }
          const bulletX = ss.facing === 'right' ? ss.x + ss.width : ss.x;
          enemyBulletsRef.current.push(
            new EnemyBullet(bulletX, GUNMEN_FIRE_HEIGHT_Y, ss.facing, ss.bulletSpeed)
          );
        }

        if (playerJustStartedMovingX && ss.phase === 'disguise') {
          ss.triggerMovementShot();
        }
        if (ss.wantsToFireMovementShot) {
          ss.wantsToFireMovementShot = false;
          ss.flashDisguiseShootPose();
          const bulletX = ss.facing === 'right' ? ss.x + ss.width : ss.x;
          enemyBulletsRef.current.push(
            new EnemyBullet(bulletX, GUNMEN_FIRE_HEIGHT_Y, ss.facing, ss.bulletSpeed)
          );
        }
      }

      // BlackHoleBoss: enforce the "max 3 alive" being cap here (boss
      // itself has no visibility into how many of its spawned beings are
      // still alive), and drive the middle-zone quicksand trap.
      if (bossRef.current instanceof BlackHoleBoss && bossRef.current.alive) {
        const boss = bossRef.current;
        rayEffectRef.current.update(dt);
        rayEffectGreenRef.current.update(dt);

        // Contact teleports the player to the opposite side, same as
        // Vortex — but deliberately NO damage, this boss never hurts on
        // contact, only its beings' shots do.
        if (isColliding(playerBounds, boss.getBounds())) {
          player.teleportMirror(CANVAS_WIDTH);
        }

        if (boss.wantsToSpawnBeing) {
          boss.wantsToSpawnBeing = false;
          // Prune dead beings before doing anything else — without this,
          // the array grows forever over a long fight (a new one spawns
          // every 2.5-4s indefinitely, dead ones were never removed),
          // and every frame's iteration over it gets slower and slower
          // until the tab locks up.
          darkMattersRef.current = darkMattersRef.current.filter((b) => b.alive);

          // 3 FIXED spawn slots spread across the right side, not the
          // boss's current x — each slot can only ever hold one alive
          // being at a time. If a slot's occupant is dead, that slot is
          // free again; if all 3 are currently occupied, skip this spawn
          // entirely (don't queue it up, don't stack into a taken spot).
          const occupiedSlots = new Set(
            darkMattersRef.current.map((b) => b.slotIndex)
          );
          const freeSlotIndex = BLACKHOLE_BEING_SLOT_X.findIndex((_, i) => !occupiedSlots.has(i));

          if (freeSlotIndex !== -1) {
            const being = new DarkMatterBeing(
              BLACKHOLE_BEING_SLOT_X[freeSlotIndex],
              230, // matches the already-correct ground-aligned y used by the normal level-spawn site (400 - height 170) — was stale at 310 from before DarkMatterBeing's height grew
              { ...levelConfigRef.current, darkMatterHealth: 2 }
            );
            being.slotIndex = freeSlotIndex;
            darkMattersRef.current.push(being);
          }
        }

        const ZONE_WIDTH = 800 / 3;
        const playerCenter = player.x + player.width / 2;
        const playerInMiddleThird = playerCenter >= ZONE_WIDTH && playerCenter < ZONE_WIDTH * 2;

        if (boss.currentZone === 'middle' && playerInMiddleThird && player.isGrounded) {
          player.enterQuicksand();
        } else if (player.stuck && boss.currentZone !== 'middle') {
          // Fight-specific auto-release: boss left the middle third while
          // the player was stuck, even without landing a hit.
          player.escapeQuicksand();
        }
        // Drive the boss-zone smoke patches with the player's stuck state so
        // they animate identically to normal-level quicksand smoke.
        if (bossSmokeRef.current) {
          for (const patch of bossSmokeRef.current) {
            patch.update(dt, player.stuck);
          }
        }
      }

      const aliveBeings = [
        ...darkMatters.filter((b) => b.alive),
        ...regs.filter((r) => r.alive && r.currentFormName === 'darkMatter').map((r) => r.currentForm),
      ].filter(Boolean);
      const pullSafetyGap = 16;
      if (player.pulled) {
        if (aliveBeings.length === 0) {
          player.endPull();
        } else {
          const closest = aliveBeings.reduce((a, b) =>
            Math.abs(a.x - player.x) <= Math.abs(b.x - player.x) ? a : b
          );
          let targetX = player.x < closest.x + closest.width / 2
            ? closest.x - pullSafetyGap - player.width
            : closest.x + closest.width + pullSafetyGap;
          // If stuck in quicksand, constrain pull to stay within patch bounds
          if (player.stuck && quicksandRef.current) {
            targetX = quicksandRef.current.constrainPullX(targetX, player.width);
          }
          player.updatePullTarget(targetX, BASE_PULL_SPEED * aliveBeings.length);
        }
      } else if (aliveBeings.length > 0 && player.stillTimer >= 0.5) {
        const closest = aliveBeings.reduce((a, b) =>
          Math.abs(a.x - player.x) <= Math.abs(b.x - player.x) ? a : b
        );
        let targetX = player.x < closest.x + closest.width / 2
          ? closest.x - pullSafetyGap - player.width
          : closest.x + closest.width + pullSafetyGap;
        // If stuck in quicksand, constrain pull to stay within patch bounds
        if (player.stuck && quicksandRef.current) {
          targetX = quicksandRef.current.constrainPullX(targetX, player.width);
        }
        player.startPull(targetX, BASE_PULL_SPEED * aliveBeings.length);
      }

      // Yetis: standing (never move), throw one big ice projectile at a
      // time toward whichever side the player is currently on. Contact
      // uses takeFreezeHit() instead of takeHit() — damages AND locks the
      // player's input for 1-1.5s, per the World 3 freeze mechanic.
      const yetis = yetisRef.current;
      for (const yeti of yetis) {
        if (!yeti.alive) continue;

        yeti.update(dt, player.x);
        if (yeti.wantsToThrow) {
          yeti.wantsToThrow = false;
          const throwY = yeti.y + yeti.height * 0.05; // was 0.35 — spawns a bit higher
          const throwX = yeti.facing === 'right' ? yeti.x + yeti.width : yeti.x;
          yetiProjectilesRef.current.push(
            new YetiProjectile(throwX, throwY, yeti.facing, yeti.projectileSpeed)
          );
        }
      }

      // Spaceships: fly, spawn bees while under cap, and once GameCanvas
      // confirms all 3 spawned bees are dead, switch to aggressor mode
      // and start firing (BossFireball reused — "slow projectiles").
      const spaceships = spaceshipsRef.current;
      const iceBees = iceBeesRef.current;
      for (const ship of spaceships) {
        if (!ship.alive) continue;
        ship.update(dt);

        if (ship.wantsToSpawnBee) {
          ship.wantsToSpawnBee = false;
          iceBeesRef.current.push(
            new IcyBee(ICEBEE_HEIGHT_Y, levelConfigRef.current, {
              startX: ship.x + ship.width / 2,
              minX: EAGLE_ARENA_MIN_X,
              maxX: EAGLE_ARENA_MAX_X - 34,
            })
          );
        }

        if (ship.beesSpawned >= 3 && iceBeesRef.current.every((b) => !b.alive)) {
          ship.activateAggressor();
        }

        if (ship.wantsToFire) {
          ship.wantsToFire = false;
          // Aims toward whichever side the player is currently on, same
          // idea as the bee's throwVx — not a random direction.
          const facingRight = player.x > ship.x;
          const throwX = ship.x + ship.width / 2;
          const throwY = ship.y + ship.height / 2;
          shipProjectilesRef.current.push(
            new ShipProjectile(throwX, throwY, ship.throwVx(facingRight))
          );
        }
      }

      for (const bee of iceBees) {
        if (!bee.alive) continue;
        bee.update(dt, player.x);
        if (bee.wantsToThrow) {
          bee.wantsToThrow = false;
          const throwX = bee.x + bee.width / 2;
          const throwY = bee.y + bee.height / 2;
          iceBeeProjectilesRef.current.push(
            new IceBeeProjectile(throwX, throwY, bee.throwVx(player.x))
          );
        }
      }

      iceBeeProjectilesRef.current.forEach((p) => p.update(dt));
      iceBeeProjectilesRef.current = iceBeeProjectilesRef.current.filter((p) => {
        if (isColliding(playerBounds, p.getBounds())) {
          player.takeFreezeHit(); // same freeze effect as the Yeti's own throw
          return false;
        }
        return !p.hasLanded(400);
      });

      shipProjectilesRef.current.forEach((p) => p.update(dt));
      shipProjectilesRef.current = shipProjectilesRef.current.filter((p) => {
        if (isColliding(playerBounds, p.getBounds())) {
          player.takeFreezeHit(); // now an ice ball, matching the bees and the World 3 theme
          return false;
        }
        return !p.hasLanded(400);
      });

      // Twin Glaciers: neither fires for the first 3s (relocation grace
      // period), then each fires on its own independent timer. A rolling
      // stall timer spawns a bee every 3s that passes with no successful
      // hit on EITHER glacier, capped so it can't spiral indefinitely.
      const leftGlacier = leftGlacierRef.current;
      const rightGlacier = rightGlacierRef.current;
      if (leftGlacier || rightGlacier) {
        glacierFightTimerRef.current += dt;
        const graceOver = glacierFightTimerRef.current >= GLACIER_FIGHT_GRACE_SECONDS;

        for (const glacier of [leftGlacier, rightGlacier]) {
          if (!glacier || !glacier.alive) continue;
          glacier.firingEnabled = graceOver;
          glacier.update(dt, player.x);

          if (glacier.wantsToFire) {
            glacier.wantsToFire = false;
            const shotY = GUNMEN_FIRE_HEIGHT_Y - 40; // anchored to the universal muzzle height, not a ratio of the golem's own (now larger) size
            const shotX = glacier.facing === 'right' ? glacier.x + glacier.width : glacier.x;
            enemyBulletsRef.current.push(
              new GlacierProjectile(shotX, shotY, glacier.facing, glacier.fireSpeed)
            );
          }
        }

        if (graceOver && (leftGlacier?.alive || rightGlacier?.alive)) {
          glacierStallTimerRef.current += dt;
          if (
            glacierStallTimerRef.current >= GLACIER_STALL_BEE_INTERVAL &&
            glacierStallBeeCountRef.current < MAX_GLACIER_STALL_BEES
          ) {
            glacierStallTimerRef.current = 0;
            glacierStallBeeCountRef.current += 1;
            iceBeesRef.current.push(
              new IcyBee(ICEBEE_HEIGHT_Y, { ...levelConfigRef.current, iceBeeHealth: 1 }, {
                startX: 400,
                minX: EAGLE_ARENA_MIN_X,
                maxX: EAGLE_ARENA_MAX_X - 34,
              })
            );
          }
        }
      }

      yetiProjectilesRef.current.forEach((p) => p.update(dt));
      yetiProjectilesRef.current = yetiProjectilesRef.current.filter((p) => {
        if (isColliding(playerBounds, p.getBounds())) {
          player.takeFreezeHit();
          playSound('hit', 0.6);
          return false; // consumed on hit
        }
        return !p.isOffScreen(CANVAS_WIDTH);
      });

      // Frogs: no projectiles at all — the only "attack" is contact. Each
      // frog just hops around on its own physics; touching the player
      // calls takeHit() directly, which is safe from multi-frame drain
      // because Player.js already has its own invulnerability window.
      const frogs = frogsRef.current;
      for (const frog of frogs) {
        if (!frog.alive) continue;
        frog.update(dt);
        if (isColliding(playerBounds, frog.getBounds())) {
          player.takeHit();
          playSound('hit', 0.6);
        }
      }

      // Boss: mostly stationary, cycles its own animation and just signals
      // when to fire or summon a shield gunman — GameCanvas enforces the
      // shield cap since Boss itself has no visibility into how many of
      // its spawned gunmen are still alive.
      const boss = bossRef.current;
      if (boss && boss.alive) {
        boss.update(dt, player.x);

        // Contact damage, same as a frog — player.takeHit() already has
        // its own invulnerability window, so standing against it doesn't
        // drain HP every frame.
        if (isColliding(playerBounds, boss.getBounds())) {
          player.takeHit();
          playSound('hit', 0.6);
        }

        // World 5's TimeDistorter intentionally uses the same straight
        // EnemyBullet pattern as the World 1/2 gunmen instead of the
        // oversized Level 1 boss fireball.
        if (!(boss instanceof TimeDistorter) && boss.wantsToFire) {
          boss.wantsToFire = false;
          // Anchored to the same muzzle height gunmen/cats fire from,
          // not boss.height-derived — the boss's hitbox is much taller,
          // so that ratio put its fire noticeably lower on screen.
          const bulletY = GUNMEN_FIRE_HEIGHT_Y;
          // BossFrog fires from whichever way it's actually facing (it
          // hops back and forth); World 1's Boss has no .direction and
          // always fires left, so that stays the fallback.
          const fireDirection = typeof boss.direction === 'number' ? (boss.direction < 0 ? 'left' : 'right') : 'left';
          const bulletX = fireDirection === 'right' ? boss.x + boss.width : boss.x;
          enemyBulletsRef.current.push(
            new BossFireball(bulletX, bulletY, fireDirection, levelConfigRef.current.bulletSpeed ?? 260)
          );
        }

        if (boss.wantsToSpawnFrog) {
          boss.wantsToSpawnFrog = false;
          const aliveBabyCount = frogsRef.current.filter((f) => f.alive).length;
          if (aliveBabyCount < MAX_BOSSFROG_BABIES) {
            frogsRef.current.push(
              new Frog(FROG_GROUND_Y, { ...levelConfigRef.current, frogHealth: 1 }, {
                startX: boss.x + boss.width / 2,
                minX: BOSSFROG_ARENA_MIN_X,
                maxX: 800 - FROG_WIDTH, // babies get their OWN full-width bound, independent of the boss's already-width-adjusted range
              })
            );
          }
        }

        if (boss.wantsToSpawn) {
          boss.wantsToSpawn = false;
          const aliveShieldCount = enemiesRef.current.filter((e) => e.alive).length;
          const eagleAlive = eaglesRef.current.some((e) => e.alive);

          if (aliveShieldCount < MAX_BOSS_SHIELD_ENEMIES) {
            const spawnX = SHIELD_PATROL_MIN_X + aliveShieldCount * 70;
            enemiesRef.current.push(
              new Enemy(spawnX, ENEMY_GROUND_Y, {
                health: levelConfigRef.current.health,
                moveSpeed: levelConfigRef.current.moveSpeed,
                bulletSpeed: levelConfigRef.current.bulletSpeed,
                actionIntervalMin: levelConfigRef.current.actionIntervalMin,
                actionIntervalMax: levelConfigRef.current.actionIntervalMax,
                reactionDelayMin: levelConfigRef.current.reactionDelayMin,
                reactionDelayMax: levelConfigRef.current.reactionDelayMax,
                fireSequence: levelConfigRef.current.fireSequence,
                burstGap: levelConfigRef.current.burstGap,
                patrolMinX: SHIELD_PATROL_MIN_X,
                patrolMaxX: SHIELD_PATROL_MAX_X,
              })
            );
          } else if (!eagleAlive) {
            // Gunmen slots are full — summon the 1-HP shield eagle instead.
            eaglesRef.current.push(
              new Eagle(
                EAGLE_HEIGHT_Y + (Math.random() - 0.5) * 24,
                { ...levelConfigRef.current, eagleHealth: levelConfigRef.current.eagleHealth ?? 1 },
                {
                  startX: 550,
                  minX: EAGLE_ARENA_MIN_X,
                  maxX: EAGLE_ARENA_MAX_X - EAGLE_WIDTH,
                  speedMultiplier: 0.8 + Math.random() * 0.4,
                }
              )
            );
          }
        }
      }

      // TimeDistorter: reversal trigger + independent time-gunman spawn
      // clock. Control inversion (invertActive) is read directly from
      // input-handling code further down (handleKeyDown / the
      // handleInput() call below) — nothing to do with it here.
      if (bossRef.current instanceof TimeDistorter && bossRef.current.alive) {
        const distorter = bossRef.current;

        if (distorter.wantsReversal) {
          distorter.wantsReversal = false;
          player.beginReversal();
        }

        if (distorter.wantsToFire) {
          distorter.wantsToFire = false;
          const fireDirection = player.x < distorter.x ? 'left' : 'right';
          const muzzleOffset = 18;
          const bulletX = fireDirection === 'right'
            ? distorter.x + distorter.width + muzzleOffset
            : distorter.x - muzzleOffset - 10;
          const bulletY = GUNMEN_FIRE_HEIGHT_Y;

          if (distorter.projectileMode === 'fireball') {
            distorter.projectileMode = 'yeti';
            enemyBulletsRef.current.push(
              new BossFireball(bulletX, bulletY, fireDirection, 260)
            );
          } else {
            distorter.projectileMode = 'fireball';
            yetiProjectilesRef.current.push(
              new YetiProjectile(bulletX, bulletY, fireDirection, 260)
            );
          }
        }

        if (distorter.wantsToSpawnGunman) {
          distorter.wantsToSpawnGunman = false;
          const aliveGunmanCount = timeGunmenRef.current.filter((g) => g.alive).length;
          if (aliveGunmanCount < MAX_TIME_GUNMEN) {
            const minSpawnX = 520;
            const maxSpawnX = BOSS_X - 30;
            const spawnX = minSpawnX + Math.random() * (maxSpawnX - minSpawnX);
            timeGunmenRef.current.push(
              // Only override health/patrol range — World 5's level configs
              // don't define moveSpeed/fireSequence/etc at all, and passing
              // those through as `undefined` would silently blank out
              // Enemy.js's own DEFAULTS (spreading a key that's present but
              // undefined still wins over the default), which is why these
              // never fired. Let Enemy's built-ins handle the rest.
              new Enemy(spawnX, ENEMY_GROUND_Y, {
                health: 3,
                bulletSpeed: 260,
                patrolMinX: 520,
                patrolMaxX: BOSS_X - 30,
                actionIntervalMin: 3.0,
                actionIntervalMax: 3.0,
                reactionDelayMin: 0.0,
                reactionDelayMax: 0.0,
                fireSequence: [1],
                burstGap: 0.0,
              })
            );
          }
        }
      }

      // Time gunmen: they use the same regular EnemyBullet pattern as the
      // normal world 1/2 gunmen; the TimeDistorter itself alternates between
      // its special fireball and YetiProjectile attacks.
      for (const gunman of timeGunmenRef.current) {
        if (!gunman.alive) continue;
        gunman.update(dt, player.x);

        if (gunman.wantsToFire) {
          gunman.wantsToFire = false;
          const bulletX = gunman.facing === 'right' ? gunman.x + gunman.width : gunman.x;
          enemyBulletsRef.current.push(
            new EnemyBullet(bulletX, GUNMEN_FIRE_HEIGHT_Y, gunman.facing, gunman.bulletSpeed)
          );
        }
      }
      for (const bullet of bulletsRef.current) {
        if (bullet.hit) continue;
        if (obstacleRef.current && isColliding(bullet.getBounds(), obstacleRef.current.getBounds())) {
          bullet.hit = true; // player bullets can't pass through the wall
          continue;
        }
        if (cactusRef.current && isColliding(bullet.getBounds(), cactusRef.current.getBounds())) {
          bullet.hit = true; // solid like the wall — blocks bullets too
          continue;
        }
        if (icebergRef.current && isColliding(bullet.getBounds(), icebergRef.current.getBounds())) {
          bullet.hit = true; // solid — blocks player bullets too
          continue;
        }
        let hitEagle = false;
        for (const eagle of eagles) {
          if (!eagle.alive) continue;
          if (isColliding(bullet.getBounds(), eagle.getBounds())) {
            eagle.takeHit();
            if (!eagle.alive) {
              awardCoinReward();
            }
            bullet.hit = true;
            hitEagle = true;
            break;
          }
        }
        if (hitEagle) continue;
        let hitYeti = false;
        let hitShipOrBee = false;
        for (const glacier of [leftGlacierRef.current, rightGlacierRef.current]) {
          if (!glacier || !glacier.alive) continue;
          if (isColliding(bullet.getBounds(), glacier.getBounds())) {
            glacier.takeHit();
            if (!glacier.alive) {
              awardCoinReward();
            }
            glacierStallTimerRef.current = 0; // successful hit on EITHER glacier resets the stall clock
            bullet.hit = true;
            hitShipOrBee = true;
            break;
          }
        }
        if (hitShipOrBee) continue;
        for (const ship of spaceships) {
          if (!ship.alive) continue;
          if (isColliding(bullet.getBounds(), ship.getBounds())) {
            ship.takeHit();
            if (!ship.alive) {
              awardCoinReward();
            }
            bullet.hit = true;
            hitShipOrBee = true;
            break;
          }
        }
        if (hitShipOrBee) continue;
        for (const bee of iceBees) {
          if (!bee.alive) continue;
          if (isColliding(bullet.getBounds(), bee.getBounds())) {
            bee.takeHit();
            if (!bee.alive) {
              awardCoinReward();
            }
            bullet.hit = true;
            hitShipOrBee = true;
            break;
          }
        }
        if (hitShipOrBee) continue;
        for (const yeti of yetis) {
          if (!yeti.alive) continue;
          if (isColliding(bullet.getBounds(), yeti.getBounds())) {
            yeti.takeHit();
            if (!yeti.alive) {
              awardCoinReward();
            }
            bullet.hit = true;
            hitYeti = true;
            break;
          }
        }
        if (hitYeti) continue;
        let hitFrog = false;
        for (const frog of frogs) {
          if (!frog.alive) continue;
          if (isColliding(bullet.getBounds(), frog.getBounds())) {
            frog.takeHit();
            if (!frog.alive) {
              awardCoinReward();
            }
            bullet.hit = true;
            hitFrog = true;
            break;
          }
        }
        if (hitFrog) continue;
        let hitVortex = false;
        for (const vortex of vortices) {
          if (!vortex.alive) continue;
          if (isColliding(bullet.getBounds(), vortex.getBounds())) {
            vortex.takeHit();
            if (!vortex.alive) {
              awardCoinReward();
            }
            bullet.hit = true;
            hitVortex = true;
            player.escapeQuicksand(); // no-op if the player wasn't stuck
            break;
          }
        }
        if (hitVortex) continue;
        let hitDarkMatter = false;
        for (const being of darkMatters) {
          if (!being.alive) continue;
          if (isColliding(bullet.getBounds(), being.getBounds())) {
            being.takeHit();
            if (!being.alive) {
              awardCoinReward();
            }
            bullet.hit = true;
            hitDarkMatter = true;
            player.escapeQuicksand(); // no-op if the player wasn't stuck
            break;
          }
        }
        if (hitDarkMatter) continue;
        let hitReg = false;
        for (const reg of regs) {
          if (!reg.alive) continue;
          if (isColliding(bullet.getBounds(), reg.getBounds())) {
            reg.takeHit();
            if (!reg.alive) {
              awardCoinReward();
            }
            bullet.hit = true;
            hitReg = true;
            player.escapeQuicksand();
            break;
          }
        }
        if (hitReg) continue;
        let hitShapeshifter = false;
        for (const ss of shapeshifters) {
          if (!ss.alive) continue;
          if (isColliding(bullet.getBounds(), ss.getBounds())) {
            bullet.hit = true;
            hitShapeshifter = true;
            if (ss.phase === 'disguise') {
              // Backfire — the "enemy" is really wearing the player's
              // face right now, so a hit redirects onto the player.
              player.takeHit();
            } else {
              ss.takeHit();
              if (!ss.alive) {
                awardCoinReward();
              }
            }
            break;
          }
        }
        if (hitShapeshifter) continue;
        if (bossRef.current && bossRef.current.alive && isColliding(bullet.getBounds(), bossRef.current.getBounds())) {
          bossRef.current.takeHit();
          if (!bossRef.current.alive) {
            awardCoinReward();
          }
          player.escapeQuicksand(); // no-op if the player wasn't stuck
          bullet.hit = true;
          continue;
        }
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (isColliding(bullet.getBounds(), enemy.getBounds())) {
            const wasAlive = enemy.alive;
            enemy.takeHit();
            if (wasAlive && !enemy.alive) {
              awardCoinReward();
            }
            bullet.hit = true;
            playSound(wasAlive && !enemy.alive ? 'explosion' : 'hit', 0.6);
            break;
          }
        }
        if (bullet.hit) continue;
        for (const gunman of timeGunmenRef.current) {
          if (!gunman.alive) continue;
          if (isColliding(bullet.getBounds(), gunman.getBounds())) {
            const wasAlive = gunman.alive;
            gunman.takeHit();
            if (wasAlive && !gunman.alive) {
              awardCoinReward();
            }
            bullet.hit = true;
            playSound(wasAlive && !gunman.alive ? 'explosion' : 'hit', 0.6);
            break;
          }
        }
      }
      bulletsRef.current = bulletsRef.current.filter((b) => !b.hit);

      const allEnemiesDead = bossRef.current
        ? !bossRef.current.alive
        : enemies.every((e) => !e.alive) && eagles.every((e) => !e.alive) && yetis.every((y) => !y.alive) && frogs.every((f) => !f.alive) && vortices.every((v) => !v.alive) && darkMattersRef.current.every((b) => !b.alive) && regsRef.current.every((r) => !r.alive) && shapeshiftersRef.current.every((s) => !s.alive) && spaceshipsRef.current.every((s) => !s.alive) && (levelConfigRef.current.hasTwinGlaciers || iceBeesRef.current.every((b) => !b.alive)) && (!leftGlacierRef.current || !leftGlacierRef.current.alive) && (!rightGlacierRef.current || !rightGlacierRef.current.alive);
      if (allEnemiesDead && gameStateRef.current === 'playing') {
        const isFinalLevel = levelIndexRef.current === LEVELS.length - 1;
        const finalHp = Math.max(player.health, 0);
        const summary = finalizeRunSummary(finalHp);
        if (onLevelComplete) {
          // Preserve the summary for the button action after the outro overlay.
          setRunSummary(summary);
        }
        outroTargetRef.current = isFinalLevel ? 'gameComplete' : 'levelComplete';
        player.triggerVictory();
        gameStateRef.current = 'celebrating';
        setGameState('celebrating');
        playSound('victory', 0.7);
      }

      if (player.health <= 0 && gameStateRef.current === 'playing') {
        const summary = finalizeRunSummary(0);
        setRunSummary(summary);
        player.triggerDeath();
        gameStateRef.current = 'dying';
        setGameState('dying');
        playSound('gameover', 0.7);
      }

      setHealth(Math.max(player.health, 0));
    }

    function draw() {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      backgroundRef.current.draw(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawTimeDistorterOverlay(ctx, bossRef.current);

      if (obstacleRef.current) {
        obstacleRef.current.draw(ctx, obstacleImage);
      }
      if (quicksandRef.current) {
        quicksandRef.current.draw(ctx, quicksandImage, smokeSheet);
      }
      // Boss-level smoke: draw all 3 middle-zone smoke tiles (same QuicksandPatch
      // draw logic as normal levels, tiled 3× across the wider middle zone).
      if (bossSmokeRef.current) {
        for (const patch of bossSmokeRef.current) {
          patch.draw(ctx, null, smokeSheet);
        }
      }
      if (cactusRef.current) {
        cactusRef.current.draw(ctx, cactusImage);
      }
      if (icebergRef.current) {
        icebergRef.current.draw(ctx, icebergImage);
      }
      if (sittingDuckRef.current) {
        sittingDuckRef.current.draw(ctx, sittingDuckImage);
      }

      ctx.strokeStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(0, 400);
      ctx.lineTo(800, 400);
      ctx.stroke();

      playerRef.current.draw(ctx, playerSheet, playerExtraSheet, freezeCrystalSheet, ghostSheet, duckSheet);
      enemiesRef.current.forEach((e) => e.draw(ctx, enemySheet));
      timeGunmenRef.current.forEach((g) => g.draw(ctx, enemySheet)); // no dedicated art yet — reuses whichever enemy sheet this world has (placeholder rectangle if none)
      enemyBulletsRef.current.forEach((o) => o.draw(ctx));
      bulletsRef.current.forEach((b) => b.draw(ctx));
      eaglesRef.current.forEach((eagle) => eagle.draw(ctx, eagleSheet));
      vorticesRef.current.forEach((vortex) => vortex.draw(ctx, vortexSheet));
      darkMattersRef.current.forEach((being) => being.draw(ctx, darkMatterSheet));
      regsRef.current.forEach((reg) => reg.draw(ctx, {
        yeti: yetiSheet,
        darkMatter: darkMatterSheet,
        frog: frogSheet,
        enemy: enemySheet ?? martianCatSheet,
        vortex: vortexSheet,
      }, regGlitchSheet));
      shapeshiftersRef.current.forEach((ss) => ss.draw(ctx, shapeshifterSheet, playerSheet, playerExtraSheet));
      eagleProjectilesRef.current.forEach((p) => p.draw(ctx));
      yetisRef.current.forEach((yeti) => yeti.draw(ctx, yetiSheet));
      yetiProjectilesRef.current.forEach((p) => p.draw(ctx));
      if (leftGlacierRef.current) leftGlacierRef.current.draw(ctx, glacierSheet);
      if (rightGlacierRef.current) rightGlacierRef.current.draw(ctx, glacierSheet);
      spaceshipsRef.current.forEach((ship) => ship.draw(ctx, shipSheet));
      iceBeesRef.current.forEach((bee) => bee.draw(ctx, iceBeeSheet));
      iceBeeProjectilesRef.current.forEach((p) => p.draw(ctx));
      shipProjectilesRef.current.forEach((p) => p.draw(ctx));
      frogsRef.current.forEach((frog) => frog.draw(ctx, frogSheet));
      if (bossRef.current) bossRef.current.draw(ctx, bossSheet);
      if (bossRef.current instanceof BlackHoleBoss && bossRef.current.alive && bossRef.current.currentZone === 'left') {
        const ZONE_WIDTH = 800 / 3;
        const rayWidth = 120; // was 70 — fatter/wider, still fits inside the left third's own bounds
        const RAY_GAP_BELOW_BOSS = 15; // clears the boss's own sprite instead of starting inside it
        const RAY_GAP_ABOVE_GROUND = 60; // stops well short of the player's ground line
        const rayY = bossRef.current.y + bossRef.current.height + RAY_GAP_BELOW_BOSS;
        const rayHeight = 400 - RAY_GAP_ABOVE_GROUND - rayY;
        const rayX = ZONE_WIDTH / 2 - rayWidth / 2;
        rayEffectRef.current.draw(ctx, pullPushRaysSheet, rayX, rayY, rayWidth, rayHeight, 0.12);
      }
      if (bossRef.current instanceof BlackHoleBoss && bossRef.current.alive && bossRef.current.currentZone === 'right') {
        const ZONE_WIDTH = 800 / 3;
        const rayWidth = 120;
        const RAY_GAP_BELOW_BOSS = 15;
        const RAY_GAP_ABOVE_GROUND = 120; // was 195 — overcorrected, collapsed the ray height into a short floating segment near the boss with a big gap to the being below; was 60 originally (too low, overlapped the being's head)
        const rayY = bossRef.current.y + bossRef.current.height + RAY_GAP_BELOW_BOSS;
        const rayHeight = 400 - RAY_GAP_ABOVE_GROUND - rayY;
        const rayX = ZONE_WIDTH * 2 + ZONE_WIDTH / 2 - rayWidth / 2;
        rayEffectGreenRef.current.draw(ctx, pullPushRaysGreenSheet, rayX, rayY, rayWidth, rayHeight, 0.12);
      }

      // --- HUD: player HP top-left ---
      const playerCircleX = 40;
      const circleY = 40;
      const circleRadius = 24;
      drawHudPortrait(ctx, playerSheet, playerCircleX, circleY, circleRadius, '#3ad1ff', 'P');
      drawHpBar(
        ctx,
        playerCircleX + circleRadius + 12,
        circleY - 8,
        150,
        16,
        playerRef.current.health / PLAYER_MAX_HEALTH,
        'PLAYER HP',
        'left'
      );

      // --- HUD: enemy HP top-right, above the enemy patrol area ---
      // One independent bar per enemy (not summed/shared) — stacked
      // vertically when a level has more than one gunman, so defeating
      // one enemy visibly empties ITS bar rather than partially draining
      // a combined total.
      const enemyCircleX = CANVAS_WIDTH - 40;
      const enemies = enemiesRef.current;
      const ENEMY_ROW_HEIGHT = 56;
      const barWidth = 150;
      const barX = enemyCircleX - circleRadius - 12 - barWidth;

      if (!bossRef.current) {
        enemies.forEach((enemy, i) => {
          if (!enemy.maxHealth) return;
          const rowCircleY = 34 + i * ENEMY_ROW_HEIGHT;
          const label = enemies.length > 1 ? `ENEMY ${i + 1} HP` : 'ENEMY HP';
          const pct = Math.max(enemy.health, 0) / enemy.maxHealth;
          drawHpBar(ctx, barX, rowCircleY - 8, barWidth, 16, pct, label, 'right');
          drawHudPortrait(ctx, enemySheet, enemyCircleX, rowCircleY, circleRadius, '#a83232', 'E');
        });
      }

      // Eagles get their own stacked rows below the ground enemies, same
      // pattern — independent bars, not merged/summed into one.
      if (!bossRef.current) {
        eaglesRef.current.forEach((eagle, i) => {
          if (!eagle.maxHealth) return;
          const eagleRowY = 34 + (enemies.length + i) * ENEMY_ROW_HEIGHT;
          const label = eaglesRef.current.length > 1 ? `EAGLE ${i + 1} HP` : 'EAGLE HP';
          const pct = Math.max(eagle.health, 0) / eagle.maxHealth;
          drawHpBar(ctx, barX, eagleRowY - 8, barWidth, 16, pct, label, 'right');
          drawHudPortrait(ctx, eagleSheet, enemyCircleX, eagleRowY, circleRadius, '#2a2a35', 'B', {
            cropRatio: 0.30,
            cropTopRatio: 0.139,
            cropLeftRatio: 0.294,
          });
        });
      }

      // Yetis get their own stacked rows below eagles, same pattern.
      if (!bossRef.current) {
        yetisRef.current.forEach((yeti, i) => {
          if (!yeti.maxHealth) return;
          const yetiRowY = 34 + (enemies.length + eaglesRef.current.length + i) * ENEMY_ROW_HEIGHT;
          const label = yetisRef.current.length > 1 ? `YETI ${i + 1} HP` : 'YETI HP';
          const pct = Math.max(yeti.health, 0) / yeti.maxHealth;
          drawHpBar(ctx, barX, yetiRowY - 8, barWidth, 16, pct, label, 'right');
          drawHudPortrait(ctx, yetiSheet, enemyCircleX, yetiRowY, circleRadius, '#4a90a4', 'Y');
        });

        const preShipRows = enemies.length + eaglesRef.current.length + yetisRef.current.length;
        spaceshipsRef.current.forEach((ship, i) => {
          if (!ship.maxHealth) return;
          const shipRowY = 34 + (preShipRows + i) * ENEMY_ROW_HEIGHT;
          const pct = Math.max(ship.health, 0) / ship.maxHealth;
          drawHpBar(ctx, barX, shipRowY - 8, barWidth, 16, pct, 'SHIP HP', 'right');
          drawHudPortrait(ctx, shipSheet, enemyCircleX, shipRowY, circleRadius, '#2a3a4a', 'S');
        });

        const preGlacierRows = preShipRows + spaceshipsRef.current.length;
        [leftGlacierRef.current, rightGlacierRef.current].forEach((glacier, i) => {
          if (!glacier || !glacier.maxHealth) return;
          const rowY = 34 + (preGlacierRows + i) * ENEMY_ROW_HEIGHT;
          const label = glacier.side === 'left' ? 'LEFT GLACIER HP' : 'RIGHT GLACIER HP';
          const pct = Math.max(glacier.health, 0) / glacier.maxHealth;
          drawHpBar(ctx, barX, rowY - 8, barWidth, 16, pct, label, 'right');
          drawHudPortrait(ctx, glacierSheet, enemyCircleX, rowY, circleRadius, '#7fb8d4', 'G');
        });

        // Bees deliberately have no HUD bar — they're simple 2-hit fodder,
        // only the ship's own bar is shown.
      }

      // Frogs get their own stacked rows too, below eagles, same pattern.
      if (!bossRef.current) {
        frogsRef.current.forEach((frog, i) => {
          if (!frog.maxHealth) return;
          const frogRowY = 34 + (enemies.length + eaglesRef.current.length + yetisRef.current.length + i) * ENEMY_ROW_HEIGHT;
          const label = frogsRef.current.length > 1 ? `FROG ${i + 1} HP` : 'FROG HP';
          const pct = Math.max(frog.health, 0) / frog.maxHealth;
          drawHpBar(ctx, barX, frogRowY - 8, barWidth, 16, pct, label, 'right');
          drawHudPortrait(ctx, frogSheet, enemyCircleX, frogRowY, circleRadius, '#5a2a12', 'F');
        });

        vorticesRef.current.forEach((vortex, i) => {
          if (!vortex.maxHealth) return;
          const vortexRowY = 34 + (enemies.length + eaglesRef.current.length + yetisRef.current.length + frogsRef.current.length + i) * ENEMY_ROW_HEIGHT;
          const label = vorticesRef.current.length > 1 ? `VORTEX ${i + 1} HP` : 'VORTEX HP';
          const pct = Math.max(vortex.health, 0) / vortex.maxHealth;
          drawHpBar(ctx, barX, vortexRowY - 8, barWidth, 16, pct, label, 'right');
          drawHudPortrait(ctx, null, enemyCircleX, vortexRowY, circleRadius, '#6a3aa0', 'V');
        });

        const preDarkMatterRows = enemies.length + eaglesRef.current.length + yetisRef.current.length + frogsRef.current.length + vorticesRef.current.length;
        darkMattersRef.current.forEach((being, i) => {
          if (!being.maxHealth) return;
          const rowY = 34 + (preDarkMatterRows + i) * ENEMY_ROW_HEIGHT;
          const label = darkMattersRef.current.length > 1 ? `DARK MATTER ${i + 1} HP` : 'DARK MATTER HP';
          const pct = Math.max(being.health, 0) / being.maxHealth;
          drawHpBar(ctx, barX, rowY - 8, barWidth, 16, pct, label, 'right');
          drawHudPortrait(ctx, null, enemyCircleX, rowY, circleRadius, '#7a3aff', 'D');
        });

        // Shapeshifter's bar stays visible in BOTH phases (normal and
        // disguise) — its health doesn't reset or hide when it swaps
        // appearance, so the bar shouldn't either.
        const preShapeshifterRows = preDarkMatterRows + darkMattersRef.current.length;
        shapeshiftersRef.current.forEach((shifter, i) => {
          if (!shifter.maxHealth) return;
          const rowY = 34 + (preShapeshifterRows + i) * ENEMY_ROW_HEIGHT;
          const label = shapeshiftersRef.current.length > 1 ? `SHAPESHIFTER ${i + 1} HP` : 'SHAPESHIFTER HP';
          const pct = Math.max(shifter.health, 0) / shifter.maxHealth;
          drawHpBar(ctx, barX, rowY - 8, barWidth, 16, pct, label, 'right');
          drawHudPortrait(ctx, null, enemyCircleX, rowY, circleRadius, '#6a4a4a', 'S');
        });

        const preRegRows = preShapeshifterRows + shapeshiftersRef.current.length;
        regsRef.current.forEach((reg, i) => {
          if (!reg.maxHealth) return;
          const rowY = 34 + (preRegRows + i) * ENEMY_ROW_HEIGHT;
          const label = regsRef.current.length > 1 ? `REG ${i + 1} HP` : 'REG HP';
          const pct = Math.max(reg.health, 0) / reg.maxHealth;
          drawHpBar(ctx, barX, rowY - 8, barWidth, 16, pct, label, 'right');
          drawHudPortrait(ctx, enemySheet ?? martianCatSheet, enemyCircleX, rowY, circleRadius, '#8b5cf6', 'R');
        });
      }

      // Boss level: only its own bar shows, at the top row — no gunman/eagle
      // rows to clutter it, even though shield gunmen exist under the hood.
      if (bossRef.current && bossRef.current.maxHealth) {
        const bossRowY = 34;
        const pct = Math.max(bossRef.current.health, 0) / bossRef.current.maxHealth;
        drawHpBar(ctx, barX, bossRowY - 8, barWidth, 16, pct, 'BOSS HP', 'right');
        drawHudPortrait(ctx, bossSheet, enemyCircleX, bossRowY, circleRadius, '#3a0a0a', 'X');
      }

      drawTopCenterHud(ctx, levelIndexRef.current + 1);

      const renderSummaryScreen = (title, subtitle) => {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 26px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(title, 400, 120);

        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(subtitle, 400, 170);
        ctx.fillText('STARS SECURED', 400, 210);
        ctx.fillText(`${runSummary.stars} / 3`, 400, 235);
        ctx.fillText('COINS GOT', 400, 270);
        ctx.fillText(`${runSummary.coins}`, 400, 295);
      };

      if (gameStateRef.current === 'gameover') {
        renderSummaryScreen('RUN FAILED', 'MISSION ENDED');
        ctx.fillStyle = '#d2ff66';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('R = RETRY', 400, 340);
      }

      if (gameStateRef.current === 'levelComplete') {
        renderSummaryScreen(`LEVEL ${levelIndexRef.current + 1} CLEAR`, 'RESULT');
      }

      if (gameStateRef.current === 'gameComplete') {
        renderSummaryScreen('ALL 10 LEVELS CLEARED', 'FINAL RUN');
      }
    }

    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      backgroundRef.current.update(dt); // drifts even over menu/overlay screens
      update(dt);
      draw();

      animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleResultAction = (action) => {
    if (action === 'retry') {
      restartCurrentLevel();
      return;
    }

    if (action === 'proceed') {
      onLevelComplete && onLevelComplete(levelIndexRef.current, runSummary);
    }
  };

  const showActionButtons = gameState === 'levelComplete' || gameState === 'gameComplete';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/*
        Internal drawing buffer stays 800x400 (CANVAS_WIDTH/HEIGHT) — every
        entity's physics, spawn position, and patrol zone math is built on
        that coordinate space. CSS width/height + object-fit: contain just
        scale that buffer up to fill the browser viewport while preserving
        the 2:1 aspect ratio, letterboxing with black bars if the window's
        aspect ratio doesn't match exactly. No entity code needs to change.
        All HUD text (level, controls, HP bars) is drawn ON the canvas
        itself in draw() — no DOM overlay — so it never drifts out of sync
        with gameplay elements like bullets near the ground.
      */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'contain',
          background: 'transparent',
        }}
      />

      {showActionButtons && (
        <div className="result-overlay">
          <button
            type="button"
            className="result-button result-button--retry"
            onClick={() => handleResultAction('retry')}
          >
            RETRY
          </button>
          <button
            type="button"
            className="result-button result-button--proceed"
            onClick={() => handleResultAction('proceed')}
          >
            PROCEED
          </button>
        </div>
      )}
    </div>
  );
}