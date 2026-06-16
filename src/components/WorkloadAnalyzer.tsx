import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  dueDate?: string;
  completed: boolean;
  estimatedPomodoros?: number;
}

interface Exam {
  id: number;
  courseName: string;
  examDate: string;
}

interface WorkloadAnalyzerProps {
  tasks: Task[];
  exams: Exam[];
}

// Parse "YYYY-MM-DD" or an ISO date-time into a LOCAL date so day comparisons
// don't shift by a day due to UTC parsing.
const parseLocalDate = (value: string) => {
  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

export default function WorkloadAnalyzer({ tasks, exams }: WorkloadAnalyzerProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  const getWorkloadData = () => {
    const today = new Date();
    const days = timeframe === 'week' ? 7 : 30;
    const data = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toDateString();

      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        return parseLocalDate(task.dueDate).toDateString() === dateStr && !task.completed;
      });

      const dayExams = exams.filter(exam => {
        return parseLocalDate(exam.examDate).toDateString() === dateStr;
      });

      const totalPomodoros = dayTasks.reduce((sum, task) => sum + (task.estimatedPomodoros || 1), 0);
      const examCount = dayExams.length;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workload: totalPomodoros + (examCount * 4), // Exams count as 4 pomodoros
        taskCount: dayTasks.length,
        examCount,
      });
    }

    return data;
  };

  const getBusyDays = () => {
    const data = getWorkloadData();
    return data
      .filter(d => d.workload > 6)
      .sort((a, b) => b.workload - a.workload)
      .slice(0, 3);
  };

  const getAverageWorkload = () => {
    const data = getWorkloadData();
    const total = data.reduce((sum, d) => sum + d.workload, 0);
    return (total / data.length).toFixed(1);
  };

  const workloadData = getWorkloadData();
  const busyDays = getBusyDays();
  const averageWorkload = getAverageWorkload();
  const maxWorkload = Math.max(...workloadData.map(d => d.workload));

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-emerald-400 w-6 h-6" />
          <h2 className="text-xl font-semibold">Workload Analyzer</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === 'week' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === 'month' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Average Workload</p>
          <p className="text-2xl font-bold text-emerald-400">{averageWorkload} hrs</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Peak Workload</p>
          <p className="text-2xl font-bold text-red-400">{maxWorkload} hrs</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Busy Days</p>
          <p className="text-2xl font-bold text-amber-400">{busyDays.length}</p>
        </div>
      </div>

      {/* Workload Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Daily Workload (in pomodoro sessions)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                fontSize={12}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                fontSize={12}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="workload" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Busy Days Alert */}
      {busyDays.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-amber-400 w-5 h-5" />
            <h3 className="font-semibold text-amber-400">High Workload Days</h3>
          </div>
          <div className="space-y-2">
            {busyDays.map((day, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{day.date}</span>
                <span className="text-amber-400 font-medium">
                  {day.workload} hrs ({day.taskCount} tasks, {day.examCount} exams)
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Consider redistributing tasks or starting early on these days.
          </p>
        </div>
      )}
    </div>
  );
}
