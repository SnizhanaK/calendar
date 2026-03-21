import { useState } from 'react';
import { X, Plus, Trash2, Eye, EyeOff, Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { customFields, addCustomField, toggleCustomFieldVisibility, removeCustomField, lastBackupAt, setLastBackupAt } = useStore();
  const [newLabel, setNewLabel] = useState('');
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const daysSinceLastBackup = lastBackupAt ? Math.floor((new Date().getTime() - new Date(lastBackupAt).getTime()) / (1000 * 60 * 60 * 24)) : null;

  if (!isOpen) return null;

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      addCustomField(newLabel.trim());
      setNewLabel('');
    }
  };

  const handleExport = () => {
    try {
      const data = localStorage.getItem('crm-storage');
      if (!data) throw new Error('No data found to export');
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      
      link.href = url;
      link.download = `teacher-crm-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const now = new Date().toISOString();
      setLastBackupAt(now);
      setBackupStatus({ type: 'success', message: 'Data exported successfully!' });
    } catch (err) {
      setBackupStatus({ type: 'error', message: 'Failed to export data.' });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Basic validation of Zustand persist structure
        if (!parsed.state || !parsed.state.students || !parsed.state.lessons) {
          throw new Error('Invalid backup file structure.');
        }

        if (window.confirm('Are you sure you want to restore this backup? This will COMPLETELY OVERWRITE your current data. This action cannot be undone.')) {
          localStorage.setItem('crm-storage', content);
          setBackupStatus({ type: 'success', message: 'Backup restored! Reloading...' });
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        setBackupStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to import data.' });
      }
      // Reset input
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.4)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ margin: 0 }}>Lesson Criteria Settings</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
          Define custom fields to show on the lesson form. Changing or deleting fields here will not overwrite data on previously saved lessons.
        </p>

        <form onSubmit={handleAddField} className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="New criterion (e.g. Behavior)..." 
            className="input-field" 
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <Plus size={18} /> Add
          </button>
        </form>

        <div className="flex flex-col gap-3">
          {customFields.length === 0 ? (
            <div className="text-muted text-center" style={{ fontSize: '0.9rem' }}>No custom criteria defined yet.</div>
          ) : (
            customFields.map(field => (
              <div key={field.id} className="flex justify-between items-center" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 500, color: field.isVisible ? 'var(--text-main)' : 'var(--text-muted)', textDecoration: field.isVisible ? 'none' : 'line-through' }}>
                  {field.label}
                </span>
                <div className="flex gap-2">
                  <button 
                    className="btn-icon" 
                    onClick={() => toggleCustomFieldVisibility(field.id)}
                    title={field.isVisible ? 'Hide field globally' : 'Show field globally'}
                  >
                    {field.isVisible ? <Eye size={18} className="text-muted" /> : <EyeOff size={18} className="text-muted" />}
                  </button>
                  <button 
                    className="btn-icon" 
                    onClick={() => removeCustomField(field.id)}
                    style={{ color: '#d9534f' }}
                    title="Delete field"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
          <h3 className="mb-2" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Data Backup & Restore</h3>
          
          <div className="flex flex-col gap-1 mb-4">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Last backup: {lastBackupAt ? new Date(lastBackupAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
            </div>
            {daysSinceLastBackup !== null && daysSinceLastBackup > 7 && (
              <div className="flex items-center gap-2" style={{ color: '#c2410c', fontSize: '0.85rem', fontWeight: 600 }}>
                <AlertTriangle size={14} /> Backup recommended ({daysSinceLastBackup} days ago)
              </div>
            )}
            {!lastBackupAt && (
              <div className="flex items-center gap-2" style={{ color: '#c2410c', fontSize: '0.85rem', fontWeight: 600 }}>
                <AlertTriangle size={14} /> Backup highly recommended (never backed up)
              </div>
            )}
          </div>
          
          {backupStatus && (
            <div className={`flex items-center gap-2 p-3 mb-4 rounded-lg`} style={{ 
              backgroundColor: backupStatus.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: backupStatus.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '0.9rem',
              border: `1px solid ${backupStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}>
              {backupStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {backupStatus.message}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button className="btn btn-primary w-full justify-start" onClick={handleExport}>
              <Download size={18} /> Export Data (.json)
            </button>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', top: 0, left: 0 }}
                title="Import Data"
              />
              <button className="btn btn-ghost w-full justify-start" style={{ border: '1px solid var(--border-color)' }}>
                <Upload size={18} /> Import Data (.json)
              </button>
            </div>

            <p className="text-muted mt-2" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
              Use these tools to manually save your data to your device or restore it later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
