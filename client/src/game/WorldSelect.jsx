// src/game/WorldSelect.jsx
// Screen shown BEFORE level select. 5 world nodes in the same visual
// language as LevelSelect's level nodes. Only World 1 is playable right
// now — it's the 10-level campaign that already exists. Worlds 2-5 are
// locked placeholders for future content; clicking them does nothing.

import './WorldSelect.css';
import { playSound } from './sound';
import { PixelLock } from './PixelIcon';
import { WORLDS } from './worlds';

export default function WorldSelect({ onSelectWorld }) {
  return (
    <div className="world-select">
      <div className="world-select__backdrop-anim" style={{ backgroundImage: "url('/sprites/game_bg.png')" }} />
      <div className="world-select__backdrop" />
      <div className="world-select__scanlines" />

      <h1 className="world-select__title">DASHFIRE</h1>
      <p className="world-select__subtitle">SELECT A WORLD</p>

      <div className="world-select__grid">
        {WORLDS.map((worldConfig, index) => {
          // A world is playable once it actually has level data — no
          // separate constant to remember to bump when a new world ships.
          const isUnlocked = worldConfig.levels && worldConfig.levels.length > 0;

          return (
            <button
              key={worldConfig.id}
              className={
                'world-node' + (isUnlocked ? ' world-node--unlocked' : ' world-node--locked')
              }
              disabled={!isUnlocked}
              onClick={() => {
                if (!isUnlocked) return;
                playSound('click', 0.6);
                onSelectWorld(index);
              }}
              aria-label={isUnlocked ? `Play ${worldConfig.name}` : `${worldConfig.name} locked`}
            >
              {isUnlocked ? (
                <span className="world-node__number">{index + 1}</span>
              ) : (
                <PixelLock size={22} color="#c9862f" />
              )}
            </button>
          );
        })}
      </div>

      <p className="world-select__hint">More worlds coming soon</p>
    </div>
  );
}