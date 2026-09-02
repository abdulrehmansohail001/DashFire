import { useEffect, useState } from 'react';
import { getLeaderboard } from './services/leaderboardApi';
import './Leaderboard.css';
import AnimatedGameBackground from './game/AnimatedGameBackground';

export default function Leaderboard({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    getLeaderboard()
      .then((data) => {
        if (isMounted) setEntries(Array.isArray(data.entries) ? data.entries : []);
      })
      .catch(() => {
        if (isMounted) setError('LEADERBOARD UNAVAILABLE');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="leaderboard-screen">
      <AnimatedGameBackground className="leaderboard-screen__backdrop-anim" style={{ backgroundImage: "url('/sprites/game_bg.png')" }} />
      <div className="leaderboard-screen__backdrop" />
      <div className="leaderboard-screen__scanlines" />

      <button type="button" className="leaderboard-screen__back" onClick={onBack}>
        ← MENU
      </button>

      <main className="leaderboard-panel">
        <p className="eyebrow">Dashfire records</p>
        <h1>LEADERBOARD</h1>

        <div className="leaderboard-table" role="table" aria-label="Top players by stars">
          <div className="leaderboard-row leaderboard-row--header" role="row">
            <span role="columnheader">RANK</span>
            <span role="columnheader">PLAYER</span>
            <span role="columnheader">STARS</span>
          </div>

          {isLoading && <p className="leaderboard-status">LOADING...</p>}
          {!isLoading && error && <p className="leaderboard-status leaderboard-status--error">{error}</p>}
          {!isLoading && !error && entries.length === 0 && (
            <p className="leaderboard-status">NO PLAYERS YET</p>
          )}
          {!isLoading && !error && entries.map((entry) => (
            <div className="leaderboard-row" role="row" key={`${entry.rank}-${entry.player}`}>
              <span role="cell">{entry.rank}</span>
              <span role="cell" className="leaderboard-row__player">{entry.player}</span>
              <span role="cell">{entry.stars}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}