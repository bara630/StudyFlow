import type { Flashcard, PlannerSession, QuizQuestion, StudyNote } from '../types/study';

interface TaskLike {
  title: string;
  dueDate?: string;
  completed: boolean;
}

interface ExamLike {
  courseName: string;
  examDate: string;
}

const dateKey = (d: Date) => {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const addDays = (base: Date, n: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};

const parseLocal = (value: string) => {
  const [y, m, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, day);
};

/** Split a big assignment into smaller actionable steps. */
export const breakdownTask = (title: string): string[] => {
  const t = title.toLowerCase();
  if (t.includes('essay') || t.includes('paper') || t.includes('write')) {
    return [
      `Research topic for: ${title}`,
      `Outline structure for: ${title}`,
      `Write first draft: ${title}`,
      `Edit and proofread: ${title}`,
    ];
  }
  if (t.includes('exam') || t.includes('test') || t.includes('quiz')) {
    return [
      `Review notes for: ${title}`,
      `Practice questions: ${title}`,
      `Weak areas review: ${title}`,
      `Final recap: ${title}`,
    ];
  }
  if (t.includes('project') || t.includes('presentation')) {
    return [
      `Plan requirements: ${title}`,
      `Gather materials: ${title}`,
      `Build main work: ${title}`,
      `Polish and submit: ${title}`,
    ];
  }
  if (t.includes('read') || t.includes('chapter')) {
    return [
      `Skim headings for: ${title}`,
      `Read and highlight: ${title}`,
      `Summarize key points: ${title}`,
      `Quiz yourself on: ${title}`,
    ];
  }
  return [
    `Clarify goal: ${title}`,
    `Do focused work (25 min): ${title}`,
    `Check quality: ${title}`,
    `Finish and review: ${title}`,
  ];
};

/** Spread revision sessions before each upcoming exam. */
export const buildStudyPlan = (exams: ExamLike[]): PlannerSession[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessions: PlannerSession[] = [];

  for (const exam of exams) {
    const examDay = parseLocal(exam.examDate);
    const daysLeft = Math.ceil((examDay.getTime() - today.getTime()) / 86400000);
    if (daysLeft < 0) continue;

    const sessionCount = Math.min(5, Math.max(2, Math.floor(daysLeft / 2)));
    for (let i = 0; i < sessionCount; i++) {
      const offset = Math.floor((daysLeft * (i + 1)) / (sessionCount + 1));
      const sessionDate = addDays(today, Math.max(0, offset));
      if (sessionDate >= examDay) continue;
      const labels = ['Overview & notes', 'Practice problems', 'Active recall', 'Weak topics', 'Final review'];
      sessions.push({
        date: dateKey(sessionDate),
        label: labels[i] || 'Study session',
        subject: exam.courseName,
        minutes: 25 * (i === sessionCount - 1 ? 2 : 1),
      });
    }
  }

  return sessions.sort((a, b) => a.date.localeCompare(b.date));
};

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Build a multiple-choice quiz from flashcards (rule-based, no API key). */
export const generateQuiz = (cards: Flashcard[], notes: StudyNote[]): QuizQuestion[] => {
  const pool = [
    ...cards.map(c => ({ q: c.front, a: c.back })),
    ...notes.filter(n => n.content.trim()).map(n => ({
      q: `What is the main idea of "${n.title}"?`,
      a: n.content.slice(0, 120),
    })),
  ].filter(p => p.q.trim() && p.a.trim());

  if (pool.length === 0) return [];

  const picked = shuffle(pool).slice(0, Math.min(5, pool.length));
  const allAnswers = pool.map(p => p.a);

  return picked.map((item, idx) => {
    const wrong = shuffle(allAnswers.filter(a => a !== item.a)).slice(0, 3);
    const options = shuffle([item.a, ...wrong]);
    return {
      id: `q-${idx}`,
      question: item.q,
      options,
      correctIndex: options.indexOf(item.a),
      explanation: `Correct answer relates to: ${item.a.slice(0, 80)}${item.a.length > 80 ? '…' : ''}`,
    };
  });
};

export const weeklyStats = (tasks: TaskLike[], exams: ExamLike[], streak: number) => {
  const today = new Date();
  const weekStart = addDays(today, -6);
  const weekStartKey = dateKey(weekStart);

  const completedThisWeek = tasks.filter(t => {
    if (!t.completed || !t.dueDate) return false;
    return t.dueDate.slice(0, 10) >= weekStartKey;
  }).length;

  const pending = tasks.filter(t => !t.completed).length;
  const upcomingExams = exams.filter(e => parseLocal(e.examDate) >= today).length;

  const byDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = dateKey(addDays(today, -6 + i));
    byDay[d] = tasks.filter(t => !t.completed && t.dueDate?.slice(0, 10) === d).length;
  }
  const busiest = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

  return {
    completedThisWeek,
    pending,
    upcomingExams,
    streak,
    busiestDay: busiest?.[1] ? busiest[0] : null,
    busiestCount: busiest?.[1] || 0,
  };
};
