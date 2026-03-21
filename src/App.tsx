import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Moon, Sun, Settings } from 'lucide-react';

import Home from './pages/Home';
import StudentProfile from './pages/StudentProfile';
import SettingsModal from './components/SettingsModal';

function App() {
  const { theme, toggleTheme } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <header className="container flex items-center justify-between" style={{ paddingBottom: '1rem', paddingTop: '1.5rem' }}>
          <h1 style={{ margin: 0 }}>Students</h1>
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
      </div>
    </BrowserRouter>
  );
}

export default App;
