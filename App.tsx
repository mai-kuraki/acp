import React, { useState, useEffect, useMemo } from 'react';
import { Question, UserAnswers } from './types';
import QuestionCard from './components/QuestionCard';
import Sidebar from './components/Sidebar';

const PAGE_SIZE = 50;

const App: React.FC = () => {
  const [data, setData] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Page from LocalStorage
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = localStorage.getItem('exam_current_page');
      return saved ? parseInt(saved, 10) : 1;
    } catch (e) {
      return 1;
    }
  });

  // Initialize Answers from LocalStorage
  const [userAnswers, setUserAnswers] = useState<UserAnswers>(() => {
    try {
      const saved = localStorage.getItem('exam_user_answers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load user answers", e);
      return {};
    }
  });

  // Track which questions have been "revealed" (Check Answer clicked)
  // Initialize with all questions that have answers, to support "Refresh -> Show Answer" behavior.
  const [revealedQuestions, setRevealedQuestions] = useState<Set<string>>(() => {
    try {
      // If we are loading from storage, we assume "history" implies revealed for those answered.
      const savedAnswers = localStorage.getItem('exam_user_answers');
      if (savedAnswers) {
        const parsed = JSON.parse(savedAnswers);
        return new Set(Object.keys(parsed));
      }
      return new Set();
    } catch (e) {
      return new Set();
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFavoritesMode, setIsFavoritesMode] = useState(false);
  
  // Favorites State with persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('exam_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load favorites", e);
      return [];
    }
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('exam_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('exam_user_answers', JSON.stringify(userAnswers));
  }, [userAnswers]);

  useEffect(() => {
    localStorage.setItem('exam_current_page', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch('./data.json'),
          fetch('./data2.json')
        ]);

        if (!res1.ok) throw new Error(`Failed to load data.json: ${res1.status} ${res1.statusText}`);
        if (!res2.ok) throw new Error(`Failed to load data2.json: ${res2.status} ${res2.statusText}`);

        const d1 = await res1.json();
        const d2 = await res2.json();
        
        setData([...d1, ...d2]);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(err.message || "Failed to load question data. Please ensure data.json and data2.json exist.");
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter Logic (Search + Favorites)
  const filteredData = useMemo(() => {
    let result = data;

    // 1. Filter by Favorites Mode
    if (isFavoritesMode) {
      result = result.filter(q => favorites.includes(q.id));
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(q =>
        q.question.toLowerCase().includes(lowerQuery) ||
        q.options.some(opt => opt.toLowerCase().includes(lowerQuery))
      );
    }

    return result;
  }, [data, searchQuery, isFavoritesMode, favorites]);

  // Reset page logic when search or mode changes
  useEffect(() => {
    if (searchQuery || isFavoritesMode) {
      setCurrentPage(1);
    }
  }, [searchQuery, isFavoritesMode]);

  const totalQuestions = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / PAGE_SIZE));
  
  const currentQuestions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredData.slice(start, end);
  }, [currentPage, filteredData]);

  // Progress logic
  const totalGlobalQuestions = data.length;
  const totalAnswered = Object.keys(userAnswers).length;
  const progress = totalGlobalQuestions > 0 ? Math.min((totalAnswered / totalGlobalQuestions) * 100, 100) : 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsSidebarOpen(false);
  }, [currentPage]);

  const handleAnswerChange = (id: string, answer: string[]) => {
    setUserAnswers(prev => ({
      ...prev,
      [id]: answer
    }));
    // Note: We DO NOT auto-reveal here. The user must click "Check Answer".
  };

  const handleToggleReveal = (id: string) => {
    setRevealedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Option to hide answer? The UI doesn't really support "hiding" once shown easily,
        // but let's allow toggle for flexibility.
        // next.delete(id); 
        // Actually, usually "Check Answer" is a one-way reveal in this context until reset.
        // But for toggle button, adding is sufficient.
        // If we want to allow re-hiding, we can delete. 
        // Let's assume "Show" means show.
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fid => fid !== id) 
        : [...prev, id]
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleJumpToQuestion = (id: string) => {
    if (searchQuery) setSearchQuery('');
    if (isFavoritesMode && !favorites.includes(id)) {
        setIsFavoritesMode(false);
    }
    setIsFavoritesMode(false); 

    setTimeout(() => {
      const index = data.findIndex(q => q.id === id);
      if (index !== -1) {
        const targetPage = Math.floor(index / PAGE_SIZE) + 1;
        setCurrentPage(targetPage);
        setTimeout(() => {
          const el = document.getElementById(`q-${id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }, 50);
  };

  const handleResetProgress = () => {
    if (window.confirm("确定要清空所有答题记录吗？此操作无法撤销。")) {
      setUserAnswers({});
      setRevealedQuestions(new Set());
      localStorage.removeItem('exam_user_answers');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">正在加载题库...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">加载失败</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg hidden sm:block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-800 hidden lg:block">AI Knowledge Exam</h1>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
              {filteredData.length === 0 ? '无结果' : `第 ${currentPage} / ${totalPages} 页`}
            </span>
          </div>

          {/* Search Bar & Filters */}
          <div className="flex-1 max-w-md flex items-center gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="搜索题目关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-1.5 sm:py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-sm focus:shadow-md"
              />
            </div>
            
            <button
              onClick={() => setIsFavoritesMode(!isFavoritesMode)}
              title={isFavoritesMode ? "显示全部" : "只看收藏"}
              className={`p-2 sm:px-3 sm:py-2 rounded-full border transition-all flex items-center gap-1.5 flex-shrink-0 ${
                isFavoritesMode
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFavoritesMode ? "fill-current" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="hidden sm:inline text-sm font-medium">我的收藏</span>
            </button>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="hidden md:flex flex-col items-end mr-2 cursor-pointer group" title="点击重置进度" onClick={handleResetProgress}>
              <div className="text-xs text-slate-500 mb-1 group-hover:text-red-500 transition-colors">
                {isFavoritesMode 
                  ? `收藏 ${filteredData.length} / ${favorites.length}` 
                  : `总进度 ${progress.toFixed(0)}%`
                }
              </div>
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500 group-hover:bg-red-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {favorites.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-grow flex justify-center max-w-7xl mx-auto w-full relative">
        {/* Main Content */}
        <main className="w-full lg:w-[calc(100%-20rem)] px-4 py-8 pb-32">
          
          {filteredData.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                {isFavoritesMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {isFavoritesMode ? "暂无收藏内容" : "未找到相关题目"}
              </h3>
              <p className="text-slate-500">
                {isFavoritesMode ? "点击题目右上角的星号即可收藏" : "尝试更换关键词搜索"}
              </p>
            </div>
          ) : (
            <>
              {currentQuestions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  index={(currentPage - 1) * PAGE_SIZE + idx}
                  data={q}
                  userAnswer={userAnswers[q.id] || []}
                  onAnswerChange={handleAnswerChange}
                  isFavorite={favorites.includes(q.id)}
                  onToggleFavorite={toggleFavorite}
                  isRevealed={revealedQuestions.has(q.id)}
                  onToggleReveal={handleToggleReveal}
                />
              ))}
            </>
          )}
        </main>

        {/* Sidebar Navigation */}
        <Sidebar
          questions={currentQuestions}
          allQuestions={data}
          userAnswers={userAnswers}
          favorites={favorites}
          revealedQuestions={revealedQuestions}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onJumpToQuestion={handleJumpToQuestion}
        />
      </div>

      {/* Footer / Pagination Controls */}
      {filteredData.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-30 lg:pr-80">
          <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一页
            </button>

            <div className="text-slate-500 text-sm font-medium">
              第 {currentPage} 页 / 共 {totalPages} 页
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              下一页
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;