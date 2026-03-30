import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Moon, Sun, Settings } from 'lucide-react';

import Home from './pages/Home';
import StudentProfile from './pages/StudentProfile';
import SettingsModal from './components/SettingsModal';
import UndoToast from './components/ui/UndoToast';
import logoUrl from './assets/logo.jpeg';

export interface ToastState {
  message: string;
  onUndo: () => void;
}

declare global {
  interface Window {
    __showUndoToast: (toast: ToastState) => void;
  }
}

function App() {
  const { theme, toggleTheme } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    window.__showUndoToast = (toastData: ToastState) => {
      setToast(toastData);
    };
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <HashRouter>
      <div className="app-layout">
        <header className="container flex items-center justify-between" style={{ paddingBottom: '1rem', paddingTop: '1.5rem' }}>
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Portuguese Learning Logo" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Students</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="btn-icon" aria-label="Settings">
              <Settings size={20} />
            </button>
            <button onClick={toggleTheme} className="btn-icon" aria-label="Toggle Theme">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </header>

        <main className="container" style={{ paddingTop: '0' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/student/:id" element={<StudentProfile />} />
          </Routes>
        </main>

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />

        {toast && (
          <UndoToast 
            message={toast.message} 
            onUndo={() => {
              toast.onUndo();
              setToast(null);
            }} 
            onDismiss={() => setToast(null)} 
          />
        )}
      </div>
    </HashRouter>
  );
}

export default App;
