import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import StatusBar from '../components/layout/StatusBar';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Full-screen app shell: Header | Sidebar + Content | StatusBar
export default function AppLayout() {
  useKeyboardShortcuts();
  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-surface">
          <Outlet />
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
