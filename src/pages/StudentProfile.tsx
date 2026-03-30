import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Clipboard } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Lesson } from '../types';
import LessonFormModal from '../components/LessonFormModal';
import StudentFormModal from '../components/StudentFormModal';

function LessonHistoryItem({ 
  lesson, 
  onEdit, 
  onDelete 
}: { 
  lesson: Lesson; 
  onEdit: (l: Lesson) => void; 
  onDelete: (id: string) => void; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card" style={{ padding: '0', transition: 'all 0.2s', overflow: 'hidden' }}>
      {/* Collapsed Header / Preview */}
      <div 
        className="flex justify-between items-center" 
        style={{ 
          padding: '1.25rem 1.5rem', 
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
          backgroundColor: isExpanded ? 'var(--bg-color)' : 'transparent'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div style={{ color: 'var(--accent-green)', display: 'flex' }}>
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
              {new Date(lesson.lesson_date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}
              {lesson.lesson_time && <span className="text-muted" style={{ fontWeight: 400, marginLeft: '8px' }}>• {lesson.lesson_time}</span>}
            </div>
            <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '2px' }}>
              Slide: {lesson.slide_reached || '—'} {lesson.lesson_notes && `• ${lesson.lesson_notes.substring(0, 40)}${lesson.lesson_notes.length > 40 ? '...' : ''}`}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="btn-icon" style={{ opacity: 0.6 }} onClick={() => onEdit(lesson)} title="Edit">
            <Edit2 size={16} />
          </button>
          <button className="btn-icon" style={{ color: '#c2410c', opacity: 0.8 }} onClick={() => onDelete(lesson.id)} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="flex flex-col gap-3" style={{ padding: '1rem', fontSize: '0.95rem' }}>
          {lesson.lesson_notes && (
            <div>
              <div className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{lesson.lesson_notes}</div>
            </div>
          )}
          {lesson.homework && (
            <div>
              <div className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Homework</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{lesson.homework}</div>
            </div>
          )}
          {lesson.next_material_notes && (
            <div>
              <div className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Session</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{lesson.next_material_notes}</div>
            </div>
          )}
          {lesson.custom_fields && Object.entries(lesson.custom_fields).map(([fieldLabel, value]) => {
            if (!value) return null;
            return (
              <div key={fieldLabel}>
                <div className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{fieldLabel}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{value}</div>
              </div>
            );
          })}
          
          {/* Fallback if practically empty */}
          {!lesson.lesson_notes && !lesson.homework && !lesson.next_material_notes && (!lesson.custom_fields || Object.values(lesson.custom_fields).every(v => !v)) && (
            <div className="text-muted italic" style={{ fontSize: '0.85rem' }}>No detailed notes saved for this lesson.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  // ... rest of StudentProfile code will pick up below

  const navigate = useNavigate();
  const { students, lessons, addLesson, editLesson, deleteLesson, updateStudent, deleteStudent, restoreLesson, restoreStudent } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const student = students.find((s) => s.id === id);
  if (!student) {
    return (
      <div className="text-center mt-6">
        <h2>Student not found</h2>
        <button className="btn btn-ghost mt-4" onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  const studentLessons = lessons
    .filter((l) => l.student_id === id)
    .sort((a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime());

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const pastLessons = studentLessons.filter(l => {
    const d = l.lesson_date.length > 10 ? l.lesson_date.split('T')[0] : l.lesson_date;
    return d <= todayStr;
  });
  const latestLesson = pastLessons[0];

  const handleSaveLesson = (lessonData: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingLesson) {
      editLesson(editingLesson.id, lessonData);
    } else {
      addLesson(lessonData);
    }
    setEditingLesson(null);
  };

  const handleSaveStudent = (studentData: Parameters<typeof updateStudent>[1]) => {
    if (student) {
      updateStudent(student.id, studentData);
    }
  };

  const handleDelete = (lessonId: string) => {
    deleteLesson(lessonId, (deletedLesson) => {
      window.__showUndoToast({
        message: 'Lesson deleted',
        onUndo: () => restoreLesson(deletedLesson)
      });
    });
  };

  const handleStudentDelete = () => {
    const studentName = student.name;
    deleteStudent(student.id, (deletedStudent, deletedLessons) => {
      window.__showUndoToast({
        message: `Student "${studentName}" and all data deleted`,
        onUndo: () => restoreStudent(deletedStudent, deletedLessons)
      });
      navigate('/');
    });
  };

  const openAddModal = () => {
    setEditingLesson(null);
    setIsModalOpen(true);
  };

  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsModalOpen(true);
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={() => navigate('/')} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0 }}>{student.name}</h1>
        </div>
      </div>

      {/* Student Overview Dossier */}
      <div className="card mb-6" style={{ borderLeft: '6px solid var(--accent-green)' }}>
        <div className="flex flex-col gap-5">
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
            <div className="flex flex-col gap-1">
              <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Language</span>
              <span style={{ fontWeight: 600 }}>{student.language}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
              <span style={{ 
                color: student.status === 'Active' ? 'var(--accent-green)' : 'var(--text-muted)',
                fontWeight: 700
              }}>{student.status}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</span>
              <span style={{ wordBreak: 'break-word' }}>{student.contact_info || <em className="text-muted">None</em>}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
              <span style={{ fontWeight: 600 }}>{student.price || '0'}</span>
            </div>
          </div>

          {(student.pinnedNotes || student.goals || student.general_notes) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              {student.pinnedNotes && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📌 Pinned Info</span>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.9rem' }}>{student.pinnedNotes}</div>
                </div>
              )}
              {student.goals && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Learning Goals</span>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{student.goals}</div>
                </div>
              )}
              {student.general_notes && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>General Notes</span>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.9rem' }}>{student.general_notes}</div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 mt-2 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-ghost" onClick={() => setIsStudentFormOpen(true)} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              <Edit2 size={16} /> Edit profile
            </button>
            <button className="btn btn-ghost" onClick={handleStudentDelete} style={{ color: '#c2410c', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              <Trash2 size={16} /> Delete student
            </button>
          </div>
        </div>
      </div>

      <div className="card mb-8" style={{ backgroundColor: 'var(--bg-color)', borderStyle: 'dashed' }}>
        <div>
          <h3 className="mb-3 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latest Summary</h3>
          {latestLesson ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Current Slide:</span>
                <span style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--accent-green)' }}>{latestLesson.slide_reached || '—'}</span>
              </div>
              {latestLesson.lesson_notes && (
                <div>
                  <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Notes</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{latestLesson.lesson_notes}</div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>No lessons recorded yet.</p>
          )}
        </div>
      </div>

      {/* Lesson History Header */}
      <div className="flex justify-between items-center mb-4 mt-6">
        <h2>Lesson History</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add
        </button>
      </div>

      {/* Lesson List */}
      <div className="flex flex-col gap-4">
        {pastLessons.length === 0 ? (
          <div className="card text-center py-12" style={{ border: '1px dashed var(--border-color)', backgroundColor: 'transparent' }}>
            <Clipboard size={40} className="text-muted mb-3 mx-auto opacity-20" />
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontSize: '1.1rem' }}>No lesson history</h3>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Complete a lesson with {student.name} to see the history here.</p>
          </div>
        ) : (
          pastLessons.map((lesson) => (
            <LessonHistoryItem 
              key={lesson.id} 
              lesson={lesson} 
              onEdit={openEditModal} 
              onDelete={handleDelete} 
            />
          ))
        )}
      </div>

      {isModalOpen && (
        <LessonFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveLesson}
          studentId={student.id}
          initialData={editingLesson}
        />
      )}

      {isStudentFormOpen && (
        <StudentFormModal 
          isOpen={isStudentFormOpen}
          onClose={() => setIsStudentFormOpen(false)}
          onSave={handleSaveStudent}
          initialData={student}
        />
      )}
    </div>
  );
}
