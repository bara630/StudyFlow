import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  dueDate?: string;
  completed: boolean;
}

interface Exam {
  id: number;
  courseName: string;
  examDate: string;
}

interface CalendarViewProps {
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

export default function CalendarView({ tasks, exams }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      // Completed tasks drop off the calendar once they're checked done.
      if (task.completed) return false;
      return parseLocalDate(task.dueDate).toDateString() === date.toDateString();
    });
  };

  const getExamsForDate = (date: Date) => {
    return exams.filter(exam => {
      return parseLocalDate(exam.examDate).toDateString() === date.toDateString();
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayTasks = getTasksForDate(date);
      const dayExams = getExamsForDate(date);
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 min-h-[80px] border border-slate-700 rounded-lg cursor-pointer transition-colors ${
            isSelected ? 'bg-indigo-600/30 border-indigo-500' : 'bg-slate-800 hover:bg-slate-700'
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="font-semibold text-sm mb-1">{day}</div>
          <div className="space-y-1">
            {dayTasks.slice(0, 2).map(task => (
              <div key={task.id} className="text-xs bg-indigo-500/20 text-indigo-300 px-1 rounded truncate">
                {task.title}
              </div>
            ))}
            {dayExams.slice(0, 2).map(exam => (
              <div key={exam.id} className="text-xs bg-red-500/20 text-red-300 px-1 rounded truncate">
                {exam.courseName}
              </div>
            ))}
            {(dayTasks.length + dayExams.length) > 2 && (
              <div className="text-xs text-slate-400">
                +{dayTasks.length + dayExams.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-blue-400 w-6 h-6" />
          <h2 className="text-xl font-semibold">Calendar View</h2>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={previousMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-lg min-w-[150px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {renderCalendar()}
      </div>

      {selectedDate && (
        <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
          <h3 className="font-semibold mb-3">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {getTasksForDate(selectedDate).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-indigo-400 mb-1">Tasks</h4>
                {getTasksForDate(selectedDate).map(task => (
                  <div key={task.id} className="text-sm text-slate-300 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-indigo-500'}`} />
                    {task.title}
                  </div>
                ))}
              </div>
            )}
            {getExamsForDate(selectedDate).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-400 mb-1">Exams</h4>
                {getExamsForDate(selectedDate).map(exam => (
                  <div key={exam.id} className="text-sm text-slate-300">
                    {exam.courseName}
                  </div>
                ))}
              </div>
            )}
            {getTasksForDate(selectedDate).length === 0 && getExamsForDate(selectedDate).length === 0 && (
              <p className="text-sm text-slate-500">No tasks or exams scheduled</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
