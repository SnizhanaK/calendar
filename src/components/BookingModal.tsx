import { useState, useEffect } from 'react';
import { X, UserPlus, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledSlot: { day: Date; hour: number; minute: number };
}

export default function BookingModal({ isOpen, onClose, prefilledSlot }: BookingModalProps) {
  const { students, addStudent, addLesson, addRecurringLesson, customFields } = useStore();
  
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  
  // Existing student state
  const activeStudents = students.filter(s => s.status === 'Active');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // New student state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentLang, setNewStudentLang] = useState<'Ukrainian' | 'Russian'>('Ukrainian');
  const [newStudentPrice, setNewStudentPrice] = useState('0');
  const [newStudentCurrency, setNewStudentCurrency] = useState<'EUR' | 'USD'>('EUR');

  // Time state
  const addMinutesToTime = (timeStr: string, minutesToAdd: number) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '';
    const totalMins = h * 60 + m + minutesToAdd;
    const newH = Math.floor(Math.max(0, totalMins) / 60) % 24;
    const newM = Math.max(0, totalMins) % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  const initialTimeStr = `${prefilledSlot.hour.toString().padStart(2, '0')}:${prefilledSlot.minute.toString().padStart(2, '0')}`;
  
  const [dateStr, setDateStr] = useState(format(prefilledSlot.day, 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(initialTimeStr);
  const [endTime, setEndTime] = useState(addMinutesToTime(initialTimeStr, 50));

  // Lesson state
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Reset form state every time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (activeStudents.length > 0) {
      setMode('existing');
      setSelectedStudentId(activeStudents[0].id);
    } else {
      setMode('new');
      setSelectedStudentId('');
    }
    setNote('');
    setIsRecurring(false);
    const initialT = `${prefilledSlot.hour.toString().padStart(2, '0')}:${prefilledSlot.minute.toString().padStart(2, '0')}`;
    setStartTime(initialT);
    setEndTime(addMinutesToTime(initialT, 50));
    setDateStr(format(prefilledSlot.day, 'yyyy-MM-dd'));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetStudentId = selectedStudentId;

    if (mode === 'new') {
      if (!newStudentName.trim()) return;
      targetStudentId = addStudent({
        name: newStudentName.trim(),
        language: newStudentLang,
        price: `${newStudentPrice} ${newStudentCurrency}`,
        status: 'Active'
      });
    } else {
      if (!targetStudentId) return;
    }

    // Default custom values (empty) to fulfill Lesson structure
    const initialCustomFields: Record<string, string> = {};
    customFields.forEach(f => { initialCustomFields[f.label] = ''; });

    const lessonData = {
      student_id: targetStudentId,
      lesson_date: dateStr,
      lesson_time: startTime,
      lesson_end_time: endTime,
      lesson_price: mode === 'new' ? newStudentPrice : (students.find(s => s.id === targetStudentId)?.price || '0'),
      slide_reached: '',
      lesson_notes: note,
      homework: '',
      next_material_notes: '',
      custom_fields: initialCustomFields
    };

    if (isRecurring) {
      addRecurringLesson(lessonData, 4); // 4 weeks = ~1 month
    } else {
      addLesson(lessonData);
    }

    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ margin: 0 }}>Book Lesson</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Time & Scheduling Edit */}
          <div className="flex gap-2">
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Date</label>
              <input 
                type="date" 
                required 
                className="input-field" 
                value={dateStr} 
                onChange={(e) => setDateStr(e.target.value)}
                style={{ border: 'none', padding: '0', backgroundColor: 'transparent', fontWeight: 600 }}
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Start Time</label>
              <select 
                className="input-field" 
                value={startTime} 
                onChange={(e) => {
                  const newT = e.target.value;
                  setStartTime(newT);
                  setEndTime(addMinutesToTime(newT, 50));
                }}
                style={{ fontWeight: 600 }}
              >
                {Array.from({ length: 21 }).map((_, i) => {
                  const totalMins = i * 30;
                  const h = 11 + Math.floor(totalMins / 60);
                  const m = totalMins % 60;
                  if (h > 21 || (h === 21 && m > 0)) return null;
                  const val = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                  return <option key={val} value={val}>{val}</option>;
                }).filter(Boolean)}
              </select>
            </div>
          </div>

          {/* Toggle existing / new student — enlarged and well-spaced */}
          <div style={{ 
            backgroundColor: 'var(--bg-color)', 
            borderRadius: '12px', 
            border: '1px solid var(--border-color)',
            padding: '4px',
            display: 'flex',
            gap: '4px'
          }}>
            <button 
              type="button"
              onClick={() => setMode('existing')}
              disabled={activeStudents.length === 0}
              style={{
                flex: 1,
                padding: '0.7rem 0.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: activeStudents.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: mode === 'existing' ? 600 : 400,
                fontSize: '0.9rem',
                backgroundColor: mode === 'existing' ? 'var(--card-bg)' : 'transparent',
                color: mode === 'existing' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: mode === 'existing' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Users size={16} /> Existing Student
            </button>
            <button 
              type="button"
              onClick={() => setMode('new')}
              style={{
                flex: 1,
                padding: '0.7rem 0.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: mode === 'new' ? 600 : 400,
                fontSize: '0.9rem',
                backgroundColor: mode === 'new' ? 'var(--card-bg)' : 'transparent',
                color: mode === 'new' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: mode === 'new' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <UserPlus size={16} /> New Student
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

          {mode === 'existing' ? (
            <div className="input-group">
              <label className="input-label">Select Student</label>
              <select 
                className="input-field" 
                value={selectedStudentId} 
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                {activeStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.language})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-4" style={{ backgroundColor: 'var(--bg-color)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div className="input-group">
                <label className="input-label">Student Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="E.g. Maria S."
                  className="input-field" 
                  value={newStudentName} 
                  onChange={(e) => setNewStudentName(e.target.value)} 
                />
              </div>

              <div className="flex gap-3">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Language</label>
                  <select 
                    className="input-field" 
                    value={newStudentLang} 
                    onChange={(e) => setNewStudentLang(e.target.value as 'Ukrainian' | 'Russian')}
                  >
                    <option value="Ukrainian">Ukrainian</option>
                    <option value="Russian">Russian</option>
                  </select>
                </div>

                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Price per lesson</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="number" 
                      min="0"
                      className="input-field" 
                      style={{ flex: 1, minWidth: 0 }}
                      value={newStudentPrice} 
                      onChange={(e) => setNewStudentPrice(e.target.value)} 
                    />
                    <select
                      className="input-field"
                      style={{ width: '72px', flexShrink: 0, fontWeight: 600 }}
                      value={newStudentCurrency}
                      onChange={(e) => setNewStudentCurrency(e.target.value as 'EUR' | 'USD')}
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="input-group mt-2">
            <label className="input-label">Lesson Note (Optional)</label>
            <textarea 
              placeholder="E.g. First introductory lesson..." 
              className="input-field" 
              rows={2}
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
            />
          </div>

          {/* Recurring weekly option — styled to match form */}
          <label 
            htmlFor="isRecurring"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.8rem 1rem',
              borderRadius: '10px',
              border: `1px solid ${isRecurring ? 'var(--accent-green)' : 'var(--border-color)'}`,
              backgroundColor: isRecurring ? 'rgba(125, 140, 122, 0.06)' : 'var(--bg-color)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              userSelect: 'none'
            }}
          >
            <input 
              type="checkbox" 
              id="isRecurring"
              checked={isRecurring} 
              onChange={(e) => setIsRecurring(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-green)' }}
            />
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Repeat weekly — 4 weeks</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>Books the same slot for the next 4 weeks</div>
            </div>
          </label>

          <div className="flex gap-3 justify-end mt-4">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>Save Booking</button>
          </div>
        </form>
      </div>
    </div>
  );
}
