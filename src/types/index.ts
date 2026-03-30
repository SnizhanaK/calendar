export type StudentStatus = 'Active' | 'Inactive';
export type StudentLanguage = 'Ukrainian' | 'Russian';

export interface Student {
  id: string;
  name: string;
  language: StudentLanguage;
  price: string;
  contact_info?: string;
  goals?: string;
  pinnedNotes?: string;
  general_notes?: string;
  status: StudentStatus;
}

export interface CustomField {
  id: string;
  label: string;
  isVisible: boolean;
}

export interface Lesson {
  id: string;
  student_id: string;
  lesson_date: string;
  lesson_time: string;
  lesson_end_time?: string;
  lesson_price: string;
  slide_reached: string;
  lesson_notes: string;
  homework: string;
  next_material_notes: string;
  custom_fields: Record<string, string>;
  recurringId?: string; // Links occurrences to a series
  isRecurring?: boolean;
  created_at: string;
  updated_at: string;
}
export interface CalendarNote {
  id: string;
  date: string;
  time: string;
  endTime?: string;
  text: string;
  created_at: string;
  updated_at: string;
}
