import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Lesson } from '../types';
import { useStore } from '../store/useStore';

interface LessonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lessonData: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>, updateSeries?: boolean) => void;
  studentId: string;
  initialData?: Lesson | null;
}

export default function LessonFormModal({ isOpen, onClose, onSave, studentId, initialData }: LessonFormModalProps) {
  const { customFields, students } = useStore();
  const student = students.find(s => s.id === studentId);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');
  const [endTime, setEndTime] = useState('12:50');
  const [slide, setSlide] = useState('');
  const [notes, setNotes] = useState('');
  const [homework, setHomework] = useState('');
  const [nextNotes, setNextNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [updateSeries, setUpdateSeries] = useState(false);
  
  // Dynamic custom values string -> string map
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const addMinutesToTime = (timeStr: string, minutesToAdd: number) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '';
    const totalMins = h * 60 + m + minutesToAdd;
    const newH = Math.floor(Math.max(0, totalMins) / 60) % 24;
    const newM = Math.max(0, totalMins) % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (initialData) {
      setDate(initialData.lesson_date ? new Date(initialData.lesson_date).toISOString().split('T')[0] : '');
      const initialTime = initialData.lesson_time || '12:00';
      setTime(initialTime);
      setEndTime(initialData.lesson_end_time || addMinutesToTime(initialTime, 50));
      setSlide(initialData.slide_reached || '');
      setNotes(initialData.lesson_notes || '');
      setHomework(initialData.homework || '');
      setNextNotes(initialData.next_material_notes || '');
      setCustomValues(initialData.custom_fields || {});
      setIsRecurring(initialData.isRecurring || false);
      setUpdateSeries(false);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setTime('12:00');
      setEndTime('12:50');
      setSlide('');
      setNotes('');
      setHomework('');
      setNextNotes('');
      setCustomValues({});
      setIsRecurring(false);
      setUpdateSeries(false);
    }
  }, [initialData, isOpen, student]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      student_id: studentId,
      lesson_date: date,
      lesson_time: time,
      lesson_end_time: endTime,
      lesson_price: student?.price || '0', 
      slide_reached: slide,
      lesson_notes: notes,
      homework,
      next_material_notes: nextNotes,
      custom_fields: customValues,
    }, updateSeries);
    onClose();
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [fieldId]: value }));
  };

  // Only show custom fields that are currently visible globally,
  // PLUS any custom fields that were already saved on this lesson record.
  const fieldsToRender = customFields.filter(f => f.isVisible || (initialData && initialData.custom_fields && initialData.custom_fields[f.label] !== undefined));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.4)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ margin: 0 }}>{initialData ? 'Edit Lesson' : 'Add Lesson'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Date</label>
              <input 
                type="date" 
                required 
                className="input-field" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                style={{ border: 'none', padding: '0', backgroundColor: 'transparent', fontWeight: 600 }}
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Start Time</label>
              <select 
                className="input-field" 
                value={time} 
                onChange={(e) => {
                  const newTime = e.target.value;
                  setTime(newTime);
                  setEndTime(addMinutesToTime(newTime, 50));
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

          <div className="input-group">
            <label className="input-label">Slide Reached</label>
            <input type="text" placeholder="e.g. Unit 4, Slide 12" className="input-field" value={slide} onChange={(e) => setSlide(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Lesson Notes</label>
            <textarea placeholder="What was covered today..." className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Homework</label>
            <textarea placeholder="Homework assigned..." className="input-field" value={homework} onChange={(e) => setHomework(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Next Material Notes</label>
            <textarea placeholder="What to prepare for next time..." className="input-field" value={nextNotes} onChange={(e) => setNextNotes(e.target.value)} />
          </div>

          {fieldsToRender.map(field => (
            <div className="input-group" key={field.id}>
              <label className="input-label">{field.label}</label>
              <textarea 
                placeholder={`Value for ${field.label}...`}
                className="input-field" 
                value={customValues[field.label] || ''} 
                onChange={(e) => handleCustomFieldChange(field.label, e.target.value)} 
              />
            </div>
          ))}

          {initialData?.recurringId ? (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(125, 140, 122, 0.08)', border: '1px solid rgba(125, 140, 122, 0.2)' }}>
              <input 
                type="checkbox" 
                id="updateSeries"
                checked={updateSeries} 
                onChange={(e) => setUpdateSeries(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="updateSeries" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                Update entire recurring series
              </label>
            </div>
          ) : !initialData && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
              <input 
                type="checkbox" 
                id="isRecurring"
                checked={isRecurring} 
                onChange={(e) => setIsRecurring(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isRecurring" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
                Repeat weekly (next 8 weeks)
              </label>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-4">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Lesson</button>
          </div>
        </form>
      </div>
    </div>
  );
}
