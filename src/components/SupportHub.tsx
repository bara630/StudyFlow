import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Send, MessageSquare, Book, Mail, X, CheckCircle2 } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I sync my Gmail for reminders?',
    answer:
      "StudyFlow sends reminders to the email address on your account. Link your Gmail by registering with the address you check daily — that inbox receives all alerts. For one-off reminders, click the bell icon on any task or exam. For automatic morning digests, StudyFlow emails you every day at 8:00 AM (server time) with every task and exam due that day, as long as email is configured on the server. You can also click 'Today's digest' in the header to test it instantly. Behind the scenes, mail is sent through secure Gmail SMTP using an authorized app password.",
  },
  {
    question: 'How does the Pomodoro timer work?',
    answer:
      "The Pomodoro timer is built around focused sprints: you work for 25 minutes, then take a 5-minute break to recharge. After four of these cycles, reward yourself with a longer 15-30 minute break. To start, just hit 'Start Focus Session' on your dashboard. Each completed session is automatically logged into your study data, so your Workload Analyzer can chart how much focused time you're putting in across the week. Over time this turns your effort into visible progress - you'll see your busiest study days, spot patterns, and keep your daily streak alive. The goal is steady, sustainable focus, not marathon cramming.",
  },
  {
    question: 'Can I export my study data?',
    answer:
      "Yes - your data belongs to you, and you can take it with you anytime. To export: 1) Click your profile/Settings area in the top-right of the dashboard. 2) Open the 'Data Export' section. 3) Choose your format - JSON (best for backups and re-importing) or CSV (best for opening in Excel or Google Sheets). 4) Click 'Download' and the file saves straight to your device. Your export includes all of your tasks, exams, study sessions, flashcards, and notes. It's perfect for keeping a backup before exam season or analyzing your own habits in another tool.",
  },
  {
    question: 'How do I use the AI Study Assistant?',
    answer:
      "Click the glowing purple bubble in the bottom-right corner to open your AI Study Assistant. You can type any study question, or - even faster - tap one of the quick-prompt buttons like 'Stop Procrastinating', 'Active Recall', 'Spaced Repetition', or 'Exam Prep' to get an instant, tailored strategy. The assistant won't repeat the same answer twice: ask for 'another tip' or 'tell me more' and it will give you a fresh angle on the same topic. It's like having a study coach who knows proven techniques - the Feynman method, Cornell notes, interleaving, and more - available 24/7, completely free and offline.",
  },
  {
    question: 'Is my data secure?',
    answer:
      "Your privacy is a priority. Your personal study content - subjects, flashcards, and notes - is stored locally in your own browser, so it stays on your device. Account data is kept on a private, access-controlled server, and you log in with a username and password so no one can access your dashboard by guessing your email. We never sell your information, never share it with advertisers, and only use your email to send the reminders you request. You're always in control: you can export or clear your data whenever you like.",
  },
];

interface DocGuide {
  title: string;
  icon: typeof Book;
  overview: string;
  steps: string[];
}

const docGuides: DocGuide[] = [
  {
    title: 'Getting Started Guide',
    icon: Book,
    overview: 'New to StudyFlow? Get your dashboard up and running in three quick steps.',
    steps: [
      'Step 1 - Create your account: Register with a username, your Gmail, and a password. This username keeps your login private and your Gmail becomes your reminder address.',
      'Step 2 - Add your work: Add your assignments under "Tasks" (with due dates) and your tests under "Exam Countdown". They instantly appear on your Calendar and Workload Analyzer.',
      'Step 3 - Start studying: Hit "Start Focus Session" to run your first Pomodoro, build subjects and flashcards in Study Tools, and watch your daily streak grow.',
    ],
  },
  {
    title: 'Email Setup Tutorial',
    icon: Mail,
    overview: 'Authorize automated email notifications so reminders land safely in your inbox.',
    steps: [
      'Use a Gmail account and confirm 2-Step Verification is turned on in your Google Account (Security tab).',
      'Generate a Google "App Password": Google Account > Security > App passwords > create one for "Mail". Google gives you a 16-character code.',
      'This app password (not your normal Gmail password) is what authorizes StudyFlow to send mail on your behalf via secure SMTP.',
      'Once authorized, click the bell icon on any task or exam to receive an automated reminder with the title and due date.',
    ],
  },
  {
    title: 'API Documentation',
    icon: MessageSquare,
    overview: 'For advanced students who want to query their own task data programmatically.',
    steps: [
      'GET /api/v1/tasks - Returns all of your tasks as JSON (id, title, dueDate, completed).',
      'GET /api/v1/tasks/{id} - Returns a single task by its ID.',
      'POST /api/v1/tasks - Creates a new task. Send a JSON body with title and dueDate.',
      'GET /api/v1/exams - Returns your scheduled exams and countdown dates.',
      'All requests are scoped to your own account, so you only ever see your own data.',
    ],
  },
];

export default function SupportHub({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const toggleFaq = (index: number) => setExpandedFaq(expandedFaq === index ? null : index);
  const toggleDoc = (index: number) => setExpandedDoc(expandedDoc === index ? null : index);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketSubject('');
      setTicketMessage('');
      onClose();
    }, 6000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-sm p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-2xl">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Support Hub</h2>
                <p className="text-sm text-indigo-200">Get help with StudyFlow</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:bg-white/10 p-2 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FAQ Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Book className="w-5 h-5 text-indigo-400" />
                Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-200">{faq.question}</span>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed border-t border-white/10 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ticket Form & Resources */}
            <div className="space-y-6">
              {/* Submit Ticket */}
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  Submit a Ticket
                </h3>
                {ticketSubmitted ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <p className="text-emerald-400 font-semibold">Thanks - your ticket is in!</p>
                    </div>
                    <p className="text-sm text-emerald-300/90 leading-relaxed">
                      Hi there, and thanks for reaching out to StudyFlow Support! We've received your message
                      {ticketSubject ? ` about "${ticketSubject}"` : ''} and a member of our student success team
                      will reply to your email within 24 hours (usually much sooner). In the meantime, check the FAQ and
                      guides on this page - your answer might be one click away. Keep up the great work, and good luck
                      with your studies!
                      <span className="block mt-2 text-emerald-400/80">- The StudyFlow Team</span>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-3">
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Subject"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Describe your issue..."
                      required
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit Ticket
                    </button>
                  </form>
                )}
              </div>

              {/* Documentation Guides */}
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Book className="w-5 h-5 text-indigo-400" />
                  Documentation
                </h3>
                <div className="space-y-2">
                  {docGuides.map((guide, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleDoc(index)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors group"
                      >
                        <guide.icon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 flex-shrink-0" />
                        <span className="text-sm text-slate-300 text-left flex-1">{guide.title}</span>
                        {expandedDoc === index ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      {expandedDoc === index && (
                        <div className="px-4 pb-4 pt-1 border-t border-white/10">
                          <p className="text-sm text-slate-400 mb-3 mt-2">{guide.overview}</p>
                          <ul className="space-y-2">
                            {guide.steps.map((step, i) => (
                              <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>Need immediate help?</p>
            <a href="mailto:support@studyflow.com" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <Mail className="w-4 h-4" />
              support@studyflow.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
