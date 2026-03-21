import { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function UndoToast({ message, onUndo, onDismiss, duration = 6000 }: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 100));
    }, 100);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onDismiss]);

  const progress = (timeLeft / duration) * 100;

  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-5 py-3 rounded-2xl shadow-lg border animate-slide-up"
      style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderColor: 'var(--border-color)',
        minWidth: '320px'
      }}
    >
      <div className="flex-1">
        <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{message}</div>
        <div className="w-full h-1 bg-transparent mt-2 rounded-full overflow-hidden">
          <div 
            className="h-full" 
            style={{ 
              width: `${progress}%`, 
              backgroundColor: 'var(--accent-green)', 
              transition: 'width 0.1s linear' 
            }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onUndo} 
          className="btn btn-ghost" 
          style={{ 
            fontSize: '0.85rem', 
            padding: '0.4rem 0.75rem', 
            color: 'var(--accent-green)',
            backgroundColor: 'rgba(125, 140, 122, 0.1)'
          }}
        >
          <RotateCcw size={16} /> Undo
        </button>
        <button onClick={onDismiss} className="btn-icon text-muted p-1">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
