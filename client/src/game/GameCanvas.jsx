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
import { Boss } from './entities/Boss';
import { playSound } from './sound';
import { BossFireball } from './entities/BossFireball';
import { Frog } from './entities/Frog';
import { BossFrog } from './entities/BossFrog';
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

// Full-width patrol span frogs are allowed to hop within.
const FROG_GROUND_Y = 340; // same baseline as gunmen — feet land on the same ground line
const FROG_ARENA_MIN_X = 0;
const FROG_ARENA_MAX_X = 800; // matches player's full reachable range — no dead corner
const FROG_WIDTH = 44;

// Boss sits fixed near the right edge; the shield gunmen it spawns patrol
// a lane in front of it so they never overlap the boss's own hitbox.
const BOSS_X = 640;
const BOSS_Y = 200; // feet at y=400, same ground line as everything else
const MAX_BOSS_SHIELD_ENEMIES = 2;
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
export default function GameCanvas({ worldIndex = 0, initialLevelIndex = 0, onLevelComplete, onExitToMenu }) {
  const world = WORLDS[worldIndex] ?? WORLDS[0];
  const LEVELS = world.levels; // every existing LEVELS[...] reference below now resolves per-world, unchanged

  const playerSheet = getSheet(world.sprites.player);
  const playerExtraSheet = getSheet(world.sprites.playerExtra);
  const enemySheet = getSheet(world.sprites.enemy);
  const eagleSheet = getSheet(world.sprites.eagle);
  const yetiSheet = getSheet(world.sprites.yeti);
  const bossSheet = getSheet(world.sprites.boss);
  const moonBgSheet = getSheet(world.sprites.background);
  const obstacleImage = getImage(world.sprites.obstacle);
  const cactusImage = getImage(world.sprites.cactus);
  const frogSheet = getSheet(world.sprites.frog);

  const canvasRef = useRef(null);
    const [health, setHealth] = useState(10);
  const [levelNumber, setLevelNumber] = useState(LEVELS[initialLevelIndex].level);
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
      const eaglesRef = useRef(buildEaglesForLevel(LEVELS[initialLevelIndex]));
      const yetisRef = useRef(buildYetisForLevel(LEVELS[initialLevelIndex]));
      const yetiProjectilesRef = useRef([]);
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
      : null
  );
  const levelConfigRef = useRef(LEVELS[initialLevelIndex]);
  const keysRef = useRef({});
  const gameStateRef = useRef('playing');
    const levelIndexRef = useRef(initialLevelIndex); // 0-based index into LEVELS
  const outroTargetRef = useRef(null); // 'levelComplete' | 'gameComplete' — which screen to show once the victory animation finishes

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

        enemiesRef.current = buildEnemiesForLevel(config);
    enemyBulletsRef.current = [];
    bulletsRef.current = [];
        obstacleRef.current = config.hasObstacle ? new Obstacle(380, 300) : null;
        cactusRef.current = config.hasCactus ? new Cactus(380, 310) : null;
        eaglesRef.current = buildEaglesForLevel(config);
        yetisRef.current = buildYetisForLevel(config);
        yetiProjectilesRef.current = [];
    eagleProjectilesRef.current = [];
    frogsRef.current = buildFrogsForLevel(config);
        bossRef.current = config.hasBoss
      ? new Boss(BOSS_X, BOSS_Y, config)
      : config.hasBossFrog
      ? new BossFrog(FROG_GROUND_Y, { ...config, arenaMinX: BOSSFROG_ARENA_MIN_X, arenaMaxX: BOSSFROG_HOP_MAX_X })
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
            bulletsRef.current.push(new Bullet(bulletX, bulletY, direction));
      player.triggerShoot();
      playSound('shoot', 0.5);
    }

    const JUMP_KEYS = ['ArrowUp', ' ', 'w', 'W'];

    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;

            if (gameStateRef.current === 'gameover' && (e.key === 'r' || e.key === 'R')) {
        restartCurrentLevel();
      }

      if (
        gameStateRef.current === 'levelComplete' &&
        (e.key === 'n' || e.key === 'N' || e.key === ' ')
      ) {
        onLevelComplete && onLevelComplete(levelIndexRef.current);
      }

      if (gameStateRef.current === 'gameComplete' && (e.key === 'r' || e.key === 'R')) {
        onLevelComplete && onLevelComplete(levelIndexRef.current);
      }

      if (e.key === 'Escape' && gameStateRef.current === 'playing') {
        onExitToMenu && onExitToMenu();
      }

      if ((e.key === 'f' || e.key === 'F') && gameStateRef.current === 'playing') {
        shoot();
      }

      if (JUMP_KEYS.includes(e.key) && !e.repeat && gameStateRef.current === 'playing') {
        playerRef.current.jump();
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

            player.handleInput(keysRef.current);
      player.setSitting(!!keysRef.current['ArrowDown']);

      const prevPlayerX = player.x;
      player.update(dt);

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
        player.takeHit();
        playSound('hit', 0.6);
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
        boss.update(dt);

        // Contact damage, same as a frog — player.takeHit() already has
        // its own invulnerability window, so standing against it doesn't
        // drain HP every frame.
        if (isColliding(playerBounds, boss.getBounds())) {
          player.takeHit();
          playSound('hit', 0.6);
        }

                if (boss.wantsToFire) {
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
                let hitEagle = false;
        for (const eagle of eagles) {
          if (!eagle.alive) continue;
          if (isColliding(bullet.getBounds(), eagle.getBounds())) {
            eagle.takeHit();
            bullet.hit = true;
            hitEagle = true;
            break;
          }
        }
                if (hitEagle) continue;
        let hitYeti = false;
        for (const yeti of yetis) {
          if (!yeti.alive) continue;
          if (isColliding(bullet.getBounds(), yeti.getBounds())) {
            yeti.takeHit();
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
            bullet.hit = true;
            hitFrog = true;
            break;
          }
        }
        if (hitFrog) continue;
        if (bossRef.current && bossRef.current.alive && isColliding(bullet.getBounds(), bossRef.current.getBounds())) {
          bossRef.current.takeHit();
          bullet.hit = true;
          continue;
        }
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (isColliding(bullet.getBounds(), enemy.getBounds())) {
            const wasAlive = enemy.alive;
            enemy.takeHit();
            bullet.hit = true;
            playSound(wasAlive && !enemy.alive ? 'explosion' : 'hit', 0.6);
            break;
          }
        }
      }
      bulletsRef.current = bulletsRef.current.filter((b) => !b.hit);

          const allEnemiesDead = bossRef.current
  ? !bossRef.current.alive
  : enemies.every((e) => !e.alive) && eagles.every((e) => !e.alive) && yetis.every((y) => !y.alive) && frogs.every((f) => !f.alive);
      if (allEnemiesDead && gameStateRef.current === 'playing') {
        const isFinalLevel = levelIndexRef.current === LEVELS.length - 1;
        outroTargetRef.current = isFinalLevel ? 'gameComplete' : 'levelComplete';
        player.triggerVictory();
        gameStateRef.current = 'celebrating';
        setGameState('celebrating');
        playSound('victory', 0.7);
      }

      if (player.health <= 0 && gameStateRef.current === 'playing') {
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

      if (obstacleRef.current) {
        obstacleRef.current.draw(ctx, obstacleImage);
      }
      if (cactusRef.current) {
        cactusRef.current.draw(ctx, cactusImage);
      }

      ctx.strokeStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(0, 400);
      ctx.lineTo(800, 400);
      ctx.stroke();

            playerRef.current.draw(ctx, playerSheet, playerExtraSheet);
      enemiesRef.current.forEach((e) => e.draw(ctx, enemySheet));
      enemyBulletsRef.current.forEach((o) => o.draw(ctx));
      bulletsRef.current.forEach((b) => b.draw(ctx));
                        eaglesRef.current.forEach((eagle) => eagle.draw(ctx, eagleSheet));
      eagleProjectilesRef.current.forEach((p) => p.draw(ctx));
      yetisRef.current.forEach((yeti) => yeti.draw(ctx, yetiSheet));
      yetiProjectilesRef.current.forEach((p) => p.draw(ctx));
      frogsRef.current.forEach((frog) => frog.draw(ctx, frogSheet));
      if (bossRef.current) bossRef.current.draw(ctx, bossSheet);

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

            if (gameStateRef.current === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = '32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 400, 180);

        ctx.font = '18px monospace';
        ctx.fillText('Press R to retry this level', 400, 220);
      }

      if (gameStateRef.current === 'levelComplete') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#3aff6a';
        ctx.font = '32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${levelIndexRef.current + 1} CLEAR`, 400, 180);

        ctx.fillStyle = '#fff';
        ctx.font = '18px monospace';
        ctx.fillText('Press N to return to Level Select', 400, 220);
      }

      if (gameStateRef.current === 'gameComplete') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ffd23a';
        ctx.font = '30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ALL 10 LEVELS CLEARED', 400, 170);

        ctx.fillStyle = '#fff';
        ctx.font = '18px monospace';
        ctx.fillText('Press R to return to Level Select', 400, 210);
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
    </div>
  );
}