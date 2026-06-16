import type { Flashcard, StudyNote, Subject } from '../types/study';

const key = (userId: number, type: string) => `studyflow_${type}_${userId}`;

export const loadSubjects = (userId: number): Subject[] =>
  JSON.parse(localStorage.getItem(key(userId, 'subjects')) || '[]');

export const saveSubjects = (userId: number, subjects: Subject[]) =>
  localStorage.setItem(key(userId, 'subjects'), JSON.stringify(subjects));

export const loadFlashcards = (userId: number): Flashcard[] =>
  JSON.parse(localStorage.getItem(key(userId, 'flashcards')) || '[]');

export const saveFlashcards = (userId: number, cards: Flashcard[]) =>
  localStorage.setItem(key(userId, 'flashcards'), JSON.stringify(cards));

export const loadNotes = (userId: number): StudyNote[] =>
  JSON.parse(localStorage.getItem(key(userId, 'notes')) || '[]');

export const saveNotes = (userId: number, notes: StudyNote[]) =>
  localStorage.setItem(key(userId, 'notes'), JSON.stringify(notes));

export const SUBJECT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
];
