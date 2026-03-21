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
  const [currency, setCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [contactInfo, setContactInfo] = useState('');
  const [pinnedNotes, setPinnedNotes] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [goals, setGoals] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      // Ensure existing language maps closely, default to Ukrainian
      setLanguage(initialData.language);
      // Parse price and currency if stored as "25 EUR" or just "25"
      const priceParts = (initialData.price || '0').split(' ');
      setPrice(priceParts[0] || '0');
      setCurrency((priceParts[1] as 'EUR' | 'USD') || 'EUR');
      setContactInfo(initialData.contact_info || '');
      setPinnedNotes(initialData.pinnedNotes || '');
      setGeneralNotes(initialData.general_notes || '');
      setGoals(initialData.goals || '');
      setStatus(initialData.status);
    } else {
      setName('');
      setLanguage('Ukrainian');
      setPrice('0');
      setCurrency('EUR');
      setContactInfo('');
      setPinnedNotes('');
      setGeneralNotes('');
      setGoals('');
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
      price: `${price.trim() || '0'} ${currency}`,
      contact_info: contactInfo.trim(),
      pinnedNotes: pinnedNotes.trim(),
      goals: goals.trim(),
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
            <label className="input-label">Pinned Student Info</label>
            <textarea 
              className="input-field" 
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={pinnedNotes} 
              onChange={(e) => setPinnedNotes(e.target.value)}
              placeholder="Important long-term info (interests, quirks)..."
            />
          </div>

          <div className="input-group">
            <label className="input-label">Student Goals</label>
            <textarea 
              className="input-field" 
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={goals} 
              onChange={(e) => setGoals(e.target.value)}
              placeholder="What does the student want to achieve?..."
            />
          </div>

          <div className="input-group">
            <label className="input-label">General Notes</label>
            <textarea 
              className="input-field" 
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={generalNotes} 
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Permanent comments, family info, etc..."
            />
          </div>

          <div className="input-group">
            <label className="input-label">Price per lesson</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input 
                type="number"
                min="0"
                className="input-field"
                style={{ flex: 1, minWidth: 0 }}
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
              />
              <select
                className="input-field"
                style={{ width: '72px', flexShrink: 0, fontWeight: 600 }}
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'EUR' | 'USD')}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
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
