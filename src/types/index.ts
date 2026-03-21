export type StudentStatus = 'Active' | 'Inactive';
export type StudentLanguage = 'Ukrainian' | 'Russian';

export interface Student {
  id: string;
  name: string;
  language: StudentLanguage;
  price: string;
  contact_info?: string;
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
  created_at: string;
  updated_at: string;
}
