import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Search, List, Calendar as CalendarIcon, Clock, ChevronRight, Edit2 } from 'lucide-react';
import WeeklyCalendar from '../components/WeeklyCalendar';
import LessonFormModal from '../components/LessonFormModal';
import type { Lesson } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { students, lessons, editLesson } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Active' | 'Inactive'>('Active');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayLessons = lessons
    .filter(l => {
      const d = l.lesson_date.length > 10 ? l.lesson_date.split('T')[0] : l.lesson_date;
      return d === today;
    })
    .sort((a, b) => a.lesson_time.localeCompare(b.lesson_time));

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Unknown';

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center" style={{ paddingBottom: '0.5rem' }}>
          <div className="flex gap-4">
            <button 
              className={`btn-ghost ${filterStatus === 'Active' ? 'text-main' : 'text-muted'}`}
              style={{ 
                padding: '0.25rem 0',
                borderBottom: filterStatus === 'Active' ? '2px solid var(--accent-green)' : '2px solid transparent',
                borderRadius: '0',
                fontWeight: filterStatus === 'Active' ? 600 : 400 
              }}
              onClick={() => setFilterStatus('Active')}
            >
              Active
            </button>
            <button 
              className={`btn-ghost ${filterStatus === 'Inactive' ? 'text-main' : 'text-muted'}`}
              style={{ 
                padding: '0.25rem 0',
                borderBottom: filterStatus === 'Inactive' ? '2px solid var(--accent-green)' : '2px solid transparent',
                borderRadius: '0',
                fontWeight: filterStatus === 'Inactive' ? 600 : 400 
              }}
              onClick={() => setFilterStatus('Inactive')}
            >
              Inactive
            </button>
          </div>

          <div className="flex bg-card p-1 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <button 
              className="btn-icon" 
              style={{ backgroundColor: viewMode === 'list' ? 'var(--bg-color)' : 'transparent', borderRadius: '6px' }}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
            <button 
              className="btn-icon" 
              style={{ backgroundColor: viewMode === 'calendar' ? 'var(--bg-color)' : 'transparent', borderRadius: '6px' }}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <CalendarIcon size={18} />
            </button>
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="flex items-center" style={{ position: 'relative' }}>
            <Search size={18} className="text-muted" style={{ position: 'absolute', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="input-field" 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {viewMode === 'list' && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-secondary" />
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Today's Lessons</h2>
          </div>
          
          {todayLessons.length === 0 ? (
            <div className="card py-8 text-center" style={{ border: '1px dashed var(--border-color)', backgroundColor: 'transparent' }}>
              <p className="text-muted" style={{ margin: 0 }}>No lessons scheduled for today.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {todayLessons.map(lesson => (
                <div 
                  key={lesson.id} 
                  className="card group relative"
                  style={{ 
                    padding: '1rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.25rem',
                    borderLeft: '4px solid var(--accent-green)',
                    cursor: 'default'
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: '1.1rem' }}>{lesson.lesson_time}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="btn-icon" 
                        onClick={() => {
                          setEditingLesson(lesson);
                          setIsEditOpen(true);
                        }}
                        style={{ padding: '2px', width: '24px', height: '24px' }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => navigate(`/student/${lesson.student_id}`)}
                        style={{ padding: '2px', width: '24px', height: '24px' }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getStudentName(lesson.student_id)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'calendar' ? (
        <WeeklyCalendar />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredStudents.length === 0 ? (
            <div className="card py-12 text-center" style={{ padding: '3rem', border: '1px dashed var(--border-color)', backgroundColor: 'transparent' }}>
              <Search size={48} className="text-muted mb-4 mx-auto opacity-20" />
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)' }}>No students found</h3>
              <p className="text-muted" style={{ margin: 0 }}>Try adjusting your search or filter to find who you're looking for.</p>
            </div>
          ) : (
            filteredStudents.map(student => (
              <div 
                key={student.id}
                className="card card-hoverable flex justify-between items-center"
                style={{ 
                  cursor: 'pointer', 
                  padding: '1.25rem 1.75rem',
                  borderLeft: '4px solid var(--accent-green)'
                }}
                onClick={() => navigate(`/student/${student.id}`)}
              >
                <div className="flex flex-col gap-1">
                  <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{student.name}</span>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>{student.contact_info || 'No contact info'}</span>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '2px' }}>Language</span>
                    <span style={{ fontWeight: 500 }}>{student.language}</span>
                  </div>
                  <ChevronRight size={18} className="text-muted" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isEditOpen && editingLesson && (
        <LessonFormModal 
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={(lessonData, updateSeries) => {
            editLesson(editingLesson.id, lessonData, updateSeries);
            setIsEditOpen(false);
          }}
          studentId={editingLesson.student_id}
          initialData={editingLesson}
        />
      )}
    </div>
  );
}
