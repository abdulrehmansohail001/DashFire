import AnimatedGameBackground from './game/AnimatedGameBackground';
import InfoCard from './InfoCard';
import { BOSS_INFO } from './infoCatalog';
import './InfoItems.css';

export default function InfoBossesScreen({ onBack }) {
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
            />
          ))}
        </div>
      </main>
    </div>
  );
}
