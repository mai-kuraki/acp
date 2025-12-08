import React, { useState } from 'react';
import { SidebarProps, Question } from '../types';

const Sidebar: React.FC<SidebarProps> = ({ 
  questions, // current page questions
  allQuestions, // all questions for favorites lookup
  userAnswers, 
  favorites,
  revealedQuestions,
  currentPage, 
  pageSize,
  isOpen,
  setIsOpen,
  onJumpToQuestion
}) => {
  const [activeTab, setActiveTab] = useState<'page' | 'favorites'>('page');
  const startIndex = (currentPage - 1) * pageSize;

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (window.innerWidth < 1024) setIsOpen(false);
    }
  };

  const getStatusColor = (q: Question) => {
    const hasAnswered = userAnswers[q.id] && userAnswers[q.id].length > 0;
    const isRevealed = revealedQuestions.has(q.id);

    if (!hasAnswered) return 'text-slate-400 bg-slate-50 border-slate-200';

    // Answered, but NOT revealed -> Neutral "Answered" state (Blue)
    if (!isRevealed) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }

    // Answered AND Revealed -> Show Result (Green/Red)
    const normalize = (arr: string[]) => [...(arr || [])].sort().join(',');
    const isCorrect = normalize(userAnswers[q.id] || []) === normalize(q.answer);

    if (isCorrect) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else {
      return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getButtonClass = (q: Question) => {
    const hasAnswered = userAnswers[q.id] && userAnswers[q.id].length > 0;
    const isRevealed = revealedQuestions.has(q.id);
    const base = "w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center transition-all border ";

    if (hasAnswered) {
      if (!isRevealed) {
        // Just Answered
        return base + "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200";
      }

      // Answered & Revealed
      const normalize = (arr: string[]) => [...(arr || [])].sort().join(',');
      const isCorrect = normalize(userAnswers[q.id] || []) === normalize(q.answer);
      
      if (isCorrect) {
        return base + "bg-green-500 text-white border-green-500 shadow-md shadow-green-200";
      } else {
        return base + "bg-red-500 text-white border-red-500 shadow-md shadow-red-200";
      }
    }
    // Unanswered
    return base + "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600";
  };

  // Get favorite question objects
  const favoriteQuestions = allQuestions.filter(q => favorites.includes(q.id));

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-slate-200 z-40 transform transition-transform duration-300 ease-in-out flex flex-col lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header / Tabs */}
        <div className="p-4 border-b border-slate-100 bg-white z-10">
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="text-lg font-bold text-slate-800">菜单</h2>
            <button onClick={() => setIsOpen(false)} className="text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('page')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'page' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              当前页
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'favorites' ? 'bg-white text-yellow-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              我的收藏 ({favorites.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'page' ? (
            <>
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
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-green-500 bg-green-500"></div>
                    <span>正确</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-red-500 bg-red-500"></div>
                    <span>错误</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {favoriteQuestions.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p>暂无收藏题目</p>
                </div>
              ) : (
                favoriteQuestions.map((q, idx) => {
                  const globalIndex = allQuestions.findIndex(aq => aq.id === q.id);
                  const isRevealed = revealedQuestions.has(q.id);
                  const hasAnswered = userAnswers[q.id]?.length > 0;
                  
                  // For favorites list, maybe we should always show the status?
                  // Or stick to the same "reveal" logic?
                  // Usually favorites list implies review, so showing status is helpful.
                  // But to be consistent with the Sidebar Grid logic above:
                  // Let's reuse getStatusColor logic which now respects `isRevealed`.
                  // BUT, `getStatusColor` returns Tailwind classes.
                  // Let's assume for Favorites List, we want to know if it's correct/wrong/answered.
                  
                  // Actually, let's keep it simple: If answered, show "Answered". 
                  // If revealed, show "Correct/Wrong".
                  
                  let badgeText = '未答';
                  let badgeClass = 'text-slate-400 bg-slate-50 border-slate-200';
                  
                  if (hasAnswered) {
                    if (isRevealed) {
                        const normalize = (arr: string[]) => [...(arr || [])].sort().join(',');
                        const isCorrect = normalize(userAnswers[q.id] || []) === normalize(q.answer);
                        badgeText = isCorrect ? '正确' : '错误';
                        badgeClass = isCorrect 
                            ? 'text-green-600 bg-green-50 border-green-200' 
                            : 'text-red-600 bg-red-50 border-red-200';
                    } else {
                        badgeText = '已答';
                        badgeClass = 'text-blue-600 bg-blue-50 border-blue-200';
                    }
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        onJumpToQuestion(q.id);
                        if (window.innerWidth < 1024) setIsOpen(false);
                      }}
                      className="w-full text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500">
                          #{globalIndex + 1}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2 leading-snug">
                        {q.question}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;