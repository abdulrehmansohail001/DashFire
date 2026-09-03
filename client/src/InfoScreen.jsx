import AnimatedGameBackground from './game/AnimatedGameBackground';
import './InfoScreen.css';

export default function InfoScreen({ onNavigate, onBack }) {
  return (
    <div className="info-screen">
      <AnimatedGameBackground className="info-screen__backdrop-anim" style={{ backgroundImage: "url('/sprites/game_bg.png')" }} />
      <div className="info-screen__backdrop" />
      <div className="info-screen__scanlines" />

      <button type="button" className="info-screen__back" onClick={onBack}>
        ← MENU
      </button>

      <main className="info-panel">
        <p className="eyebrow">Dashfire compendium</p>
        <h1>INFO</h1>

        <div className="info-categories">
          <button type="button" className="info-category" onClick={() => onNavigate('infoObstacles')}>
            <span className="info-category__title">OBSTACLES</span>
            <span className="info-category__detail">HAZARDS</span>
          </button>
          <button type="button" className="info-category" onClick={() => onNavigate('infoEnemies')}>
            <span className="info-category__title">ENEMIES</span>
            <span className="info-category__detail">BESTIARY</span>
          </button>
          <button type="button" className="info-category" onClick={() => onNavigate('infoBosses')} disabled>
            <span className="info-category__title">BOSSES</span>
            <span className="info-category__detail">COMING SOON</span>
          </button>
        </div>
      </main>
    </div>
  );
}
