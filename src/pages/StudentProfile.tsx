import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
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
        className="flex justify-between items-start" 
        style={{ 
          padding: '1rem', 
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
          backgroundColor: isExpanded ? 'var(--bg-color)' : 'transparent'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>
              {new Date(lesson.lesson_date).toLocaleDateString()}
              {lesson.lesson_time && <span className="text-muted" style={{ fontWeight: 400, marginLeft: '8px' }}>@ {lesson.lesson_time}</span>}
            </div>
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
              Slide: {lesson.slide_reached || 'N/A'} {lesson.lesson_price && lesson.lesson_price !== '0' && ` • Price: ${lesson.lesson_price}`}
            </div>
          </div>
        </div>
        
        {/* Actions (stop propagation to avoid expanding/collapsing when clicking buttons) */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="btn-icon text-muted" onClick={() => onEdit(lesson)} title="Edit">
            <Edit2 size={16} />
          </button>
          <button className="btn-icon" style={{ color: '#d9534f' }} onClick={() => onDelete(lesson.id)} title="Delete">
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
  const { students, lessons, addLesson, editLesson, deleteLesson, updateStudent, deleteStudent } = useStore();
  
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

  const latestLesson = studentLessons[0];

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
    if (window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      deleteLesson(lessonId);
    }
  };

  const handleStudentDelete = () => {
    if (window.confirm(`Are you sure you want to completely delete ${student.name} AND all of their lesson history? This action cannot be undone.`)) {
      deleteStudent(student.id);
      navigate('/');
    }
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
      <div className="card mb-6">
        <div className="flex flex-col gap-4" style={{ paddingBottom: '0.5rem' }}>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Language</span>
              <strong>{student.language}</strong>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Status</span>
              <span style={{ 
                color: student.status === 'Active' ? 'var(--accent-green)' : 'var(--text-muted)',
                fontWeight: 600
              }}>{student.status}</span>
            </div>
          </div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Contact Info</span>
              <span>{student.contact_info || <span className="text-muted italic">Not specified</span>}</span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Default Price</span>
              <strong>{student.price || '0'}</strong>
            </div>
          </div>
          {student.general_notes && (
            <div className="mt-2 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <span className="text-muted block mb-1" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>General Notes</span>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{student.general_notes}</div>
            </div>
          )}

          <div className="flex gap-2 mt-2 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-ghost" onClick={() => setIsStudentFormOpen(true)} style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}>
              <Edit2 size={16} /> Edit profile
            </button>
            <button className="btn btn-ghost" onClick={handleStudentDelete} style={{ color: '#d9534f', fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}>
              <Trash2 size={16} /> Delete student
            </button>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div>
          <h3 className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>Latest Summary</h3>
          {latestLesson ? (
            <div className="flex flex-col gap-3" style={{ fontSize: '0.95rem' }}>
              {(latestLesson.lesson_notes || latestLesson.next_material_notes || latestLesson.slide_reached) ? (
                <>
                  {latestLesson.slide_reached && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Current Slide:</span>
                      <strong style={{ fontWeight: 500 }}>{latestLesson.slide_reached}</strong>
                    </div>
                  )}
                  {latestLesson.lesson_notes && (
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Lesson Notes</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{latestLesson.lesson_notes}</div>
                    </div>
                  )}
                  {latestLesson.next_material_notes && (
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Next Session</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{latestLesson.next_material_notes}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted italic" style={{ fontSize: '0.85rem' }}>No annotations / notes saved for the latest lesson.</div>
              )}
            </div>
          ) : (
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>No lessons recorded yet.</p>
          )}
        </div>
      </div>

      {/* Lesson History Header */}
      <div className="flex justify-between items-center mb-4">
        <h2>Lesson History</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add
        </button>
      </div>

      {/* Lesson List */}
      <div className="flex flex-col gap-4">
        {studentLessons.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: '2rem' }}>
            <p>No lessons found for {student.name}.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Click "Add" to create the first record.</p>
          </div>
        ) : (
          studentLessons.map((lesson) => (
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
