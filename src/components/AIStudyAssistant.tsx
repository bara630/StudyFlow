import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Sparkles, Clock, BookOpen, Target, Zap, Brain, Repeat } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const quickPrompts = [
  { icon: Clock, text: 'How do I use the Pomodoro technique?', label: 'Pomodoro' },
  { icon: Target, text: 'How do I beat procrastination?', label: 'Stop Procrastinating' },
  { icon: BookOpen, text: 'How should I prepare for an exam?', label: 'Exam Prep' },
  { icon: Brain, text: 'What is active recall?', label: 'Active Recall' },
  { icon: Repeat, text: 'Explain spaced repetition', label: 'Spaced Repetition' },
  { icon: Zap, text: 'How can I boost my productivity?', label: 'Productivity' },
];

// Each topic has several phrasings so the assistant doesn't repeat itself.
interface Topic {
  keywords: string[];
  responses: string[];
}

const topics: Topic[] = [
  {
    keywords: ['pomodoro', 'timer', '25 min', 'work break'],
    responses: [
      "The Pomodoro Technique: work for 25 focused minutes, then take a 5-minute break. After 4 rounds, take a longer 15-30 minute break. The countdown creates a gentle sense of urgency that keeps you on task.",
      "With Pomodoro, the magic is the break. During your 5-minute rest, stand up, stretch, or look out a window - avoid screens so your brain actually recovers. Then dive back in for the next 25.",
      "A tip for Pomodoro: before you start the 25 minutes, write down the ONE thing you'll work on. If a distracting thought pops up, jot it on a 'later' list and keep going. You can use the timer on your dashboard!",
      "If 25 minutes feels too long at first, start with 15-minute focus blocks and build up. The goal is consistency, not punishment. Even two solid Pomodoros a day adds up fast.",
    ],
  },
  {
    keywords: ['procrastin', 'lazy', 'cant start', "can't start", 'putting off', 'avoid work'],
    responses: [
      "Beat procrastination with the 2-minute rule: just commit to starting for 2 minutes. Starting is the hardest part - once you're in motion, you usually keep going.",
      "Try 'eat the frog': do your hardest or most dreaded task first thing, while your willpower is fresh. Everything after that feels easier.",
      "Procrastination is often fear in disguise. Break the scary task into tiny steps - 'open the doc', 'write one sentence'. Shrink it until the first step feels almost too easy.",
      "Remove the friction: close extra tabs, put your phone in another room, and set a single clear goal for the session. Make starting the path of least resistance.",
    ],
  },
  {
    keywords: ['exam', 'test', 'final', 'midterm', 'quiz prep'],
    responses: [
      "For exams: start early and space your study over several days instead of cramming. Spaced practice beats one long session for long-term memory.",
      "Use practice tests and past papers - testing yourself is one of the most powerful ways to learn. It shows you exactly what you don't know yet.",
      "The night before an exam, prioritize sleep over last-minute cramming. Sleep consolidates memory, so a rested brain recalls far more than a tired one.",
      "Make a one-page 'cheat sheet' of the key formulas and ideas (even if you can't bring it in). The act of condensing forces you to decide what truly matters.",
    ],
  },
  {
    keywords: ['active recall', 'flashcard', 'quiz myself', 'test myself', 'retrieval'],
    responses: [
      "Active recall means retrieving information from memory instead of re-reading it. Close your notes and try to write down everything you remember, then check what you missed.",
      "Turn your notes into questions. Instead of reading 'The mitochondria is the powerhouse of the cell', ask 'What is the function of the mitochondria?' and answer from memory.",
      "Flashcards are active recall in action - especially apps like Anki that schedule them. The struggle to remember is exactly what strengthens the memory.",
    ],
  },
  {
    keywords: ['spaced repetition', 'spacing', 'review schedule', 'forget'],
    responses: [
      "Spaced repetition fights forgetting by reviewing material at increasing intervals - say day 1, day 3, day 7, day 14. Each review resets the 'forgetting curve' and makes the memory last longer.",
      "Instead of reviewing everything every day, review a topic right before you're about to forget it. Apps like Anki automate this, but even a simple '1 day / 3 days / 1 week' schedule works.",
      "Spacing works because a little forgetting is good - the effort to re-remember is what cements knowledge. Cramming feels productive but fades fast.",
    ],
  },
  {
    keywords: ['feynman', 'explain', 'understand deeply', 'teach'],
    responses: [
      "The Feynman Technique: explain the topic out loud in simple words, as if teaching a 12-year-old. Wherever you get stuck or use jargon, that's a gap to go study.",
      "Try teaching the material to someone else (or even a rubber duck!). If you can't explain it simply, you don't understand it well enough yet - and you'll instantly spot the weak points.",
    ],
  },
  {
    keywords: ['note', 'cornell', 'mind map', 'taking notes'],
    responses: [
      "The Cornell method: split your page into a narrow left column (cues/questions), a wide right column (notes), and a summary at the bottom. After class, fill the left column with questions and use them to quiz yourself.",
      "Mind maps are great for connected topics: put the main idea in the center and branch out. The visual structure helps you see how concepts relate.",
      "Don't transcribe word-for-word - summarize in your OWN words. Rephrasing forces your brain to process the meaning instead of just copying.",
    ],
  },
  {
    keywords: ['stress', 'anxiety', 'overwhelm', 'burnout', 'panic'],
    responses: [
      "When study stress hits, try box breathing: inhale 4 seconds, hold 4, exhale 4, hold 4. A few rounds calms your nervous system and clears your head.",
      "Feeling overwhelmed usually means too much is in your head at once. Brain-dump every task onto paper, then pick just the next ONE to do. You can't do it all at this second - only the next step.",
      "Burnout is a signal, not a weakness. Schedule real rest, move your body, and protect your sleep. A rested brain learns faster than an exhausted one pushing through.",
    ],
  },
  {
    keywords: ['schedule', 'plan', 'time block', 'organize', 'manage time', 'time management'],
    responses: [
      "Time blocking: assign each task a specific slot on your calendar instead of a vague to-do list. 'Study chem 4-5pm' is far more likely to happen than 'study chem sometime'.",
      "Plan your week every Sunday. Put your biggest, hardest tasks in your peak-energy hours and leave buffer time for surprises - things always take longer than expected.",
      "Try the 1-3-5 rule each day: aim to finish 1 big thing, 3 medium things, and 5 small things. It keeps your day realistic and focused.",
    ],
  },
  {
    keywords: ['focus', 'concentrat', 'distract', 'attention', 'phone'],
    responses: [
      "Kill distractions before they start: phone in another room, notifications off, and only the tabs you need open. Out of sight really is out of mind.",
      "Try the 'one screen' rule while studying - no second device. Your brain can't truly multitask; switching between things drains focus every time.",
      "Build a focus ritual: same spot, same playlist, a glass of water. Repeating the cue trains your brain to drop into 'study mode' faster.",
    ],
  },
  {
    keywords: ['interleav', 'mix subjects', 'switch topics'],
    responses: [
      "Interleaving means mixing different topics or problem types in one session instead of doing all of one kind. It feels harder, but it dramatically improves your ability to tell problems apart on a test.",
      "Instead of 20 algebra problems then 20 geometry, mix them up. Your brain has to keep choosing the right method, which is exactly the skill exams test.",
    ],
  },
  {
    keywords: ['memory', 'memoriz', 'mnemonic', 'remember facts'],
    responses: [
      "For raw memorization, use mnemonics - acronyms, silly stories, or the 'memory palace' where you place facts along a familiar route. The weirder the image, the better it sticks.",
      "Chunk information into groups. A phone number is easier as 3 chunks than 10 digits. Group related facts so your memory has fewer 'items' to hold.",
    ],
  },
  {
    keywords: ['sleep', 'tired', 'rest', 'nap'],
    responses: [
      "Sleep is study time in disguise - your brain consolidates the day's learning while you rest. Aim for 8 hours; pulling an all-nighter usually costs more than it gains.",
      "A short 20-minute nap can reset your focus, but keep it under 30 minutes so you don't wake up groggy. Studying right before sleep can also boost retention.",
    ],
  },
  {
    keywords: ['motivat', 'give up', 'discourag', 'why bother', 'lazy'],
    responses: [
      "Motivation follows action more often than it leads it. Don't wait to feel ready - start tiny, and momentum will build. Done beats perfect.",
      "Reconnect with your 'why'. Picture the version of you who's prepared and confident on exam day. Then do one small thing right now for that person.",
      "Reward progress, not just the finish line. Tick off a task, take a real break, celebrate small wins - your brain repeats what gets rewarded.",
    ],
  },
  {
    keywords: ['math', 'physics', 'problem set', 'equations'],
    responses: [
      "For math and physics, learning = doing. Re-reading worked solutions feels productive but won't build skill. Cover the solution, try it yourself, then compare.",
      "Keep an 'error log' of problems you got wrong and why. Reviewing your own mistakes is one of the fastest ways to improve in problem-based subjects.",
    ],
  },
  {
    keywords: ['read', 'textbook', 'sq3r', 'comprehen'],
    responses: [
      "Try SQ3R for textbooks: Survey (skim headings), Question (turn them into questions), Read, Recite (answer from memory), Review. It turns passive reading into active learning.",
      "Before reading a chapter, skim the headings, bold terms, and summary first. Knowing the structure gives your brain 'hooks' to hang the details on.",
    ],
  },
];

const greetingResponses = [
  "Hey! Ready to get some studying done? Ask me about study techniques, focus, exam prep, or beating procrastination.",
  "Hi there! What are you working on today? I can help with time management, memory tricks, or staying motivated.",
  "Hello! I'm here to help you study smarter. Try asking about active recall, the Pomodoro technique, or how to plan your week.",
];

const thanksResponses = [
  "You're welcome! Consistency beats intensity - keep showing up. Anything else on your mind?",
  "Anytime! Small steps every day add up to big results. What else can I help with?",
  "Happy to help! Now go knock out a Pomodoro. I'm here if you need more tips.",
];

// Rotating fallbacks so a non-matching question doesn't always get the same reply.
const fallbackResponses = [
  "Good question! A solid all-purpose approach: break it into small steps, study with active recall (quiz yourself), and space your sessions over several days. Want tips on any of those?",
  "I'm not 100% sure I caught that, but here's something that helps almost any subject: explain it out loud in simple words (the Feynman technique) and note where you get stuck. Want me to go deeper?",
  "Let's tackle it. Try setting a 25-minute Pomodoro and focusing on just the next small piece. Could you tell me a bit more about what you're struggling with?",
  "Great thing to think about! Generally, testing yourself beats re-reading, and spacing beats cramming. Ask me about 'active recall' or 'spaced repetition' for the details.",
];

const isGreeting = (msg: string) =>
  /\b(hi|hey|hello|yo|sup|good morning|good afternoon|good evening)\b/.test(msg);

const wantsMore = (msg: string) =>
  /\b(more|another|else|other|again|different|next tip)\b/.test(msg);

export default function AIStudyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your AI Study Assistant. Ask me anything about studying - time management, memory techniques, focus, exam prep, beating procrastination, and more. I'll try not to repeat myself!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Remember which responses we've already used so we don't repeat them,
  // and the last topic so "tell me more" gives a fresh tip on it.
  const usedResponsesRef = useRef<Set<string>>(new Set());
  const lastTopicRef = useRef<Topic | null>(null);
  const fallbackIndexRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  // Pick a response from a list that hasn't been used yet; reset if all used.
  const pickFresh = (responses: string[]): string => {
    const unused = responses.filter(r => !usedResponsesRef.current.has(r));
    const pool = unused.length > 0 ? unused : responses;
    if (unused.length === 0) {
      // All variants seen - clear them so they can cycle again.
      responses.forEach(r => usedResponsesRef.current.delete(r));
    }
    const choice = pool[Math.floor(Math.random() * pool.length)];
    usedResponsesRef.current.add(choice);
    return choice;
  };

  const findTopic = (msg: string): Topic | null => {
    let best: Topic | null = null;
    let bestScore = 0;
    for (const topic of topics) {
      const score = topic.keywords.reduce((s, kw) => (msg.includes(kw) ? s + 1 : s), 0);
      if (score > bestScore) {
        bestScore = score;
        best = topic;
      }
    }
    return best;
  };

  const generateAIResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    if (isGreeting(msg) && msg.length < 25) {
      return pickFresh(greetingResponses);
    }
    if (msg.includes('thank')) {
      return pickFresh(thanksResponses);
    }

    // "tell me more" / "another tip" -> stay on the last topic with a new variant.
    if (wantsMore(msg) && lastTopicRef.current) {
      return pickFresh(lastTopicRef.current.responses);
    }

    const topic = findTopic(msg);
    if (topic) {
      lastTopicRef.current = topic;
      return pickFresh(topic.responses);
    }

    // Rotate fallbacks so repeated unknown questions still feel different.
    const fb = fallbackResponses[fallbackIndexRef.current % fallbackResponses.length];
    fallbackIndexRef.current += 1;
    return fb;
  };

  const handleSendMessage = (text?: string) => {
    const messageToSend = text || inputText;
    if (!messageToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: messageToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    const responseText = generateAIResponse(messageToSend);

    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 700 + Math.random() * 900);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-50 backdrop-blur-sm bg-opacity-90"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 flex flex-col z-50 transition-all duration-300 ${
            isExpanded ? 'w-[600px] h-[700px]' : 'w-96 h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-sm p-4 rounded-t-3xl flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Study Assistant</h3>
                <p className="text-xs text-indigo-200">Powered by StudyFlow AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Shrink' : 'Expand'}
                className="text-white/80 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="p-4 border-b border-white/10">
            <p className="text-xs text-slate-400 mb-3">Quick prompts:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(prompt.text)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-xs text-slate-300 transition-all hover:scale-105 hover:border-indigo-400/40"
                >
                  <prompt.icon className="w-3 h-3" />
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm shadow-lg'
                      : 'bg-white/10 backdrop-blur-sm text-slate-100 rounded-bl-sm border border-white/10'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 backdrop-blur-sm text-slate-100 p-4 rounded-2xl rounded-bl-sm border border-white/10">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about studying..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all hover:scale-105 shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
