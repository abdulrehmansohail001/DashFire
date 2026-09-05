import React from 'react';
import './BirdMascot.css';

export default function BirdMascot({ targetPosition, message, visible }) {
  // Idle position: bottom right corner.
  const style = targetPosition ? {
    left: `${targetPosition.x}px`,
    top: `${targetPosition.y}px`
  } : {
    left: 'calc(100vw - 80px)',
    top: 'calc(100vh - 80px)'
  };

  return (
    <div className={`bird-mascot ${visible ? 'is-visible' : 'is-idle'}`} style={style}>
      {visible && message && (
        <div className="bird-mascot__speech-bubble">
          {message.effect && (
            <div className="bird-mascot__effect">
              <strong>EFFECT:</strong> {message.effect}
            </div>
          )}
          {message.description && (
            <div className="bird-mascot__desc">
              {message.description}
            </div>
          )}
        </div>
      )}
      <div className="bird-mascot__bird"></div>
    </div>
  );
}
