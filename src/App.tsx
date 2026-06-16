import { useState, useEffect } from 'react';
import { Timer, CheckSquare, Calendar, Trash2, LogIn, LogOut, User, HelpCircle, Bell, Plus, Pencil, Check, X, Flame } from 'lucide-react';
import CalendarView from './components/CalendarView';
import WorkloadAnalyzer from './components/WorkloadAnalyzer';
import AIStudyAssistant from './components/AIStudyAssistant';
import SupportHub from './components/SupportHub';
import StudyTools from './components/StudyTools';

const API_URL = 'http://localhost:8080/api';

interface Task {
  id: number;
  userId: number;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  estimatedPomodoros?: number;
}

interface Exam {
  id: number;
  userId: number;
  courseName: string;
  examDate: string;
}

interface CurrentUser {
  id: number;
  username: string;
  email: string;
  name?: string;
}

const dateKey = (d: Date) => {
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

const todayStr = () => dateKey(new Date());

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

// Count consecutive active days ending today (or yesterday, so the streak
// stays "alive" until the day is over).
const computeStreak = (days: string[]): number => {
  const set = new Set(days);
  const cursor = new Date();
  if (!set.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(dateKey(cursor))) return 0;
  }
  let count = 0;
  while (set.has(dateKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
};

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Support Hub State
  const [showSupport, setShowSupport] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [celebration, setCelebration] = useState<string | null>(null);

  // Task State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(todayStr());

  // Inline task editing
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');

  // Exam State
  const [exams, setExams] = useState<Exam[]>([]);
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState(todayStr());

  // Inline exam editing
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [editExamName, setEditExamName] = useState('');
  const [editExamDate, setEditExamDate] = useState('');

  // Study streak (days in a row with activity)
  const [streak, setStreak] = useState(0);

  const isAuthenticated = currentUser !== null;

  // Restore an existing session on page load so a refresh doesn't log you out.
  useEffect(() => {
    const stored = localStorage.getItem('studyflow_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('studyflow_user');
      }
    }
  }, []);

  // Load this user's tasks and exams whenever they log in.
  useEffect(() => {
    if (currentUser) {
      fetchTasks(currentUser.id);
      fetchExams(currentUser.id);
      const stored: string[] = JSON.parse(localStorage.getItem(`studyflow_streak_${currentUser.id}`) || '[]');
      setStreak(computeStreak(stored));
    } else {
      setTasks([]);
      setExams([]);
      setStreak(0);
    }
  }, [currentUser]);

  // Record today as an "active day" (completing a task or starting a focus
  // session) and recompute the streak.
  const recordActivity = () => {
    if (!currentUser) return;
    const key = `studyflow_streak_${currentUser.id}`;
    const stored: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const today = todayStr();
    if (!stored.includes(today)) {
      stored.push(today);
      localStorage.setItem(key, JSON.stringify(stored));
    }
    setStreak(computeStreak(stored));
  };

  const fetchTasks = async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/tasks/user/${userId}`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchExams = async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/exams/user/${userId}`);
      const data = await response.json();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const addTask = async () => {
    if (!currentUser) return;
    if (!newTaskTitle.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          title: newTaskTitle,
          completed: false,
          // Default to today so the task always lands on the calendar/workload views.
          dueDate: newTaskDueDate || todayStr(),
        }),
      });

      if (response.ok) {
        setNewTaskTitle('');
        setNewTaskDueDate(todayStr());
        fetchTasks(currentUser.id);
        showToast('Task added successfully!', 'success');
      } else {
        showToast('Failed to add task', 'error');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      showToast('Could not reach the server', 'error');
    }
  };

  const toggleTask = async (id: number) => {
    if (!currentUser) return;
    try {
      const task = tasks.find(t => t.id === id);
      await fetch(`${API_URL}/tasks/${id}/toggle`, { method: 'PUT' });
      // Completing a task (not un-checking) counts toward today's streak.
      if (task && !task.completed) {
        recordActivity();
      }
      fetchTasks(currentUser.id);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id: number) => {
    if (!currentUser) return;
    try {
      await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
      fetchTasks(currentUser.id);
      showToast('Task deleted!', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDueDate(task.dueDate ? task.dueDate.slice(0, 10) : todayStr());
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskTitle('');
    setEditTaskDueDate('');
  };

  const saveEditTask = async (id: number) => {
    if (!currentUser) return;
    if (!editTaskTitle.trim()) {
      showToast('Task title cannot be empty', 'error');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTaskTitle,
          dueDate: editTaskDueDate || todayStr(),
        }),
      });
      if (response.ok) {
        cancelEditTask();
        fetchTasks(currentUser.id);
        showToast('Task updated!', 'success');
      } else {
        showToast('Failed to update task', 'error');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Could not reach the server', 'error');
    }
  };

  const addExam = async () => {
    if (!currentUser) return;
    if (!newExamName.trim()) {
      showToast('Please enter a course name', 'error');
      return;
    }
    if (!newExamDate) {
      showToast('Please pick an exam date', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          courseName: newExamName,
          // Backend stores a LocalDateTime, so send an ISO date-time.
          examDate: `${newExamDate}T00:00:00`,
        }),
      });

      if (response.ok) {
        setNewExamName('');
        setNewExamDate(todayStr());
        fetchExams(currentUser.id);
        showToast('Exam added!', 'success');
      } else {
        showToast('Failed to add exam', 'error');
      }
    } catch (error) {
      console.error('Error adding exam:', error);
      showToast('Could not reach the server', 'error');
    }
  };

  const deleteExam = async (id: number) => {
    if (!currentUser) return;
    try {
      await fetch(`${API_URL}/exams/${id}`, { method: 'DELETE' });
      fetchExams(currentUser.id);
      showToast('Exam removed!', 'success');
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  const startEditExam = (exam: Exam) => {
    setEditingExamId(exam.id);
    setEditExamName(exam.courseName);
    setEditExamDate(exam.examDate ? exam.examDate.slice(0, 10) : todayStr());
  };

  const cancelEditExam = () => {
    setEditingExamId(null);
    setEditExamName('');
    setEditExamDate('');
  };

  const saveEditExam = async (id: number) => {
    if (!currentUser) return;
    if (!editExamName.trim()) {
      showToast('Course name cannot be empty', 'error');
      return;
    }
    if (!editExamDate) {
      showToast('Please pick an exam date', 'error');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/exams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: editExamName,
          examDate: `${editExamDate}T00:00:00`,
        }),
      });
      if (response.ok) {
        cancelEditExam();
        fetchExams(currentUser.id);
        showToast('Exam updated!', 'success');
      } else {
        showToast('Failed to update exam', 'error');
      }
    } catch (error) {
      console.error('Error updating exam:', error);
      showToast('Could not reach the server', 'error');
    }
  };

  const sendTaskReminder = async (task: Task) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_URL}/email/task-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: currentUser.email,
          taskTitle: task.title,
          dueDate: task.dueDate || 'No due date',
        }),
      });
      const data = await response.json();
      showToast(
        data.success ? `Reminder sent to ${currentUser.email}` : data.message,
        data.success ? 'success' : 'error'
      );
    } catch (error) {
      console.error('Error sending reminder:', error);
      showToast('Could not send reminder', 'error');
    }
  };

  const addSubtasks = async (steps: string[], dueDate: string) => {
    if (!currentUser) return;
    try {
      for (const title of steps) {
        await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            title,
            completed: false,
            dueDate,
          }),
        });
      }
      fetchTasks(currentUser.id);
      showToast(`Added ${steps.length} subtasks!`, 'success');
    } catch (error) {
      console.error('Error adding subtasks:', error);
      showToast('Failed to add subtasks', 'error');
    }
  };

  const sendExamReminder = async (exam: Exam) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_URL}/email/exam-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: currentUser.email,
          courseName: exam.courseName,
          examDate: formatExamDate(exam.examDate),
        }),
      });
      const data = await response.json();
      showToast(
        data.success ? `Reminder sent to ${currentUser.email}` : data.message,
        data.success ? 'success' : 'error'
      );
    } catch (error) {
      console.error('Error sending reminder:', error);
      showToast('Could not send reminder', 'error');
    }
  };

  const sendDailyDigest = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_URL}/email/daily-digest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await response.json();
      showToast(data.message, data.success ? 'success' : 'error');
    } catch (error) {
      console.error('Error sending daily digest:', error);
      showToast('Could not send daily digest', 'error');
    }
  };

  const handleLogin = async () => {
    if (!loginUsername.trim()) {
      showToast('Please enter your username', 'error');
      return;
    }
    if (!loginPassword.trim()) {
      showToast('Please enter your password', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });

      const data = await response.json();
      if (data.success && data.user) {
        const user: CurrentUser = data.user;
        setCurrentUser(user);
        localStorage.setItem('studyflow_user', JSON.stringify(user));
        setLoginPassword('');
        showToast(`Welcome back, ${user.username}!`, 'success');
      } else {
        showToast(data.message || 'Invalid username or password', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Could not reach the server. Is the backend running?', 'error');
    }
  };

  const handleRegister = async () => {
    if (regUsername.trim().length < 3) {
      showToast('Username must be at least 3 characters', 'error');
      return;
    }
    if (regPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          name: regName.trim(),
          password: regPassword,
        }),
      });

      const data = await response.json();
      if (data.success && data.user) {
        const user: CurrentUser = data.user;
        setCurrentUser(user);
        localStorage.setItem('studyflow_user', JSON.stringify(user));
        setRegPassword('');
        showToast('Account created!', 'success');
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      showToast('Could not reach the server. Is the backend running?', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('studyflow_user');
    setLoginUsername('');
    setLoginPassword('');
    setAuthMode('login');
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Pomodoro countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // Pomodoro session completion — auto-switches between focus and break.
  useEffect(() => {
    if (!isRunning || timeLeft > 0) return;
    playAchievementSound();
    if (pomodoroMode === 'focus') {
      setSessionsCompleted((c) => c + 1);
      recordActivity();
      triggerCelebration('Focus session complete! Enjoy a 5-minute break.');
      setPomodoroMode('break');
      setTimeLeft(BREAK_DURATION);
      // Keep running so the break begins automatically.
    } else {
      triggerCelebration('Break over — ready for another focus session?');
      setPomodoroMode('focus');
      setTimeLeft(FOCUS_DURATION);
      setIsRunning(false);
    }
  }, [isRunning, timeLeft, pomodoroMode]);

  // Plays a short rising arpeggio (C-E-G-C) as an achievement sound.
  const playAchievementSound = () => {
    try {
      const AudioCtx = window.AudioContext
        || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const start = now + i * 0.12;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
        osc.start(start);
        osc.stop(start + 0.5);
      });
      setTimeout(() => ctx.close(), 1500);
    } catch {
      // Audio not available — silently ignore.
    }
  };

  const triggerCelebration = (message: string) => {
    setCelebration(message);
    setTimeout(() => setCelebration(null), 5000);
  };

  const resetPomodoro = () => {
    setIsRunning(false);
    setPomodoroMode('focus');
    setTimeLeft(FOCUS_DURATION);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatExamDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilExam = (dateString: string) => {
    const examDate = new Date(dateString);
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans animate-fade-in">
      {/* Auth Form */}
      {!isAuthenticated && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">
                Welcome to StudyFlow
              </h1>
              <p className="text-slate-400">
                {authMode === 'login' ? 'Sign in to manage your study goals' : 'Create an account to get started'}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex bg-slate-900 rounded-lg p-1 mb-6 border border-slate-700">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Enter your username"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Enter your password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Pick a username (min 3 chars)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Used for reminder emails"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Display name (optional)</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleRegister}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      {isAuthenticated && (
        <>
          <header className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                StudyFlow Dashboard
              </h1>
              <p className="text-slate-400">Welcome back! Time to manage your study goals effectively.</p>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-2 bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg border border-orange-500/20"
                title="Days in a row you've completed a task or focus session"
              >
                <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-400' : 'text-slate-500'}`} />
                <span className="text-sm font-semibold">{streak} day streak</span>
              </div>
              <button
                onClick={sendDailyDigest}
                title="Email me today's tasks and exams"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Today's digest</span>
              </button>
              <button
                onClick={() => setShowSupport(true)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm">Support</span>
              </button>
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-5 h-5" />
                <span className="text-sm">{currentUser?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pomodoro Component */}
            <div className={`bg-slate-800 p-6 rounded-2xl shadow-xl border flex flex-col items-center transition-all hover:shadow-2xl ${
              pomodoroMode === 'break' ? 'border-emerald-500/40' : 'border-slate-700 hover:border-blue-500/40'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Timer className={`w-6 h-6 ${pomodoroMode === 'break' ? 'text-emerald-400' : 'text-blue-400'}`} />
                <h2 className="text-xl font-semibold">Pomodoro Timer</h2>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
                pomodoroMode === 'break' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {pomodoroMode === 'break' ? 'Break Time' : 'Focus Time'}
              </span>
              <div className={`text-5xl font-mono font-bold my-2 text-white bg-slate-900 px-6 py-3 rounded-xl border ${
                pomodoroMode === 'break' ? 'border-emerald-500/40' : 'border-slate-700'
              }`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-slate-400 my-3">
                Sessions completed today: <span className="text-white font-semibold">{sessionsCompleted}</span>
              </p>
              <div className="w-full flex gap-2">
                <button
                  onClick={() => {
                    if (!isRunning) recordActivity();
                    setIsRunning(!isRunning);
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors text-white ${
                    isRunning
                      ? 'bg-red-500 hover:bg-red-600'
                      : pomodoroMode === 'break'
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isRunning ? 'Pause' : pomodoroMode === 'break' ? 'Start Break' : 'Start Focus Session'}
                </button>
                <button
                  onClick={resetPomodoro}
                  title="Reset to a 25:00 focus session"
                  className="px-4 py-2.5 rounded-xl font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Task Tracker Component */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 transition-all hover:border-indigo-500/40 hover:shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare className="text-indigo-400 w-6 h-6" />
                <h2 className="text-xl font-semibold">Assignments & Tasks</h2>
              </div>

              {/* Add Task Input */}
              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add new task..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <label className="block text-xs text-slate-500">Due date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addTask}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-semibold transition-colors"
                >
                  Add Task
                </button>
              </div>

              {/* Task List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {tasks.filter(task => !task.completed).length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No tasks yet. Add one above!</p>
                ) : (
                  tasks.filter(task => !task.completed).map((task) => (
                    editingTaskId === task.id ? (
                      <div
                        key={task.id}
                        className="p-3 bg-slate-900 rounded-xl border border-indigo-500 space-y-2"
                      >
                        <input
                          type="text"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveEditTask(task.id)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="date"
                          value={editTaskDueDate}
                          onChange={(e) => setEditTaskDueDate(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEditTask(task.id)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <Check className="w-4 h-4" /> Save
                          </button>
                          <button
                            onClick={cancelEditTask}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700 group transition-all hover:border-indigo-500/50 hover:bg-slate-900/60"
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="rounded bg-slate-800 border-slate-600 text-indigo-500 focus:ring-0 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="text-slate-300">{task.title}</span>
                          {task.dueDate && (
                            <span className="block text-xs text-slate-500">Due {task.dueDate.slice(0, 10)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => sendTaskReminder(task)}
                          title="Email me a reminder"
                          className="opacity-60 hover:opacity-100 text-blue-400 hover:text-blue-300 transition-all hover:scale-110"
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditTask(task)}
                          title="Edit task"
                          className="opacity-60 hover:opacity-100 text-amber-400 hover:text-amber-300 transition-all hover:scale-110"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          title="Delete task"
                          className="opacity-60 hover:opacity-100 text-red-400 hover:text-red-500 transition-all hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  ))
                )}
              </div>
            </div>

            {/* Exam Countdowns */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 transition-all hover:border-emerald-500/40 hover:shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-emerald-400 w-6 h-6" />
                <h2 className="text-xl font-semibold">Exam Countdown</h2>
              </div>

              {/* Add Exam Input */}
              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addExam()}
                  placeholder="Course name (e.g. Biology)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <label className="block text-xs text-slate-500">Exam date</label>
                <input
                  type="date"
                  value={newExamDate}
                  onChange={(e) => setNewExamDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={addExam}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-semibold transition-colors"
                >
                  Add Exam
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {exams.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No exams scheduled.</p>
                ) : (
                  exams.map((exam) => (
                    editingExamId === exam.id ? (
                      <div key={exam.id} className="p-3 bg-slate-900 rounded-xl border border-emerald-500 space-y-2">
                        <input
                          type="text"
                          value={editExamName}
                          onChange={(e) => setEditExamName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveEditExam(exam.id)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="date"
                          value={editExamDate}
                          onChange={(e) => setEditExamDate(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEditExam(exam.id)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <Check className="w-4 h-4" /> Save
                          </button>
                          <button
                            onClick={cancelEditExam}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={exam.id} className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex justify-between items-center group transition-all hover:border-emerald-500/50 hover:bg-slate-900/60">
                        <div>
                          <p className="font-medium">{exam.courseName}</p>
                          <p className="text-xs text-slate-500">{formatExamDate(exam.examDate)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-sm font-semibold">
                            {getDaysUntilExam(exam.examDate)} Days Left
                          </span>
                          <button
                            onClick={() => sendExamReminder(exam)}
                            title="Email me a reminder"
                            className="opacity-60 hover:opacity-100 text-blue-400 hover:text-blue-300 transition-all hover:scale-110"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEditExam(exam)}
                            title="Edit exam"
                            className="opacity-60 hover:opacity-100 text-amber-400 hover:text-amber-300 transition-all hover:scale-110"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteExam(exam.id)}
                            title="Delete exam"
                            className="opacity-60 hover:opacity-100 text-red-400 hover:text-red-500 transition-all hover:scale-110"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  ))
                )}
              </div>
            </div>
          </div>

          {/* New Features Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <CalendarView tasks={tasks} exams={exams} />
            <WorkloadAnalyzer tasks={tasks} exams={exams} />
          </div>

          {currentUser && (
            <StudyTools
              userId={currentUser.id}
              tasks={tasks}
              exams={exams}
              streak={streak}
              onAddSubtasks={addSubtasks}
            />
          )}

          {/* AI Study Assistant */}
          <AIStudyAssistant />

          {/* Support Hub */}
          <SupportHub isOpen={showSupport} onClose={() => setShowSupport(false)} />
        </>
      )}

      {/* Celebration overlay */}
      {celebration && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center overflow-hidden">
          {Array.from({ length: 70 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'][i % 7],
                animationDelay: `${Math.random() * 0.8}s`,
                animationDuration: `${2 + Math.random() * 1.5}s`,
              }}
            />
          ))}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/40 rounded-3xl px-8 py-6 shadow-2xl text-center animate-scale-in">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-lg font-bold text-white max-w-xs">{celebration}</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 border-emerald-400/30 text-white'
              : 'bg-red-500/90 border-red-400/30 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
