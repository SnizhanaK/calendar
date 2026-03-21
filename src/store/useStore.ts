import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Student, Lesson, CustomField } from '../types';

export interface AppState {
  theme: 'light' | 'dark';
  students: Student[];
  lessons: Lesson[];
  customFields: CustomField[];
  toggleTheme: () => void;
  addStudent: (student: Omit<Student, 'id'>) => string;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addLesson: (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) => void;
  editLesson: (id: string, updates: Partial<Lesson>) => void;
  deleteLesson: (id: string) => void;
  addCustomField: (label: string) => void;
  toggleCustomFieldVisibility: (id: string) => void;
  removeCustomField: (id: string) => void;
}

const defaultStudents: Student[] = [
  { id: uuidv4(), name: 'Artur', language: 'Ukrainian', price: '0', status: 'Active' },
  { id: uuidv4(), name: 'Vladyslav U.', language: 'Ukrainian', price: '0', status: 'Active' },
  { id: uuidv4(), name: 'Kate C.', language: 'Ukrainian', price: '0', status: 'Active' },
  { id: uuidv4(), name: 'Oksana S.', language: 'Ukrainian', price: '0', status: 'Active' },
  { id: uuidv4(), name: 'Vlad K.', language: 'Ukrainian', price: '0', status: 'Active' },
  { id: uuidv4(), name: 'Nataliia M.', language: 'Ukrainian', price: '0', status: 'Active' },
  { id: uuidv4(), name: 'Yury M.', language: 'Ukrainian', price: '0', status: 'Inactive' },
  { id: uuidv4(), name: 'Anita', language: 'Ukrainian', price: '0', status: 'Inactive' },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      students: defaultStudents,
      lessons: [],
      customFields: [],
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
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
      deleteStudent: (id) => set((state) => ({
        students: state.students.filter(student => student.id !== id),
        lessons: state.lessons.filter(lesson => lesson.student_id !== id)
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
      editLesson: (id, updates) => set((state) => ({
        lessons: state.lessons.map((lesson) => 
          lesson.id === id 
            ? { ...lesson, ...updates, updated_at: new Date().toISOString() } 
            : lesson
        )
      })),
      deleteLesson: (id) => set((state) => ({
        lessons: state.lessons.filter((lesson) => lesson.id !== id)
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
    }
  )
);
