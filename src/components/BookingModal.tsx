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
  const { students, addStudent, addLesson, customFields } = useStore();
  
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  
  // Existing student state
  const activeStudents = students.filter(s => s.status === 'Active');
  const [selectedStudentId, setSelectedStudentId] = useState(activeStudents[0]?.id || '');
  
  // New student state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentLang, setNewStudentLang] = useState<'Ukrainian' | 'Russian'>('Ukrainian');
  const [newStudentPrice, setNewStudentPrice] = useState('0');

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

  // Update default selected student if active list changes
  useEffect(() => {
    if (activeStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(activeStudents[0].id);
    }
    if (activeStudents.length === 0) setMode('new');
  }, [activeStudents, selectedStudentId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetStudentId = selectedStudentId;

    if (mode === 'new') {
      if (!newStudentName.trim()) return;
      targetStudentId = addStudent({
        name: newStudentName.trim(),
        language: newStudentLang,
        price: newStudentPrice,
        status: 'Active'
      });
    } else {
      if (!targetStudentId) return;
    }

    // Default custom values (empty) to fulfill Lesson structure
    const initialCustomFields: Record<string, string> = {};
    customFields.forEach(f => { initialCustomFields[f.label] = ''; });

    addLesson({
      student_id: targetStudentId,
      lesson_date: new Date(dateStr).toISOString(),
      lesson_time: startTime,
      lesson_end_time: endTime,
      lesson_price: mode === 'new' ? newStudentPrice : (students.find(s => s.id === targetStudentId)?.price || '0'),
      slide_reached: '',
      lesson_notes: note,
      homework: '',
      next_material_notes: '',
      custom_fields: initialCustomFields
    });

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

          {/* Toggle standard / new student */}
          <div className="flex gap-2" style={{ padding: '4px', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
            <button 
              type="button"
              className={`btn-ghost flex-1 ${mode === 'existing' ? 'text-main' : 'text-muted'}`}
              style={{ backgroundColor: mode === 'existing' ? 'var(--card-bg)' : 'transparent', fontWeight: mode === 'existing' ? 600 : 400, boxShadow: mode === 'existing' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setMode('existing')}
              disabled={activeStudents.length === 0}
            >
              <Users size={16} className="inline mr-2" /> Existing Student
            </button>
            <button 
              type="button"
              className={`btn-ghost flex-1 ${mode === 'new' ? 'text-main' : 'text-muted'}`}
              style={{ backgroundColor: mode === 'new' ? 'var(--card-bg)' : 'transparent', fontWeight: mode === 'new' ? 600 : 400, boxShadow: mode === 'new' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setMode('new')}
            >
              <UserPlus size={16} className="inline mr-2" /> New Student
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
            <div className="flex flex-col gap-3 card" style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', border: '1px solid var(--border-color)' }}>
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
                  <label className="input-label">Price</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={newStudentPrice} 
                    onChange={(e) => setNewStudentPrice(e.target.value)} 
                  />
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

          <div className="flex gap-3 justify-end mt-4">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>Save Booking</button>
          </div>
        </form>
      </div>
    </div>
  );
}
