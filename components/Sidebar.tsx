import React from 'react';
import { Question } from '../types';

interface SidebarProps {
  questions: Question[];
  userAnswers: Record<string, string[]>;
  isPageRevealed: boolean;
  currentPage: number;
  pageSize: number;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  questions, 
  userAnswers, 
  isPageRevealed, 
  currentPage, 
  pageSize,
  isOpen,
  setIsOpen
}) => {
  const startIndex = (currentPage - 1) * pageSize;

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // On mobile, close sidebar after selection
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    }
  };

  const getButtonClass = (q: Question) => {
    const hasAnswered = userAnswers[q.id] && userAnswers[q.id].length > 0;
    
    // Normalizing answers for comparison
    const normalize = (arr: string[]) => [...(arr || [])].sort().join(',');
    const isCorrect = normalize(userAnswers[q.id] || []) === normalize(q.answer);

    const base = "w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center transition-all border ";

    if (isPageRevealed) {
      if (isCorrect) return base + "bg-green-100 text-green-700 border-green-200 hover:bg-green-200";
      if (hasAnswered) return base + "bg-red-100 text-red-700 border-red-200 hover:bg-red-200";
      return base + "bg-slate-50 text-slate-400 border-slate-200"; // Unanswered
    }

    if (hasAnswered) return base + "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200";
    return base + "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600";
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-slate-200 z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">答题卡</h2>
            <button 
              onClick={() => setIsOpen(false)} 
              className="lg:hidden text-slate-400 hover:text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => scrollToQuestion(q.id)}
                className={getButtonClass(q)}
              >
                {startIndex + idx + 1}
              </button>
            ))}
          </div>

          <div className="mt-8 border-t pt-6">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">图例</div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded border border-slate-200 bg-white"></div>
                <span>未作答</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded border border-blue-600 bg-blue-600"></div>
                <span>已作答</span>
              </div>
              {isPageRevealed && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-green-200 bg-green-100"></div>
                    <span>正确</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-red-200 bg-red-100"></div>
                    <span>错误</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
