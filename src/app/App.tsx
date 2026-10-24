import { useEffect } from 'react';
import { ContractsPanel } from './components/ContractsPanel';
import { EventLog } from './components/EventLog';
import { FinancePanel } from './components/FinancePanel';
import { ReportsModal } from './components/ReportsModal';
import { SavesModal } from './components/SavesModal';
import { SummaryScreen } from './components/SummaryScreen';
import { HireModal } from './components/HireModal';
import { LaunchModal } from './components/LaunchModal';
import { NewGameScreen } from './components/NewGameScreen';
import { NewProjectModal } from './components/NewProjectModal';
import { ProductsPanel } from './components/ProductsPanel';
import { ProjectsPanel } from './components/ProjectsPanel';
import { StaffPanel } from './components/StaffPanel';
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

function ActiveModal() {
  const modal = useGame((s) => s.modal);
  const hasGame = useGame((s) => s.game !== null);
  if (modal?.kind === 'saves') return <SavesModal />;
  if (!modal || !hasGame) return null;
  switch (modal.kind) {
    case 'newProject':
      return <NewProjectModal />;
    case 'launch':
      return <LaunchModal projectId={modal.projectId} />;
    case 'hire':
      return <HireModal />;
    case 'reports':
      return <ReportsModal />;
    default:
      return null;
  }
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
            <div className="main-column">
              <ProjectsPanel />
              <ProductsPanel />
              <ContractsPanel />
            </div>
            <aside className="side-column">
              <StaffPanel />
              <FinancePanel />
              <EventLog />
            </aside>
          </main>
        </div>
      ) : (
        <NewGameScreen />
      )}
      <ActiveModal />
      {hasGame && <SummaryScreen />}
      <Toast />
    </>
  );
}
