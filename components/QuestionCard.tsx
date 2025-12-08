import React from 'react';
import { QuestionProps } from '../types';

const QuestionCard: React.FC<QuestionProps> = ({ 
  data, 
  index, 
  userAnswer, 
  onAnswerChange, 
  isFavorite,
  onToggleFavorite,
  isRevealed,
  onToggleReveal
}) => {
  const isMultiple = data.type === '多选题';
  
  // Normalizing answers for comparison (sorting ensures order doesn't matter)
  const normalize = (arr: string[]) => [...arr].sort().join(',');
  const isCorrect = normalize(userAnswer) === normalize(data.answer);

  const handleOptionClick = (optionPrefix: string) => {
    if (isRevealed) return; 

    let newAnswer: string[];
    if (isMultiple) {
      if (userAnswer.includes(optionPrefix)) {
        newAnswer = userAnswer.filter(a => a !== optionPrefix);
      } else {
        newAnswer = [...userAnswer, optionPrefix];
      }
    } else {
      newAnswer = [optionPrefix];
    }
    onAnswerChange(data.id, newAnswer);
  };

  const getOptionStatus = (prefix: string) => {
    if (!isRevealed) {
      return userAnswer.includes(prefix) ? 'selected' : 'default';
    }
    
    const isSelected = userAnswer.includes(prefix);
    const isActual = data.answer.includes(prefix);

    if (isActual) return 'correct';
    if (isSelected && !isActual) return 'wrong';
    return 'default'; // Unselected and not the answer
  };

  const statusStyles = {
    default: "border-gray-200 hover:bg-slate-50 hover:border-blue-300 cursor-pointer",
    selected: "bg-blue-50 border-blue-500 shadow-sm cursor-pointer",
    correct: "bg-green-50 border-green-500 text-green-800 ring-1 ring-green-500/20",
    wrong: "bg-red-50 border-red-500 text-red-800 opacity-80",
  };

  const indicatorStyles = {
    default: "border-gray-300 bg-white group-hover:border-blue-400",
    selected: "bg-blue-600 border-blue-600 text-white",
    correct: "bg-green-600 border-green-600 text-white",
    wrong: "bg-red-500 border-red-500 text-white",
  };

  return (
    <div 
      id={`q-${data.id}`} 
      className={`bg-white rounded-2xl shadow-sm border p-6 mb-6 scroll-mt-28 transition-all duration-300 ${
        isRevealed 
          ? (isCorrect ? 'border-green-200 shadow-green-50' : 'border-red-200 shadow-red-50') 
          : 'border-slate-100 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex gap-4">
        <div className="flex-shrink-0 mt-1">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-sm font-mono">
            {index + 1}
          </span>
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                isMultiple ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {data.type}
              </span>
              {isRevealed && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isCorrect ? '正确' : '错误'}
                </span>
              )}
            </div>
            
            <button 
              onClick={() => onToggleFavorite(data.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-yellow-400 bg-yellow-50 hover:bg-yellow-100' 
                  : 'text-slate-300 hover:text-slate-400 hover:bg-slate-100'
              }`}
              title={isFavorite ? "取消收藏" : "收藏题目"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isFavorite ? "fill-current" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          </div>
          
          <h3 className="text-lg font-medium text-slate-800 leading-relaxed mb-4">
            {data.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {data.options.map((opt) => {
              // Extract prefix (e.g., "A") assuming format "A. Description" or just "A"
              const match = opt.match(/^([A-Z])/);
              const prefix = match ? match[1] : opt.charAt(0);
              const status = getOptionStatus(prefix);

              return (
                <div 
                  key={prefix} 
                  onClick={() => handleOptionClick(prefix)}
                  className={`group flex items-start p-3.5 rounded-xl border-2 transition-all duration-200 ${statusStyles[status]}`}
                >
                  <div className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center border mr-3.5 mt-0.5 transition-colors ${indicatorStyles[status]}`}>
                    {status !== 'default' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        {status === 'wrong' 
                          ? <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          : <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        }
                      </svg>
                    )}
                  </div>
                  <span className={`text-base ${status === 'default' ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Feedback Section */}
          <div className="mt-6">
            {!isRevealed ? (
              <button
                onClick={() => onToggleReveal(data.id)}
                className="text-sm font-medium text-slate-500 hover:text-blue-600 hover:bg-slate-50 px-4 py-2 rounded-lg border border-transparent hover:border-slate-200 transition-all"
              >
                查看答案
              </button>
            ) : (
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">正确答案</div>
                  <div className="text-lg font-bold text-green-600">{data.answer.join(' ')}</div>
                </div>
                {data.analysis && (
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">解析</div>
                    <p className="text-slate-700 text-sm leading-relaxed">{data.analysis}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;