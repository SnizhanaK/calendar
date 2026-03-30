import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Student, Lesson, CustomField } from '../types';

export interface AppState {
  theme: 'light' | 'dark';
  students: Student[];
  lessons: Lesson[];
  customFields: CustomField[];
  lastBackupAt?: string;
  toggleTheme: () => void;
  setLastBackupAt: (date: string) => void;
  addStudent: (student: Omit<Student, 'id'>) => string;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string, onDeleted?: (student: Student, lessons: Lesson[]) => void) => void;
  restoreStudent: (student: Student, lessons: Lesson[]) => void;
  addLesson: (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) => void;
  addRecurringLesson: (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>, weeks: number) => void;
  editLesson: (id: string, updates: Partial<Lesson>, updateSeries?: boolean) => void;
  deleteLesson: (id: string, onDeleted?: (lesson: Lesson) => void) => void;
  restoreLesson: (lesson: Lesson) => void;
  addCustomField: (label: string) => void;
  toggleCustomFieldVisibility: (id: string) => void;
  removeCustomField: (id: string) => void;
}

const defaultStudents: Student[] = [];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      students: defaultStudents,
      lessons: [],
      customFields: [],
      lastBackupAt: undefined,
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setLastBackupAt: (date) => set({ lastBackupAt: date }),
      addStudent: (studentData) => {
        const id = uuidv4();
        const newStudent = { ...studentData, id };
        set((state) => ({ students: [...state.students, newStudent] }));
        return id;
      },
      updateStudent: (id, updates) => set((state) => ({
        students: state.students.map((student) => 
          student.id === id ? { ...student, ...updates } : student
        )
      })),
      deleteStudent: (id, onDeleted) => set((state) => {
        const student = state.students.find(s => s.id === id);
        const relatedLessons = state.lessons.filter(l => l.student_id === id);
        if (student && onDeleted) onDeleted(student, relatedLessons);
        return {
          students: state.students.filter(s => s.id !== id),
          lessons: state.lessons.filter(l => l.student_id !== id)
        };
      }),
      restoreStudent: (student, lessons) => set((state) => ({
        students: [...state.students, student],
        lessons: [...state.lessons, ...lessons]
      })),
      addLesson: (lessonData) => set((state) => {
        const newLesson: Lesson = {
          ...lessonData,
          id: uuidv4(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          custom_fields: lessonData.custom_fields || {},
        };
        return { lessons: [...state.lessons, newLesson] };
      }),
      addRecurringLesson: (lessonData, weeks) => set((state) => {
        const seriesId = uuidv4();
        const newLessons: Lesson[] = [];
        const startDate = new Date(lessonData.lesson_date);

        for (let i = 0; i < weeks; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + (i * 7));
          
          newLessons.push({
            ...lessonData,
            id: uuidv4(),
            lesson_date: currentDate.toISOString().split('T')[0],
            recurringId: seriesId,
            isRecurring: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            custom_fields: lessonData.custom_fields || {},
          });
        }
        return { lessons: [...state.lessons, ...newLessons] };
      }),
      editLesson: (id, updates, updateSeries) => set((state) => {
        const lessonToEdit = state.lessons.find(l => l.id === id);
        if (!lessonToEdit) return state;

        if (updateSeries && lessonToEdit.recurringId) {
          let dateDelta = 0;
          if (updates.lesson_date) {
            const oldD = new Date(lessonToEdit.lesson_date).getTime();
            const newD = new Date(updates.lesson_date).getTime();
            dateDelta = Math.round((newD - oldD) / (1000 * 60 * 60 * 24));
          }

          return {
            lessons: state.lessons.map((lesson) => {
              if (lesson.recurringId !== lessonToEdit.recurringId) return lesson;
              
              const newUpdates = { ...updates };
              if (dateDelta !== 0) {
                const currentD = new Date(lesson.lesson_date);
                currentD.setDate(currentD.getDate() + dateDelta);
                newUpdates.lesson_date = currentD.toISOString().split('T')[0];
              }
              
              return { ...lesson, ...newUpdates, updated_at: new Date().toISOString() };
            })
          };
        }

        return {
          lessons: state.lessons.map((lesson) => 
            lesson.id === id 
              ? { ...lesson, ...updates, isRecurring: updateSeries ? lesson.isRecurring : false, recurringId: updateSeries ? lesson.recurringId : undefined, updated_at: new Date().toISOString() } 
              : lesson
          )
        };
      }),
      deleteLesson: (id, onDeleted) => set((state) => {
        const lesson = state.lessons.find(l => l.id === id);
        if (lesson && onDeleted) onDeleted(lesson);
        return {
          lessons: state.lessons.filter((l) => l.id !== id)
        };
      }),
      restoreLesson: (lesson) => set((state) => ({
        lessons: [...state.lessons, lesson]
      })),
      addCustomField: (label) => set((state) => ({
        customFields: [...state.customFields, { id: uuidv4(), label, isVisible: true }]
      })),
      toggleCustomFieldVisibility: (id) => set((state) => ({
        customFields: state.customFields.map((field) => 
          field.id === id ? { ...field, isVisible: !field.isVisible } : field
        )
      })),
      removeCustomField: (id) => set((state) => ({
        customFields: state.customFields.filter((field) => field.id !== id)
      })),
    }),
    {
      name: 'crm-storage',
      version: 2,
      migrate: (persistedState: unknown) => {
        const s = (persistedState as Partial<AppState>) || {};
        return {
          theme: s.theme ?? ('light' as const),
          students: s.students ?? [],
          lessons: s.lessons ?? [],
          customFields: s.customFields ?? [],
          lastBackupAt: s.lastBackupAt ?? undefined,
        };
      },
    }
  )
);
