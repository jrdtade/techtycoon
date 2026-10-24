import { useEffect } from 'react';
import { EventLog } from './components/EventLog';
import { NewGameScreen } from './components/NewGameScreen';
import { TopBar } from './components/TopBar';
import { startGameLoop } from './gameLoop';
import { useGame } from './store';

function Toast() {
  const toast = useGame((s) => s.toast);
  const showToast = useGame((s) => s.showToast);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => showToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast, showToast]);
  if (!toast) return null;
  return (
    <div className="toast" onClick={() => showToast(null)}>
      {toast}
    </div>
  );
}

export function App() {
  const hasGame = useGame((s) => s.game !== null);
  useEffect(() => startGameLoop(), []);

  return (
    <>
      {hasGame ? (
        <div className="app">
          <TopBar />
          <main className="dashboard">
            <div className="main-column" />
            <aside className="side-column">
              <EventLog />
            </aside>
          </main>
        </div>
      ) : (
        <NewGameScreen />
      )}
      <Toast />
    </>
  );
}
