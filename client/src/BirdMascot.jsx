import React, { useState, useEffect } from 'react';
import './BirdMascot.css';

export default function BirdMascot({ targetPosition, message, visible }) {
  const [cachedMessage, setCachedMessage] = useState(null);
  const [typedEffect, setTypedEffect] = useState('');
  const [typedDescription, setTypedDescription] = useState('');

  // Idle position: bottom right corner.
  const style = targetPosition ? {
    left: `${targetPosition.x}px`,
    top: `${targetPosition.y}px`
  } : {
    left: 'calc(100vw - 80px)',
    top: 'calc(100vh - 80px)'
  };

  useEffect(() => {
    if (message && visible) {
      setCachedMessage(message);
      setTypedEffect('');
      setTypedDescription('');
      
      let effectIndex = 0;
      let descIndex = 0;
      
      const effectFull = message.effect || '';
      const descFull = message.description || '';
      
      const intervalId = setInterval(() => {
        let done = true;
        
        if (effectIndex < effectFull.length) {
          effectIndex++;
          setTypedEffect(effectFull.slice(0, effectIndex));
          done = false;
        } else if (descIndex < descFull.length) {
          descIndex++;
          setTypedDescription(descFull.slice(0, descIndex));
          done = false;
        }
        
        if (done) clearInterval(intervalId);
      }, 15);
      
      return () => clearInterval(intervalId);
    }
  }, [message, visible]);

  return (
    <div className={`bird-mascot ${visible ? 'is-visible' : 'is-idle'}`} style={style}>
      <div className={`bird-mascot__speech-bubble ${visible && cachedMessage ? 'show' : ''}`}>
        {cachedMessage?.effect && (
          <div className="bird-mascot__effect">
            <strong>EFFECT:</strong> {typedEffect}
          </div>
        )}
        {cachedMessage?.description && (
          <div className="bird-mascot__desc">
            {typedDescription}
          </div>
        )}
      </div>
      <div className={`bird-mascot__bird ${visible ? 'is-flapping' : ''}`}></div>
    </div>
  );
}
