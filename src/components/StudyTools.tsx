import { useEffect, useState } from 'react';
import {
  BookOpen, Layers, StickyNote, BarChart3, CalendarDays, Wand2, HelpCircle,
  Plus, Trash2, X, ChevronLeft, ChevronRight, RotateCcw,
} from 'lucide-react';
import type { Flashcard, PlannerSession, QuizQuestion, StudyNote, Subject } from '../types/study';
import {
  loadFlashcards, loadNotes, loadSubjects, saveFlashcards, saveNotes, saveSubjects, SUBJECT_COLORS,
} from '../utils/studyStorage';
import { breakdownTask, buildStudyPlan, generateQuiz, weeklyStats } from '../utils/studyAI';

interface Task {
  id: number;
  title: string;
  dueDate?: string;
  completed: boolean;
}

interface Exam {
  courseName: string;
  examDate: string;
}

interface StudyToolsProps {
  userId: number;
  tasks: Task[];
  exams: Exam[];
  streak: number;
  onAddSubtasks: (steps: string[], dueDate: string) => Promise<void>;
}

type Tab = 'subjects' | 'flashcards' | 'notes' | 'analytics' | 'planner' | 'breakdown' | 'quiz';

const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'analytics', label: 'Weekly Report', icon: BarChart3 },
  { id: 'planner', label: 'Study Planner', icon: CalendarDays },
  { id: 'breakdown', label: 'Task Breakdown', icon: Wand2 },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
];

export default function StudyTools({ userId, tasks, exams, streak, onAddSubtasks }: StudyToolsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('subjects');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);

  const [newSubject, setNewSubject] = useState('');
  const [fcFront, setFcFront] = useState('');
  const [fcBack, setFcBack] = useState('');
  const [fcSubjectId, setFcSubjectId] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubjectId, setNoteSubjectId] = useState('');

  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const [breakdownTitle, setBreakdownTitle] = useState('');
  const [breakdownSteps, setBreakdownSteps] = useState<string[]>([]);
  const [plan, setPlan] = useState<PlannerSession[]>([]);

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    setSubjects(loadSubjects(userId));
    setFlashcards(loadFlashcards(userId));
    setNotes(loadNotes(userId));
  }, [userId]);

  const persistSubjects = (next: Subject[]) => {
    setSubjects(next);
    saveSubjects(userId, next);
  };

  const persistFlashcards = (next: Flashcard[]) => {
    setFlashcards(next);
    saveFlashcards(userId, next);
  };

  const persistNotes = (next: StudyNote[]) => {
    setNotes(next);
    saveNotes(userId, next);
  };

  const addSubject = () => {
    if (!newSubject.trim()) return;
    const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    persistSubjects([...subjects, { id: crypto.randomUUID(), name: newSubject.trim(), color }]);
    setNewSubject('');
  };

  const addFlashcard = () => {
    if (!fcFront.trim() || !fcBack.trim()) return;
    persistFlashcards([
      ...flashcards,
      { id: crypto.randomUUID(), front: fcFront.trim(), back: fcBack.trim(), subjectId: fcSubjectId || undefined },
    ]);
    setFcFront('');
    setFcBack('');
  };

  const addNote = () => {
    if (!noteTitle.trim()) return;
    persistNotes([
      ...notes,
      {
        id: crypto.randomUUID(),
        title: noteTitle.trim(),
        content: noteContent,
        subjectId: noteSubjectId || undefined,
        updatedAt: new Date().toISOString(),
      },
    ]);
    setNoteTitle('');
    setNoteContent('');
  };

  const runBreakdown = () => {
    if (!breakdownTitle.trim()) return;
    setBreakdownSteps(breakdownTask(breakdownTitle.trim()));
  };

  const runPlanner = () => setPlan(buildStudyPlan(exams));

  const startQuiz = () => {
    const q = generateQuiz(flashcards, notes);
    setQuiz(q);
    setQuizIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizDone(q.length === 0);
  };

  const answerQuiz = (idx: number) => {
    if (selectedOption !== null || quizDone) return;
    setSelectedOption(idx);
    if (idx === quiz[quizIndex].correctIndex) setQuizScore(s => s + 1);
  };

  const nextQuiz = () => {
    if (quizIndex + 1 >= quiz.length) {
      setQuizDone(true);
      return;
    }
    setQuizIndex(i => i + 1);
    setSelectedOption(null);
  };

  const stats = weeklyStats(tasks, exams, streak);
  const studyCards = flashcards.length ? flashcards : [];
  const currentCard = studyCards[studyIndex];

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 mt-6 transition-all hover:border-violet-500/30">
      <h2 className="text-xl font-semibold mb-4">Study Tools</h2>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? 'bg-violet-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Subjects */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              placeholder="Subject name (Math, Biology...)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={addSubject} className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-semibold">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.length === 0 && <p className="text-slate-500 text-sm">No subjects yet.</p>}
            {subjects.map(s => (
              <span
                key={s.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-white"
                style={{ backgroundColor: `${s.color}33`, border: `1px solid ${s.color}` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
                <button onClick={() => persistSubjects(subjects.filter(x => x.id !== s.id))} className="opacity-70 hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Flashcards */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select value={fcSubjectId} onChange={e => setFcSubjectId(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm">
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input value={fcFront} onChange={e => setFcFront(e.target.value)} placeholder="Front (question)" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
            <input value={fcBack} onChange={e => setFcBack(e.target.value)} placeholder="Back (answer)" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={addFlashcard} className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-semibold">Add Card</button>

          {studyCards.length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-center">
              <p className="text-xs text-slate-500 mb-2">Card {studyIndex + 1} / {studyCards.length}</p>
              <button onClick={() => setFlipped(!flipped)} className="w-full min-h-[100px] flex items-center justify-center text-lg">
                {flipped ? currentCard.back : currentCard.front}
              </button>
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={() => { setStudyIndex(i => Math.max(0, i - 1)); setFlipped(false); }} className="p-2 bg-slate-800 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setFlipped(!flipped)} className="p-2 bg-slate-800 rounded-lg"><RotateCcw className="w-4 h-4" /></button>
                <button onClick={() => { setStudyIndex(i => Math.min(studyCards.length - 1, i + 1)); setFlipped(false); }} className="p-2 bg-slate-800 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {flashcards.map(c => (
              <div key={c.id} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg text-sm">
                <span className="text-slate-300 truncate">{c.front} → {c.back}</span>
                <button onClick={() => persistFlashcards(flashcards.filter(x => x.id !== c.id))} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select value={noteSubjectId} onChange={e => setNoteSubjectId(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm">
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Note title" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
          </div>
          <textarea
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            placeholder="Write your notes here..."
            rows={4}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={addNote} className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-semibold">Save Note</button>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notes.map(n => (
              <div key={n.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                <div className="flex justify-between">
                  <p className="font-medium">{n.title}</p>
                  <button onClick={() => persistNotes(notes.filter(x => x.id !== n.id))} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
                <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{n.content || 'No content'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500">Completed (7 days)</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.completedThisWeek}</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500">Pending tasks</p>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500">Upcoming exams</p>
            <p className="text-2xl font-bold text-red-400">{stats.upcomingExams}</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500">Study streak</p>
            <p className="text-2xl font-bold text-orange-400">{stats.streak} days</p>
          </div>
          {stats.busiestDay && (
            <p className="col-span-full text-sm text-slate-400">
              Busiest day this week: <span className="text-white">{stats.busiestDay}</span> ({stats.busiestCount} tasks due)
            </p>
          )}
        </div>
      )}

      {/* Study Planner */}
      {activeTab === 'planner' && (
        <div className="space-y-4">
          <button onClick={runPlanner} className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-semibold">
            Generate plan from exams
          </button>
          {plan.length === 0 ? (
            <p className="text-slate-500 text-sm">Add exams above, then generate a revision schedule.</p>
          ) : (
            <div className="space-y-2">
              {plan.map((s, i) => (
                <div key={i} className="flex justify-between bg-slate-900 p-3 rounded-lg border border-slate-700 text-sm">
                  <span className="text-slate-300">{s.date} — {s.subject}: {s.label}</span>
                  <span className="text-violet-400">{s.minutes} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Breakdown */}
      {activeTab === 'breakdown' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={breakdownTitle}
              onChange={e => setBreakdownTitle(e.target.value)}
              placeholder="Big task (e.g. History essay)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={runBreakdown} className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-semibold">Break down</button>
          </div>
          {breakdownSteps.length > 0 && (
            <>
              <ul className="space-y-2">
                {breakdownSteps.map((step, i) => (
                  <li key={i} className="bg-slate-900 p-2 rounded-lg text-sm text-slate-300">{i + 1}. {step}</li>
                ))}
              </ul>
              <button
                onClick={() => onAddSubtasks(breakdownSteps, new Date().toISOString().slice(0, 10))}
                className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Add all as tasks
              </button>
            </>
          )}
        </div>
      )}

      {/* Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          <button onClick={startQuiz} className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-semibold">
            Generate quiz from flashcards & notes
          </button>
          {quiz.length === 0 && !quizDone && (
            <p className="text-slate-500 text-sm">Add flashcards or notes first, then generate a quiz.</p>
          )}
          {quiz.length > 0 && !quizDone && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Question {quizIndex + 1} / {quiz.length}</p>
              <p className="font-medium mb-4">{quiz[quizIndex].question}</p>
              <div className="space-y-2">
                {quiz[quizIndex].options.map((opt, i) => {
                  let cls = 'bg-slate-800 hover:bg-slate-700';
                  if (selectedOption !== null) {
                    if (i === quiz[quizIndex].correctIndex) cls = 'bg-emerald-600/30 border border-emerald-500';
                    else if (i === selectedOption) cls = 'bg-red-600/30 border border-red-500';
                  }
                  return (
                    <button key={i} onClick={() => answerQuiz(i)} className={`w-full text-left p-3 rounded-lg text-sm ${cls}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {selectedOption !== null && (
                <button onClick={nextQuiz} className="mt-4 bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-semibold">
                  {quizIndex + 1 >= quiz.length ? 'See results' : 'Next'}
                </button>
              )}
            </div>
          )}
          {quizDone && quiz.length > 0 && (
            <p className="text-lg font-semibold text-emerald-400">Score: {quizScore} / {quiz.length}</p>
          )}
        </div>
      )}
    </div>
  );
}
