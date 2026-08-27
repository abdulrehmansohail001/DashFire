// src/game/sound.js
// Tiny sound manager: preloads each named clip once, plays it on demand.
// Uses a small pool per sound (instead of replaying the same Audio object)
// so overlapping triggers — like rapid-fire shooting — don't cut each
// other off; each play() call grabs whichever pooled clone is free.

const SOUND_FILES = {
  shoot: '/sounds/shoot.wav',
  hit: '/sounds/hit.ogg',
  explosion: '/sounds/explosion.wav',
  victory: '/sounds/victory.wav',
  gameover: '/sounds/gameover.wav',
  click: '/sounds/click.wav',
};

const POOL_SIZE = 4; // enough for rapid-fire shoot/hit without audible cutoff
const pools = {};

for (const [name, src] of Object.entries(SOUND_FILES)) {
  pools[name] = Array.from({ length: POOL_SIZE }, () => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    return audio;
  });
}

let muted = false;

export function playSound(name, volume = 1) {
  if (muted) return;
  const pool = pools[name];
  if (!pool) return;

  // Find a clip that's finished (or never started) playing; if all are
  // mid-playback, just reuse the first one so sound never silently drops.
  const clip = pool.find((a) => a.paused || a.ended) ?? pool[0];
  clip.currentTime = 0;
  clip.volume = volume;
  clip.play().catch(() => {}); // browsers block autoplay before first user gesture — ignore
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}