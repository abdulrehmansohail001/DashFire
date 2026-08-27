// src/game/WorldSelect.jsx
// Screen shown BEFORE level select. 5 world nodes in the same visual
// language as LevelSelect's level nodes. Only World 1 is playable right
// now — it's the 10-level campaign that already exists. Worlds 2-5 are
// locked placeholders for future content; clicking them does nothing.

import './WorldSelect.css';
import { PixelLock } from './PixelIcon';

const WORLD_COUNT = 5;
const UNLOCKED_WORLD_COUNT = 1; // only World 1 exists/is playable for now

export default function WorldSelect({ onSelectWorld }) {
  return (
    <div className="world-select">
      <div className="world-select__backdrop-anim" />
      <div className="world-select__backdrop" />
      <div className="world-select__scanlines" />

      <h1 className="world-select__title">DASHFIRE</h1>
      <p className="world-select__subtitle">SELECT A WORLD</p>

      <div className="world-select__grid">
        {Array.from({ length: WORLD_COUNT }, (_, index) => {
          const isUnlocked = index < UNLOCKED_WORLD_COUNT;

          return (
            <button
              key={index}
              className={
                'world-node' + (isUnlocked ? ' world-node--unlocked' : ' world-node--locked')
              }
              disabled={!isUnlocked}
              onClick={() => isUnlocked && onSelectWorld(index)}
              aria-label={isUnlocked ? `Play world ${index + 1}` : `World ${index + 1} locked`}
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