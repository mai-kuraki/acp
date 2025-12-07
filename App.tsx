import React, { useState, useEffect, useMemo } from 'react';
import { Question, UserAnswers } from './types';
import QuestionCard from './components/QuestionCard';
import Sidebar from './components/Sidebar';

const PAGE_SIZE = 50;

const App: React.FC = () => {
  const [data, setData] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [pageResultsRevealed, setPageResultsRevealed] = useState<Record<number, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  useEffect(() => {
    localStorage.setItem('exam_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch('./data.json'),
          fetch('./data2.json')
        ]);

        if (!res1.ok) throw new Error(`Failed to load data.json: ${res1.status}`);
        
        let d1 = [], d2 = [];
        try {
          d1 = await res1.json();
        } catch (e) {
          console.error("Error parsing data.json", e);
          throw new Error("Invalid JSON in data.json");
        }

        if (res2.ok) {
          try {
            d2 = await res2.json();
          } catch (e) {
            console.error("Error parsing data2.json", e);
            // We can choose to fail or continue. Let's fail to ensure data integrity.
            throw new Error("Invalid JSON in data2.json");
          }
        } else {
          console.warn(`data2.json not found (${res2.status}), skipping.`);
        }
        
        setData([...d1, ...d2]);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(err.message || "An unknown error occurred");
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Search Logic
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(q =>
      q.question.toLowerCase().includes(lowerQuery) ||
      q.options.some(opt => opt.toLowerCase().includes(lowerQuery))
    );
  }, [data, searchQuery]);

  // Reset page logic when search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageResultsRevealed({});
  }, [searchQuery]);

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
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fid => fid !== id) 
        : [...prev, id]
    );
  };

  const isCurrentPageRevealed = !!pageResultsRevealed[currentPage];

  const handleSubmitPage = () => {
    if (window.confirm("确定要提交本页并查看结果吗？")) {
      setPageResultsRevealed(prev => ({
        ...prev,
        [currentPage]: true
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleJumpToQuestion = (id: string) => {
    // 1. If searching, clear search to ensure question is visible in pagination
    if (searchQuery) {
      setSearchQuery('');
    }

    // 2. Find index in the full data (since search is cleared)
    // Note: We use setTimeout to allow state update (search clearing) to propagate if needed,
    // though setState is batched. If we clear search, `filteredData` becomes `data`.
    // We can calculate target page based on global data index.
    
    const index = data.findIndex(q => q.id === id);
    if (index !== -1) {
      const targetPage = Math.floor(index / PAGE_SIZE) + 1;
      
      // If we are already on the page, just scroll. If not, switch page then scroll.
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
        // We need to wait for render
        setTimeout(() => {
          const el = document.getElementById(`q-${id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        const el = document.getElementById(`q-${id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const pageScore = useMemo(() => {
    if (!isCurrentPageRevealed) return null;
    let correct = 0;
    currentQuestions.forEach(q => {
      const u = userAnswers[q.id] || [];
      const normalize = (arr: string[]) => [...arr].sort().join(',');
      if (normalize(u) === normalize(q.answer)) {
        correct++;
      }
    });
    return { correct, total: currentQuestions.length };
  }, [isCurrentPageRevealed, currentQuestions, userAnswers]);

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

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
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

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="hidden md:flex flex-col items-end mr-2">
              <div className="text-xs text-slate-500 mb-1">
                {searchQuery ? `找到 ${totalQuestions} 题` : `总进度 ${progress.toFixed(0)}%`}
              </div>
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">未找到相关题目</h3>
              <p className="text-slate-500">尝试更换关键词搜索</p>
            </div>
          ) : (
            <>
              {/* Page Score Card */}
              {pageScore && (
                <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg animate-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">本页结果统计</h2>
                      <p className="text-blue-100 opacity-90 text-sm">不错！继续保持学习。</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold">{pageScore.correct} <span className="text-xl opacity-60">/ {pageScore.total}</span></div>
                      <div className="text-xs font-medium uppercase tracking-widest opacity-75 mt-1">正确率: {Math.round((pageScore.correct / pageScore.total) * 100)}%</div>
                    </div>
                  </div>
                </div>
              )}

              {currentQuestions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  index={(currentPage - 1) * PAGE_SIZE + idx}
                  data={q}
                  userAnswer={userAnswers[q.id] || []}
                  onAnswerChange={handleAnswerChange}
                  showResultMode={isCurrentPageRevealed}
                  isFavorite={favorites.includes(q.id)}
                  onToggleFavorite={toggleFavorite}
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
          isPageRevealed={isCurrentPageRevealed}
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

            {!isCurrentPageRevealed ? (
              <button
                onClick={handleSubmitPage}
                className="flex-grow sm:flex-grow-0 px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                提交本页
              </button>
            ) : (
              <div className="flex-grow sm:flex-grow-0 px-6 py-2 bg-slate-100 text-slate-500 font-medium rounded-xl text-center border border-slate-200">
                已完成
              </div>
            )}

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