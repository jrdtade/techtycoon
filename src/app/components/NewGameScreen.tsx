import { useState } from 'react';
import { CONFIG } from '../../sim';
import { money } from '../format';
import { useGame } from '../store';

export function NewGameScreen() {
  const [name, setName] = useState('Garage Software');
  const [seed, setSeed] = useState('');
  const start = useGame((s) => s.startNewGame);
  const openModal = useGame((s) => s.openModal);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(seed, 10);
    start(name, Number.isFinite(parsed) ? parsed : undefined);
  };

  return (
    <div className="title-screen">
      <h1>Tech Tycoon</h1>
      <p className="tagline">Palo Verde, California. January 1970. A garage, a terminal and {money(CONFIG.start.cash)}.</p>
      <form onSubmit={submit} className="card new-game-form">
        <label>
          Company name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus />
        </label>
        <label>
          Seed <span className="muted">(optional, for a reproducible game)</span>
          <input value={seed} onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ''))} placeholder="random" />
        </label>
        <button type="submit" className="primary">
          Found company
        </button>
        <button type="button" onClick={() => openModal({ kind: 'saves' })}>
          Load a saved game
        </button>
      </form>
    </div>
  );
}
