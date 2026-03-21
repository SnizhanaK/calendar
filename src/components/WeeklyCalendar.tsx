import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, addDays, format, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Lesson } from '../types';
import BookingModal from './BookingModal';
import LessonFormModal from './LessonFormModal';

export default function WeeklyCalendar() {
  const navigate = useNavigate();
  const { lessons, students } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<{ day: Date; hour: number; minute: number } | null>(null);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  }, [startDate]);

  // Generate 30-minute slots from 11:00 to 21:00
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 11; hour <= 21; hour++) {
      slots.push({ hour, minute: 0 });
      if (hour < 21) slots.push({ hour, minute: 30 });
    }
    return slots;
  }, []);

  const handleSlotClick = (day: Date, hour: number, minute: number) => {
    setBookingSlot({ day, hour, minute });
    setIsBookingOpen(true);
  };

  const getTzLayout = (day: Date, hour: number, minute: number) => {
    // Georgia is UTC+4. We construct the true UTC representation of this scheduled slot:
    const utcDate = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hour - 4, minute));
    
    const ptFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit' });
    const uaFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit' });

    return {
      georgia: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      portugal: ptFormatter.format(utcDate),
      ukraine: uaFormatter.format(utcDate)
    };
  };

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="flex justify-between items-center" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <button className="btn-icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontWeight: 600 }}>
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </div>
        <button className="btn-icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '1000px' }}>
          {/* Header Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr)', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>GE</span>
              <span>PT</span>
              <span>UA</span>
            </div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} style={{ padding: '0.75rem 0', textAlign: 'center', fontWeight: 500, fontSize: '0.85rem' }}>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{format(day, 'EEE')}</div>
                <div>{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          {/* Grid Container with Borders */}
          <div style={{ display: 'flex', position: 'relative', border: '1px solid var(--border-color)', borderBottom: 'none' }}>
            
            {/* Time Axis Column */}
            <div style={{ width: '120px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              {timeSlots.map(({ hour, minute }) => {
                const tz = getTzLayout(weekDays[0], hour, minute);
                return (
                  <div key={`${hour}:${minute}`} style={{ height: '60px', backgroundColor: 'var(--bg-color)', padding: minute === 0 ? '6px 8px' : '2px 8px', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                    {minute === 0 ? (
                      <>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tz.georgia} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.7rem' }}>GE</span></div>
                        <div className="text-muted">{tz.portugal} <span style={{ fontSize: '0.65rem' }}>PT</span></div>
                        <div className="text-muted">{tz.ukraine} <span style={{ fontSize: '0.65rem' }}>UA</span></div>
                      </>
                    ) : (
                      <div className="text-muted" style={{ fontSize: '0.65rem', opacity: 0.5 }}>:30</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day Columns */}
            {weekDays.map((day) => {
              const dayLessons = lessons.filter(l => l.lesson_date && isSameDay(new Date(l.lesson_date), day));
                return (
                <div key={day.toISOString()} style={{ flex: 1, backgroundColor: 'var(--card-bg)', position: 'relative', minHeight: `${timeSlots.length * 60}px`, display: 'flex', flexDirection: 'column', borderRight: day === weekDays[6] ? 'none' : '1px solid var(--border-color)' }}>
                  
                  {/* Background Clickable Grid Slots */}
                  {timeSlots.map(({ hour, minute }) => (
                    <div 
                      key={`${hour}:${minute}`} 
                      style={{ height: '60px', width: '100%', cursor: 'pointer', backgroundColor: 'var(--card-bg)', borderBottom: minute === 0 ? '1px dashed var(--border-color)' : '1px solid var(--border-color)', opacity: minute === 30 ? 1 : 0.8 }}
                      className="calendar-slot"
                      onClick={() => handleSlotClick(day, hour, minute)}
                    />
                  ))}

                  {/* Absolute Positioned Lessons */}
                  {(() => {
                    // Logic to handle overlaps
                    const sortedLessons = [...dayLessons].sort((a, b) => {
                      const [ah, am] = a.lesson_time.split(':').map(Number);
                      const [bh, bm] = b.lesson_time.split(':').map(Number);
                      return (ah * 60 + am) - (bh * 60 + bm);
                    });

                    const getMinutes = (timeStr: string) => {
                      const [h, m] = timeStr.split(':').map(Number);
                      return h * 60 + m;
                    };

                    const getEndTimeStr = (lesson: Lesson) => {
                      if (lesson.lesson_end_time) return lesson.lesson_end_time;
                      const [h, m] = lesson.lesson_time.split(':').map(Number);
                      const total = h * 60 + m + 50;
                      return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
                    };

                    // Grouping logic: find blocks of overlapping lessons
                    const groups: Lesson[][] = [];
                    sortedLessons.forEach(lesson => {
                      let added = false;
                      for (const group of groups) {
                        const overlaps = group.some(gLesson => {
                          const startA = getMinutes(lesson.lesson_time);
                          const endA = getMinutes(getEndTimeStr(lesson));
                          const startB = getMinutes(gLesson.lesson_time);
                          const endB = getMinutes(getEndTimeStr(gLesson));
                          return startA < endB && startB < endA;
                        });
                        if (overlaps) {
                          group.push(lesson);
                          added = true;
                          break;
                        }
                      }
                      if (!added) groups.push([lesson]);
                    });

                    return groups.map(group => {
                      return group.map((lesson, idx) => {
                        const student = students.find(s => s.id === lesson.student_id);
                        const [sH, sM] = lesson.lesson_time.split(':').map(Number);
                        const topPixels = (sH - 11) * 120 + sM * 2;
                        
                        let durationMins = 50; 
                        if (lesson.lesson_end_time) {
                          const [eH, eM] = lesson.lesson_end_time.split(':').map(Number);
                          durationMins = (eH * 60 + eM) - (sH * 60 + sM);
                          if (durationMins <= 0) durationMins = 50; 
                        }
                        const heightPixels = durationMins * 2;

                        const widthPercent = 100 / group.length;
                        const leftPercent = idx * widthPercent;

                        return (
                          <div 
                            key={lesson.id}
                            style={{
                              position: 'absolute',
                              top: `${topPixels}px`, // Fixed backticks here
                              height: `${heightPixels}px`, // Fixed backticks here
                              left: `${leftPercent}%`, // Fixed backticks here
                              width: `${widthPercent - 1}%`, // Fixed backticks here
                              backgroundColor: 'rgba(99, 122, 95, 0.1)',
                              borderLeft: '3px solid var(--accent-green)',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              color: 'var(--text-main)',
                              overflow: 'hidden',
                              zIndex: 10,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                            onClick={() => navigate(`/student/${student?.id}`)}
                            title={`Go to ${student?.name}'s profile`}
                          >
                            <strong style={{ display: 'block' }}>{lesson.lesson_time} - {lesson.lesson_end_time || '??'}</strong>
                            <div style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{student?.name || 'Unknown'}</div>
                            <div 
                              className="flex items-center justify-center" 
                              style={{ position: 'absolute', bottom: '2px', right: '2px', backgroundColor: 'var(--accent-green)', color: 'white', borderRadius: '4px', width: '20px', height: '20px', fontSize: '0.65rem', opacity: 0.8 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLesson(lesson);
                                setIsEditOpen(true);
                              }}
                              title="Edit Lesson"
                            >
                              ✎
                            </div>
                          </div>
                        );
                      });
                    });
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`
        .calendar-slot:hover {
          background-color: var(--bg-color) !important;
        }
      `}</style>
      {isBookingOpen && bookingSlot && (
        <BookingModal 
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
          prefilledSlot={bookingSlot} 
        />
      )}
      {isEditOpen && editingLesson && (
        <LessonFormModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={(lessonData, updateSeries) => {
            useStore.getState().editLesson(editingLesson.id, lessonData, updateSeries);
            setIsEditOpen(false);
          }}
          studentId={editingLesson.student_id}
          initialData={editingLesson}
        />
      )}
    </div>
  );
}
