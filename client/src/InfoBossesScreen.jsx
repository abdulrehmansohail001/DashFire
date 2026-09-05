import { useState, useRef } from 'react';
import AnimatedGameBackground from './game/AnimatedGameBackground';
import InfoCard from './InfoCard';
import BirdMascot from './BirdMascot';
import { BOSS_INFO } from './infoCatalog';
import './InfoItems.css';

export default function InfoBossesScreen({ onBack }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(null);
  const cardRefs = useRef(new Map());

  const handleMouseEnter = (item) => {
    const el = cardRefs.current.get(item.id);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHoverPosition({ x: rect.right - 20, y: rect.top - 20 });
      setHoveredItem(item);
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
    setHoverPosition(null);
  };

  return (
    <div className="info-items-screen">
      <AnimatedGameBackground className="info-items-screen__backdrop-anim" style={{ backgroundImage: "url('/sprites/game_bg.png')" }} />
      <div className="info-items-screen__backdrop" />
      <div className="info-items-screen__scanlines" />

      <button type="button" className="info-items-screen__back" onClick={onBack}>
        ← INFO
      </button>

      <main className="info-items-panel">
        <p className="eyebrow">Dashfire compendium</p>
        <h1>BOSSES</h1>

        <div className="info-items-grid">
          {BOSS_INFO.map((item) => (
            <InfoCard 
              key={item.id} 
              item={item}
              ref={(el) => {
                if (el) cardRefs.current.set(item.id, el);
                else cardRefs.current.delete(item.id);
              }}
              onMouseEnter={() => handleMouseEnter(item)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </div>
      </main>
      
      <BirdMascot 
        targetPosition={hoverPosition}
        message={hoveredItem ? { effect: hoveredItem.specialEffect, description: hoveredItem.description } : null}
        visible={!!hoveredItem}
      />
    </div>
  );
}
