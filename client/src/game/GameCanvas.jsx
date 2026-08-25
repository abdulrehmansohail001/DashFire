// src/game/GameCanvas.jsx
// React wrapper around the Canvas game loop. React only mounts the canvas
// and manages the HUD state (health, game-over/win) — the actual per-frame
// loop runs outside React's render cycle via requestAnimationFrame,
// so React re-renders don't fight the game loop's own update rate.

import { useEffect, useRef, useState } from 'react';
import { Player } from './entities/Player';
import { isColliding } from './entities/Obstacle';
import { Enemy } from './entities/Enemy';
import { Bullet } from './entities/Bullet';
import { EnemyBullet } from './entities/EnemyBullet';
import { SpriteSheet } from './entities/SpriteSheet';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

// Sprite sheets are loaded once at module scope (not per-mount) so the
// image only fetches/decodes a single time. 313 = 1252 / 4 (4x4 grid).
const playerSheet = new SpriteSheet('/sprites/player.png', 313, 313, 4, 4);
const enemySheet = new SpriteSheet('/sprites/enemy.png', 313, 313, 4, 4);

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [health, setHealth] = useState(3);
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'gameover' | 'win'

  const playerRef = useRef(new Player(100, 340));
  const enemyRef = useRef(new Enemy(700, 340));
  const enemyBulletsRef = useRef([]);
  const bulletsRef = useRef([]);
  const keysRef = useRef({});
  const gameStateRef = useRef('playing');

  const resetGame = () => {
    playerRef.current = new Player(100, 340);
    enemyRef.current = new Enemy(700, 340);
    enemyBulletsRef.current = [];
    bulletsRef.current = [];
    gameStateRef.current = 'playing';
    setGameState('playing');
    setHealth(3);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function shoot() {
      if (gameStateRef.current !== 'playing') return;
      const player = playerRef.current;
      const direction = player.facing; // 'left' | 'right'
      const bulletX = direction === 'right' ? player.x + player.width : player.x;
            const bulletY = player.y + player.height / 2 - 2;
      bulletsRef.current.push(new Bullet(bulletX, bulletY, direction));
      player.triggerShoot();
    }

        const JUMP_KEYS = ['ArrowUp', ' ', 'w', 'W'];

    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;

      if (
        (gameStateRef.current === 'gameover' || gameStateRef.current === 'win') &&
        (e.key === 'r' || e.key === 'R')
      ) {
        resetGame();
      }

      if ((e.key === 'f' || e.key === 'F') && gameStateRef.current === 'playing') {
        shoot();
      }

      // Jump only fires on the actual keydown edge (e.repeat is true for
      // browser auto-repeat while a key is held), so holding the key does
      // NOT queue up extra jumps for the moment you land.
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

      const enemy = enemyRef.current;

      // linked behavior: player just left the ground (jumped) -> enemy reacts after a short delay
      if (wasGrounded && !player.isGrounded && enemy.alive) {
        enemy.triggerDelayedReaction();
      }

      if (enemy.alive) {
        enemy.update(dt);

        if (enemy.wantsToFire) {
          enemy.wantsToFire = false;
          const bulletY = enemy.y + enemy.height / 2 - 2;
          enemyBulletsRef.current.push(new EnemyBullet(enemy.x, bulletY, 'left'));
        }
      }

      enemyBulletsRef.current.forEach((o) => o.update(dt));
      enemyBulletsRef.current = enemyBulletsRef.current.filter((o) => !o.isOffScreen());

      bulletsRef.current.forEach((b) => b.update(dt));
      bulletsRef.current = bulletsRef.current.filter((b) => !b.isOffScreen(CANVAS_WIDTH));

      // player vs enemy bullets
      const playerBounds = player.getBounds();
      for (const bullet of enemyBulletsRef.current) {
        if (isColliding(playerBounds, bullet.getBounds())) {
          player.takeHit();
        }
      }

      // player bullets vs enemy
      if (enemy.alive) {
        for (const bullet of bulletsRef.current) {
          if (isColliding(bullet.getBounds(), enemy.getBounds())) {
            enemy.takeHit();
            bullet.hit = true;
          }
        }
        bulletsRef.current = bulletsRef.current.filter((b) => !b.hit);
      }

      if (!enemy.alive && gameStateRef.current === 'playing') {
        gameStateRef.current = 'win';
        setGameState('win');
      }

      if (player.health <= 0 && gameStateRef.current === 'playing') {
        gameStateRef.current = 'gameover';
        setGameState('gameover');
      }

      setHealth(Math.max(player.health, 0));
    }

    function draw() {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(0, 400);
      ctx.lineTo(800, 400);
      ctx.stroke();

            playerRef.current.draw(ctx, playerSheet);
      enemyRef.current.draw(ctx, enemySheet);
      enemyBulletsRef.current.forEach((o) => o.draw(ctx));
      bulletsRef.current.forEach((b) => b.draw(ctx));

      if (gameStateRef.current === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = '32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 400, 180);

        ctx.font = '18px monospace';
        ctx.fillText('Press R to restart', 400, 220);
      }

      if (gameStateRef.current === 'win') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#3aff6a';
        ctx.font = '32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ENEMY DOWN — LEVEL CLEAR', 400, 180);

        ctx.fillStyle = '#fff';
        ctx.font = '18px monospace';
        ctx.fillText('Press R to restart', 400, 220);
      }
    }

    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

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
        Health: {health} &nbsp;|&nbsp; Move: A/D or ←/→ &nbsp;|&nbsp; Jump: W/Space &nbsp;|&nbsp; Shoot: F
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