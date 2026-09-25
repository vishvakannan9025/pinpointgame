import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminPasscodeModal } from './components/AdminPasscodeModal';
import { AdminNavbar } from './components/AdminNavbar';
import { BuzzerConsole } from './components/BuzzerConsole';
import { QuestionManager } from './components/QuestionManager';
import { ProjectorStageView } from './components/ProjectorStageView';
import { NetworkQrHub } from './components/NetworkQrHub';

const AdminPortalContent = () => {
  const { isAuthenticated, activeTab, lockRound, startRound } = useAdmin();

  // Global Admin Keyboard Shortcuts across all tabs
  // 'L' -> Lock Buzzer
  // 'U' -> Unlock Buzzer (Unbuzz / start active round)
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const handleGlobalShortcuts = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.target?.isContentEditable) return;

      if (e.code === 'KeyL' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        lockRound();
      } else if (e.code === 'KeyU' || e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        startRound();
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [isAuthenticated, lockRound, startRound]);

  if (!isAuthenticated) {
    return <AdminPasscodeModal />;
  }

  return (
    <div className="app-container">
      <AdminNavbar />

      <main className="main-content">
        {activeTab === 'buzzer' && <BuzzerConsole />}
        {activeTab === 'questions' && <QuestionManager />}
        {activeTab === 'projector' && <ProjectorStageView />}
        {activeTab === 'network' && <NetworkQrHub />}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        PinPoint Game — Website Admin Portal &bull; Server-Authoritative First-Buzz Engine (&lt;1ms latency)
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <AdminPortalContent />
    </AdminProvider>
  );
}
