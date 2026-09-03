import AnimatedGameBackground from './game/AnimatedGameBackground';
import InfoCard from './InfoCard';
import { OBSTACLE_INFO } from './infoCatalog';
import './InfoItems.css';

export default function InfoObstaclesScreen({ onBack }) {
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
        <h1>OBSTACLES</h1>

        <div className="info-items-grid">
          {OBSTACLE_INFO.map((item) => (
            <InfoCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </div>
  );
}
