import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Student } from '../types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Omit<Student, 'id'>) => void;
  initialData?: Student;
}

export default function StudentFormModal({ isOpen, onClose, onSave, initialData }: StudentFormModalProps) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'Ukrainian' | 'Russian'>('Ukrainian');
  const [price, setPrice] = useState('0');
  const [contactInfo, setContactInfo] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      // Ensure existing language maps closely, default to Ukrainian
      setLanguage(initialData.language);
      setPrice(initialData.price);
      setContactInfo(initialData.contact_info || '');
      setGeneralNotes(initialData.general_notes || '');
      setStatus(initialData.status);
    } else {
      setName('');
      setLanguage('Ukrainian');
      setPrice('0');
      setContactInfo('');
      setGeneralNotes('');
      setStatus('Active');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      language,
      price: price.trim() || '0',
      contact_info: contactInfo.trim(),
      general_notes: generalNotes.trim(),
      status
    });
    onClose();
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
          <h2 style={{ margin: 0 }}>{initialData ? 'Edit Student' : 'New Student'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="input-group">
            <label className="input-label">Student Name *</label>
            <input 
              type="text" 
              required 
              className="input-field" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Language</label>
            <select 
              className="input-field" 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as 'Ukrainian' | 'Russian')}
            >
              <option value="Ukrainian">Ukrainian</option>
              <option value="Russian">Russian</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Contact Information</label>
            <input 
              type="text" 
              placeholder="E.g. WhatsApp, Email..."
              className="input-field" 
              value={contactInfo} 
              onChange={(e) => setContactInfo(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label className="input-label">General Notes</label>
            <textarea 
              className="input-field" 
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={generalNotes} 
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Permanent student notes, goals, comments..."
            />
          </div>

          <div className="input-group">
            <label className="input-label">Default Price</label>
            <input 
              type="number" 
              className="input-field" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
            />
          </div>

          {initialData && (
            <div className="input-group">
              <label className="input-label">Status</label>
              <select 
                className="input-field" 
                value={status} 
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-4">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{initialData ? 'Save Changes' : 'Create Student'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
