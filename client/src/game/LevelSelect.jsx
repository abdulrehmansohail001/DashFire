// src/game/LevelSelect.jsx
// Main menu / level select screen. 10 circular level nodes in a grid,
// styled to match the game's dark sci-fi moon theme (same cyan/green
// accent palette as the in-game HP bars and player suit). Locked levels
// are dimmed with a lock icon; unlocked levels are clickable.

import './LevelSelect.css';
import { LEVELS } from './levels';
import { PixelLock, PixelCheck } from './PixelIcon';
export default function LevelSelect({ unlockedCount, onSelectLevel, onBack }) {
  return (
            <div className="level-select">
      <div className="level-select__backdrop-anim" />
      <div className="level-select__backdrop" />
      <div className="level-select__scanlines" />

      {onBack && (
        <button className="level-select__back" onClick={onBack} aria-label="Back to world select">
          ← WORLDS
        </button>
      )}

      <h1 className="level-select__title">DASHFIRE</h1>
      <p className="level-select__subtitle">SELECT A LEVEL</p>

      <div className="level-select__grid">
        {LEVELS.map((levelConfig, index) => {
          const isUnlocked = index < unlockedCount;
          const isCleared = index < unlockedCount - 1;

          return (
            <button
              key={levelConfig.level}
              className={
                'level-node' +
                (isUnlocked ? ' level-node--unlocked' : ' level-node--locked') +
                (isCleared ? ' level-node--cleared' : '')
              }
              disabled={!isUnlocked}
              onClick={() => isUnlocked && onSelectLevel(index)}
              aria-label={
                isUnlocked ? `Play level ${levelConfig.level}` : `Level ${levelConfig.level} locked`
              }
            >
                            {isCleared && (
                <span className="level-node__cleared-badge">
                  <PixelCheck size={20} color="#04140a" />
                </span>
              )}
              {isUnlocked ? (
                <span className="level-node__number">{levelConfig.level}</span>
              ) : (
                <PixelLock size={20} color="#c9862f" />
              )}
            </button>
          );
        })}
      </div>

      <p className="level-select__hint">Clear a level to unlock the next one</p>
    </div>
  );
}