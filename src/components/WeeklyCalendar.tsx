import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, addDays, format, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Lesson } from '../types';
import BookingModal from './BookingModal';
import LessonFormModal from './LessonFormModal';

// Pixel height per minute – controls total calendar height
const PX_PER_MIN = 1.2; // 60 min slot = 72px  (was 2px = 120px)
const SLOT_HEIGHT = 30 * PX_PER_MIN; // 30-min slot

// Default visible range: 11:00 – 21:00.  Shrinks/grows based on actual lessons.
const DEFAULT_START_HOUR = 11;
const DEFAULT_END_HOUR = 21;

function getMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTop(totalMin: number, startMin: number) {
  return (totalMin - startMin) * PX_PER_MIN;
}

export default function WeeklyCalendar() {
  const navigate = useNavigate();
  const { lessons, students } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<{ day: Date; hour: number; minute: number } | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }).map((_, i) => addDays(startDate, i)),
  [startDate]);

  // ── Dynamic range ──────────────────────────────────────────────────────────
  // Compute visible hour range based on this week's lessons so the calendar is
  // never taller than necessary.
  const { visibleStartMin, visibleEndMin } = useMemo(() => {
    const weekLessons = lessons.filter(l =>
      l.lesson_date && weekDays.some(day => isSameDay(new Date(l.lesson_date), day))
    );

    if (weekLessons.length === 0) {
      return {
        visibleStartMin: DEFAULT_START_HOUR * 60,
        visibleEndMin: DEFAULT_END_HOUR * 60,
      };
    }

    const getEndMins = (l: Lesson) => {
      if (l.lesson_end_time) return getMinutes(l.lesson_end_time);
      return getMinutes(l.lesson_time) + 50;
    };

    const earliest = Math.min(...weekLessons.map(l => getMinutes(l.lesson_time)));
    const latest   = Math.max(...weekLessons.map(getEndMins));

    return {
      visibleStartMin: Math.min(earliest - 30, DEFAULT_START_HOUR * 60), // 30-min buffer before
      visibleEndMin:   Math.max(latest + 30, DEFAULT_END_HOUR * 60),     // 30-min buffer after
    };
  }, [lessons, weekDays]);

  // Generate 30-minute slots within the visible range
  const timeSlots = useMemo(() => {
    const slots: { hour: number; minute: number }[] = [];
    for (let min = visibleStartMin; min < visibleEndMin; min += 30) {
      slots.push({ hour: Math.floor(min / 60), minute: min % 60 });
    }
    return slots;
  }, [visibleStartMin, visibleEndMin]);

  // ── Per-day lesson groups (memoized) ──────────────────────────────────────
  const dayLessonGroups = useMemo(() => {
    return weekDays.map(day => {
      const dayLessons = lessons.filter(l =>
        l.lesson_date && isSameDay(new Date(l.lesson_date), day)
      );

      const sorted = [...dayLessons].sort((a, b) =>
        getMinutes(a.lesson_time) - getMinutes(b.lesson_time)
      );

      const getEndMins = (l: Lesson) => {
        if (l.lesson_end_time) return getMinutes(l.lesson_end_time);
        return getMinutes(l.lesson_time) + 50;
      };

      // Group overlapping lessons side-by-side
      const groups: Lesson[][] = [];
      sorted.forEach(lesson => {
        let placed = false;
        for (const group of groups) {
          const overlaps = group.some(gl => {
            const sA = getMinutes(lesson.lesson_time), eA = getEndMins(lesson);
            const sB = getMinutes(gl.lesson_time),    eB = getEndMins(gl);
            return sA < eB && sB < eA;
          });
          if (overlaps) { group.push(lesson); placed = true; break; }
        }
        if (!placed) groups.push([lesson]);
      });

      return { day, groups, getEndMins };
    });
  }, [lessons, weekDays]);

  // ── Timezone helpers (computed once per render, not per cell) ─────────────
  const ptFormatter = useMemo(() => new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit'
  }), []);
  const uaFormatter = useMemo(() => new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit'
  }), []);

  const getTzLabel = useCallback((day: Date, hour: number, minute: number) => {
    const utcDate = new Date(Date.UTC(
      day.getFullYear(), day.getMonth(), day.getDate(), hour - 4, minute
    ));
    return { portugal: ptFormatter.format(utcDate), ukraine: uaFormatter.format(utcDate) };
  }, [ptFormatter, uaFormatter]);

  const handleSlotClick = useCallback((day: Date, hour: number, minute: number) => {
    setBookingSlot({ day, hour, minute });
    setIsBookingOpen(true);
  }, []);

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      {/* Header nav */}
      <div className="flex justify-between items-center" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <button className="btn-icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
          {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
        </div>
        <button className="btn-icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '720px' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ padding: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '1px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>GE</span>
              <span>PT · UA</span>
            </div>
            {weekDays.map(day => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} style={{ padding: '0.5rem 0', textAlign: 'center', fontWeight: 500, fontSize: '0.82rem' }}>
                  <div className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{format(day, 'EEE')}</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '26px', height: '26px', borderRadius: '50%', margin: '2px auto 0',
                    backgroundColor: isToday ? 'var(--accent-green)' : 'transparent',
                    color: isToday ? '#fff' : 'inherit',
                    fontWeight: isToday ? 700 : 500,
                  }}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid body */}
          <div style={{ display: 'flex', position: 'relative', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
            {/* Time axis */}
            <div style={{ width: '72px', flexShrink: 0 }}>
              {timeSlots.map(({ hour, minute }) => {
                const tz = minute === 0 ? getTzLabel(weekDays[0], hour, minute) : null;
                return (
                  <div
                    key={`${hour}:${minute}`}
                    style={{
                      height: `${SLOT_HEIGHT}px`,
                      backgroundColor: 'var(--bg-color)',
                      padding: '3px 6px',
                      fontSize: '0.68rem',
                      borderBottom: '1px solid var(--border-color)',
                      borderRight: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      gap: '1px',
                    }}
                  >
                    {minute === 0 ? (
                      <>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                          {hour.toString().padStart(2, '0')}:00
                        </span>
                        {tz && (
                          <span className="text-muted" style={{ fontSize: '0.62rem', lineHeight: 1.2 }}>
                            {tz.portugal} · {tz.ukraine}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.6rem', opacity: 0.4 }}>:30</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {dayLessonGroups.map(({ day, groups, getEndMins }) => {
              const totalHeight = timeSlots.length * SLOT_HEIGHT;
              return (
                <div
                  key={day.toISOString()}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--card-bg)',
                    position: 'relative',
                    height: `${totalHeight}px`,
                    borderRight: '1px solid var(--border-color)',
                  }}
                >
                  {/* Clickable time slots */}
                  {timeSlots.map(({ hour, minute }) => (
                    <div
                      key={`${hour}:${minute}`}
                      className="calendar-slot"
                      style={{
                        height: `${SLOT_HEIGHT}px`,
                        width: '100%',
                        cursor: 'pointer',
                        borderBottom: `1px ${minute === 0 ? 'dashed' : 'solid'} var(--border-color)`,
                      }}
                      onClick={() => handleSlotClick(day, hour, minute)}
                    />
                  ))}

                  {/* Lesson event blocks */}
                  {groups.map(group =>
                    group.map((lesson, idx) => {
                      const student = students.find(s => s.id === lesson.student_id);
                      const startMins = getMinutes(lesson.lesson_time);
                      const endMins   = getEndMins(lesson);
                      const top    = minutesToTop(startMins, visibleStartMin);
                      const height = Math.max((endMins - startMins) * PX_PER_MIN, 20);
                      const widthPct = 100 / group.length;
                      const leftPct  = idx * widthPct;

                      return (
                        <div
                          key={lesson.id}
                          style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `${leftPct}%`,
                            width: `${widthPct - 0.5}%`,
                            backgroundColor: 'rgba(99,122,95,0.12)',
                            borderLeft: '3px solid var(--accent-green)',
                            padding: '3px 5px',
                            borderRadius: '3px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            color: 'var(--text-main)',
                            overflow: 'hidden',
                            zIndex: 10,
                            boxSizing: 'border-box',
                          }}
                          onClick={() => navigate(`/student/${student?.id}`)}
                          title={`${student?.name} — click to open profile`}
                        >
                          <strong style={{ display: 'block', lineHeight: 1.3 }}>
                            {lesson.lesson_time}
                            {lesson.lesson_end_time ? `–${lesson.lesson_end_time}` : ''}
                          </strong>
                          <div style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', lineHeight: 1.3 }}>
                            {student?.name || 'Unknown'}
                          </div>
                          {/* Edit pencil */}
                          <div
                            style={{
                              position: 'absolute', bottom: '2px', right: '2px',
                              backgroundColor: 'var(--accent-green)', color: '#fff',
                              borderRadius: '3px', width: '16px', height: '16px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.6rem', opacity: 0.85,
                            }}
                            onClick={e => {
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
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .calendar-slot:hover { background-color: rgba(125,140,122,0.06) !important; }
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
