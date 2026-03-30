import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Search, Clock, ChevronRight, Edit2, Users } from 'lucide-react';
import WeeklyCalendar from '../components/WeeklyCalendar';
import LessonFormModal from '../components/LessonFormModal';
import type { Lesson } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { students, lessons, editLesson } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const today = new Date().toISOString().split('T')[0];
  const todayLessons = lessons
    .filter(l => {
      const d = l.lesson_date.length > 10 ? l.lesson_date.split('T')[0] : l.lesson_date;
      return d === today;
    })
    .sort((a, b) => a.lesson_time.localeCompare(b.lesson_time));

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="dashboard-container">
      {/* Sidebar: Lessons & Students */}
      <div className="dashboard-sidebar">
        {/* Today's Lessons Section */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-8">
            <Clock size={18} className="text-secondary" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Today's Lessons</h3>
          </div>
          
          <div className="flex flex-col gap-2">
            {todayLessons.length === 0 ? (
              <div className="text-center border-dashed" style={{ padding: '4rem 1rem 5rem', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>No lessons today.</p>
              </div>
            ) : (
              todayLessons.map(lesson => (
                <div 
                  key={lesson.id} 
                  className="card group relative"
                  style={{ 
                    padding: '0.75rem', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderLeft: '4px solid var(--accent-green)',
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: '0.9rem' }}>{lesson.lesson_time}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="btn-icon" 
                        onClick={() => {
                          setEditingLesson(lesson);
                          setIsEditOpen(true);
                        }}
                        style={{ padding: '2px', width: '20px', height: '20px' }}
                      >
                        <Edit2 size={10} />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => navigate(`/student/${lesson.student_id}`)}
                        style={{ padding: '2px', width: '20px', height: '20px' }}
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getStudentName(lesson.student_id)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-muted" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Students</h3>
          </div>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={14} className="text-muted" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="input-field" 
              style={{ paddingLeft: '2.2rem', height: '32px', fontSize: '0.85rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredStudents.length === 0 ? (
              <p className="text-muted text-center py-4" style={{ fontSize: '0.85rem' }}>No students found.</p>
            ) : (
              filteredStudents.map(student => (
                <div 
                  key={student.id}
                  className="card card-hoverable flex justify-between items-center"
                  style={{ 
                    cursor: 'pointer', 
                    padding: '0.75rem 1rem',
                    borderLeft: '3px solid var(--accent-green)'
                  }}
                  onClick={() => navigate(`/student/${student.id}`)}
                >
                  <div className="flex flex-col">
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.name}</span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{student.language}</span>
                  </div>
                  <ChevronRight size={14} className="text-muted" />
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Main Content: Weekly Calendar */}
      <div className="dashboard-main">
        <WeeklyCalendar />
      </div>

      <style>{`
        .dashboard-container {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }
        .dashboard-sidebar {
          width: 320px;
          flex-shrink: 0;
          position: sticky;
          top: 1.5rem;
        }
        .dashboard-main {
          flex: 1;
          min-width: 0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 4px;
        }
        @media (max-width: 1024px) {
          .dashboard-container {
            flex-direction: column;
          }
          .dashboard-sidebar {
            width: 100%;
            position: relative;
            top: 0;
          }
        }
      `}</style>

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
