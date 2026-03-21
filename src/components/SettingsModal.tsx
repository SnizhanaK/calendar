import { useState } from 'react';
import { X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { customFields, addCustomField, toggleCustomFieldVisibility, removeCustomField } = useStore();
  const [newLabel, setNewLabel] = useState('');

  if (!isOpen) return null;

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      addCustomField(newLabel.trim());
      setNewLabel('');
    }
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
      </div>
    </div>
  );
}
