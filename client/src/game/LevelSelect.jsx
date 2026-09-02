// src/game/LevelSelect.jsx
// Main menu / level select screen. 10 circular level nodes in a grid,
// styled to match the game's dark sci-fi moon theme (same cyan/green
// accent palette as the in-game HP bars and player suit). Locked levels
// are dimmed with a lock icon; unlocked levels are clickable.

import { useEffect, useState } from 'react';
import './LevelSelect.css';
import { playSound } from './sound';
import { PixelLock } from './PixelIcon';

const BACKDROP_FRAME_INTERVAL = 200; // ms per frame — matches the old 1.6s/8-step cycle

export default function LevelSelect({
  levels,
  unlockedCount,
  starsByLevel = {},
  worldIndex = 0,
  missionTitle,
  backgroundPath,
  backgroundColumns = 8,
  backgroundRows = 1,
  onSelectLevel,
  onBack,
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const frameCount = backgroundColumns * backgroundRows;

  useEffect(() => {
    setFrameIndex(0);
    const id = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frameCount);
    }, BACKDROP_FRAME_INTERVAL);
    return () => clearInterval(id);
  }, [frameCount, backgroundPath]);

  const col = frameIndex % backgroundColumns;
  const row = Math.floor(frameIndex / backgroundColumns);
  const backdropStyle = {
    backgroundImage: `url(${backgroundPath || '/sprites/moon_bg.jpg'})`,
    backgroundSize: `${backgroundColumns * 100}% ${backgroundRows * 100}%`,
    backgroundPosition: `${backgroundColumns > 1 ? (col / (backgroundColumns - 1)) * 100 : 0}% ${
      backgroundRows > 1 ? (row / (backgroundRows - 1)) * 100 : 0
    }%`,
  };

  return (
            <div className="level-select">
      <div className="level-select__backdrop-anim" style={backdropStyle} />
      <div className="level-select__backdrop" />
      <div className="level-select__scanlines" />

      {onBack && (
        <button className="level-select__back" onClick={onBack} aria-label="Back to world select">
          ← WORLDS
        </button>
      )}

      <h1 className="level-select__title">{missionTitle || 'MISSION'}</h1>
      <p className="level-select__subtitle">SELECT A LEVEL</p>

      <div className="level-select__grid">
        {levels.map((levelConfig, index) => {
          const isUnlocked = index < unlockedCount;
          const isCleared = index < unlockedCount - 1;
          const starCount = Math.min(3, Math.max(0, Number(starsByLevel[`${worldIndex}:${index}`]) || 0));

          return (
            <button
              key={levelConfig.level}
              className={
                'level-node' +
                (isUnlocked ? ' level-node--unlocked' : ' level-node--locked') +
                (isCleared ? ' level-node--cleared' : '')
              }
              disabled={!isUnlocked}
              onClick={() => {
                if (!isUnlocked) return;
                playSound('click', 0.6);
                onSelectLevel(index);
              }}
              aria-label={
                isUnlocked ? `Play level ${levelConfig.level}` : `Level ${levelConfig.level} locked`
              }
            >
              {isCleared && starCount > 0 && (
                <span className="level-node__stars" aria-label={`${starCount} stars`}>
                  {'⭐'.repeat(starCount)}
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