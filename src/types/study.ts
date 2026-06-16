export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface Flashcard {
  id: string;
  subjectId?: string;
  front: string;
  back: string;
}

export interface StudyNote {
  id: string;
  subjectId?: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PlannerSession {
  date: string;
  label: string;
  subject: string;
  minutes: number;
}
