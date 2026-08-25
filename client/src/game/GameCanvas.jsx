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
import { isColliding } from './entities/Obstacle';
import { Enemy } from './entities/Enemy';
import { Bullet } from './entities/Bullet';
import { EnemyBullet } from './entities/EnemyBullet';
import { SpriteSheet } from './entities/SpriteSheet';
import { LEVELS } from './levels';
import { Background } from './entities/Background';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const ENEMY_GROUND_Y = 340;
const PLAYER_MAX_HEALTH = 3;

// Arena span enemies are allowed to patrol within, split evenly per enemy.
const ARENA_MIN_X = 480;
const ARENA_MAX_X = 750;

const playerSheet = new SpriteSheet('/sprites/player.png', 313, 313, 4, 4);
const enemySheet = new SpriteSheet('/sprites/enemy.png', 313, 313, 4, 4);
const moonBgSheet = new SpriteSheet('/sprites/moon_bg.jpg', 366, 352, 8, 1);
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

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [health, setHealth] = useState(3);
  const [levelNumber, setLevelNumber] = useState(1);
  // 'playing' | 'gameover' | 'levelComplete' | 'gameComplete'
  const [gameState, setGameState] = useState('playing');

  const playerRef = useRef(new Player(100, 340));
  const enemiesRef = useRef(buildEnemiesForLevel(LEVELS[0]));
    const backgroundRef = useRef(new Background(moonBgSheet, 0.2));
  const enemyBulletsRef = useRef([]);
  const bulletsRef = useRef([]);
  const keysRef = useRef({});
  const gameStateRef = useRef('playing');
  const levelIndexRef = useRef(0); // 0-based index into LEVELS

  const startLevel = (index, keepHealth = true) => {
    levelIndexRef.current = index;
    const config = LEVELS[index];

    playerRef.current.x = 100;
    playerRef.current.y = 340;
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

    gameStateRef.current = 'playing';
    setGameState('playing');
    setLevelNumber(config.level);
    setHealth(playerRef.current.health);
  };

  const restartFromLevel1 = () => {
    playerRef.current = new Player(100, 340);
    startLevel(0, false);
  };

  const advanceToNextLevel = () => {
    const nextIndex = levelIndexRef.current + 1;
    if (nextIndex < LEVELS.length) {
      startLevel(nextIndex, true);
    }
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
      const bulletY = player.y + player.height / 2 - 2;
      bulletsRef.current.push(new Bullet(bulletX, bulletY, direction));
      player.triggerShoot();
    }

    const JUMP_KEYS = ['ArrowUp', ' ', 'w', 'W'];

    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;

      if (gameStateRef.current === 'gameover' && (e.key === 'r' || e.key === 'R')) {
        restartFromLevel1();
      }

      if (
        gameStateRef.current === 'levelComplete' &&
        (e.key === 'n' || e.key === 'N' || e.key === ' ')
      ) {
        advanceToNextLevel();
      }

      if (gameStateRef.current === 'gameComplete' && (e.key === 'r' || e.key === 'R')) {
        restartFromLevel1();
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
      if (gameStateRef.current !== 'playing') return;

      const player = playerRef.current;
      const wasGrounded = player.isGrounded;

      player.handleInput(keysRef.current);
      player.update(dt);

      const enemies = enemiesRef.current;
      const playerJustJumped = wasGrounded && !player.isGrounded;

      for (const enemy of enemies) {
        if (!enemy.alive) continue;

        if (playerJustJumped) {
          enemy.triggerDelayedReaction();
        }

        enemy.update(dt);

        if (enemy.wantsToFire) {
          enemy.wantsToFire = false;
          const bulletY = enemy.y + enemy.height / 2 - 2;
          enemyBulletsRef.current.push(
            new EnemyBullet(enemy.x, bulletY, 'left', enemy.bulletSpeed)
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

      for (const bullet of bulletsRef.current) {
        if (bullet.hit) continue;
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

      const allEnemiesDead = enemies.every((e) => !e.alive);
      if (allEnemiesDead && gameStateRef.current === 'playing') {
        const isFinalLevel = levelIndexRef.current === LEVELS.length - 1;
        gameStateRef.current = isFinalLevel ? 'gameComplete' : 'levelComplete';
        setGameState(gameStateRef.current);
      }

      if (player.health <= 0 && gameStateRef.current === 'playing') {
        gameStateRef.current = 'gameover';
        setGameState('gameover');
      }

      setHealth(Math.max(player.health, 0));
    }

        function draw() {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      backgroundRef.current.draw(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(0, 400);
      ctx.lineTo(800, 400);
      ctx.stroke();

      playerRef.current.draw(ctx, playerSheet);
      enemiesRef.current.forEach((e) => e.draw(ctx, enemySheet));
      enemyBulletsRef.current.forEach((o) => o.draw(ctx));
      bulletsRef.current.forEach((b) => b.draw(ctx));

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
      const enemyCircleX = CANVAS_WIDTH - 40;
      const enemies = enemiesRef.current;
      const totalMax = enemies.reduce((sum, e) => sum + e.maxHealth, 0);
      if (totalMax > 0) {
        const totalCurrent = enemies.reduce((sum, e) => sum + Math.max(e.health, 0), 0);
        const barWidth = 150;
        const barX = enemyCircleX - circleRadius - 12 - barWidth;
        drawHpBar(ctx, barX, circleY - 8, barWidth, 16, totalCurrent / totalMax, 'ENEMY HP', 'right');
        drawHudPortrait(ctx, enemySheet, enemyCircleX, circleY, circleRadius, '#a83232', 'E');
      }

      if (gameStateRef.current === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = '32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 400, 180);

        ctx.font = '18px monospace';
        ctx.fillText('Press R to restart from Level 1', 400, 220);
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
        ctx.fillText('Press N to continue', 400, 220);
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
        ctx.fillText('Press R to play again', 400, 210);
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '18px' }}>
        Level: {levelNumber}/10 &nbsp;|&nbsp; Move: A/D &nbsp;|&nbsp; Jump: W/Space
        &nbsp;|&nbsp; Shoot: F
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ background: '#4a4a6a', border: '2px solid #888' }}
      />
    </div>
  );
}