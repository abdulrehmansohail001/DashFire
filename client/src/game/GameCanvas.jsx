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
import { Enemy } from './entities/Enemy';
import { Bullet } from './entities/Bullet';
import { EnemyBullet } from './entities/EnemyBullet';
import { SpriteSheet } from './entities/SpriteSheet';
import { LEVELS } from './levels';
import { Background } from './entities/Background';
import { Eagle } from './entities/Eagle';
import { EagleProjectile } from './entities/EagleProjectile';

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

const playerSheet = new SpriteSheet('/sprites/player.png', 313, 313, 4, 4);
const playerExtraSheet = new SpriteSheet('/sprites/player_extra.png', 125, 125, 4, 4);
const enemySheet = new SpriteSheet('/sprites/enemy.png', 313, 313, 4, 4);
const eagleSheet = new SpriteSheet('/sprites/eagle.png', 272, 724, 8, 1);
const moonBgSheet = new SpriteSheet('/sprites/moon_bg.jpg', 366, 352, 8, 1);
const obstacleImage = new Image();
obstacleImage.src = '/sprites/obstacle.png';
// Builds N enemies for a level config, splitting the arena into N
// non-overlapping patrol slots and starting each enemy in the middle of its slot.
function buildEnemiesForLevel(levelConfig) {
  const { enemyCount } = levelConfig;
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

// Draws a circular HUD portrait — sprite sheet's idle frame if loaded,
// otherwise a flat-color circle with a single-letter fallback so the HUD
// never shows a blank gap while art is loading.
function drawHudPortrait(ctx, sheet, centerX, centerY, radius, fallbackColor, fallbackLabel) {
  ctx.save();

  const drew = sheet ? sheet.drawPortrait(ctx, 0, 0, centerX, centerY, radius) : false;

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
export default function GameCanvas({ initialLevelIndex = 0, onLevelComplete, onExitToMenu }) {
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
    const eagleRef = useRef(LEVELS[initialLevelIndex].hasEagle ? new Eagle(EAGLE_HEIGHT_Y, LEVELS[initialLevelIndex]) : null);
  const eagleProjectilesRef = useRef([]);
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
       eagleRef.current = config.hasEagle ? new Eagle(EAGLE_HEIGHT_Y, config) : null;
    eagleProjectilesRef.current = [];

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
        }
      }

      // Eagle: patrol/throw update, then its projectiles' own arc + collision.
      // Shootable — player bullets can hit it below, and it counts toward
      // the win condition alongside the ground gunmen.
      if (eagleRef.current) {
        eagleRef.current.update(dt);
        if (eagleRef.current.wantsToThrow) {
          eagleRef.current.wantsToThrow = false;
          const throwX = eagleRef.current.x + eagleRef.current.width / 2;
          const throwY = eagleRef.current.y + eagleRef.current.height;
          const throwVx = eagleRef.current.randomThrowVx();
          eagleProjectilesRef.current.push(new EagleProjectile(throwX, throwY, throwVx));
        }

        eagleProjectilesRef.current.forEach((p) => p.update(dt));
        eagleProjectilesRef.current = eagleProjectilesRef.current.filter((p) => {
          if (isColliding(playerBounds, p.getBounds())) {
            player.takeHit();
            return false; // consumed on hit
          }
          return !p.hasLanded(400); // 400 = ground line; despawn once it lands, hit or not
        });
      }

            for (const bullet of bulletsRef.current) {
        if (bullet.hit) continue;
        if (obstacleRef.current && isColliding(bullet.getBounds(), obstacleRef.current.getBounds())) {
          bullet.hit = true; // player bullets can't pass through the wall
          continue;
        }
        if (eagleRef.current && eagleRef.current.alive && isColliding(bullet.getBounds(), eagleRef.current.getBounds())) {
          eagleRef.current.takeHit();
          bullet.hit = true;
          continue;
        }
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (isColliding(bullet.getBounds(), enemy.getBounds())) {
            enemy.takeHit();
            bullet.hit = true;
            break;
          }
        }
      }
      bulletsRef.current = bulletsRef.current.filter((b) => !b.hit);

      const allEnemiesDead = enemies.every((e) => !e.alive) && (!eagleRef.current || !eagleRef.current.alive);
      if (allEnemiesDead && gameStateRef.current === 'playing') {
        const isFinalLevel = levelIndexRef.current === LEVELS.length - 1;
        outroTargetRef.current = isFinalLevel ? 'gameComplete' : 'levelComplete';
        player.triggerVictory();
        gameStateRef.current = 'celebrating';
        setGameState('celebrating');
      }

      if (player.health <= 0 && gameStateRef.current === 'playing') {
        player.triggerDeath();
        gameStateRef.current = 'dying';
        setGameState('dying');
      }

      setHealth(Math.max(player.health, 0));
    }

        function draw() {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            backgroundRef.current.draw(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (obstacleRef.current) {
        obstacleRef.current.draw(ctx, obstacleImage);
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
            if (eagleRef.current) {
        eagleRef.current.draw(ctx, eagleSheet);
        eagleProjectilesRef.current.forEach((p) => p.draw(ctx));
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

      enemies.forEach((enemy, i) => {
        if (!enemy.maxHealth) return;
        const rowCircleY = 34 + i * ENEMY_ROW_HEIGHT;
        const label = enemies.length > 1 ? `ENEMY ${i + 1} HP` : 'ENEMY HP';
        const pct = Math.max(enemy.health, 0) / enemy.maxHealth;
        drawHpBar(ctx, barX, rowCircleY - 8, barWidth, 16, pct, label, 'right');
        drawHudPortrait(ctx, enemySheet, enemyCircleX, rowCircleY, circleRadius, '#a83232', 'E');
      });

      // Eagle gets its own stacked row below the ground enemies, same
      // pattern — its own independent bar, not merged into anything.
      if (eagleRef.current && eagleRef.current.alive) {
        const eagleRowY = 34 + enemies.length * ENEMY_ROW_HEIGHT;
        const pct = Math.max(eagleRef.current.health, 0) / eagleRef.current.maxHealth;
        drawHpBar(ctx, barX, eagleRowY - 8, barWidth, 16, pct, 'EAGLE HP', 'right');
                drawHudPortrait(ctx, eagleSheet, enemyCircleX, eagleRowY, circleRadius, '#2a2a35', 'B');
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