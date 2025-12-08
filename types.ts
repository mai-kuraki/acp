export interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  answer: string[];
  analysis: string;
}

export type UserAnswers = Record<string, string[]>;

export interface QuestionProps {
  data: Question;
  index: number;
  userAnswer: string[];
  onAnswerChange: (id: string, answer: string[]) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isRevealed: boolean;
  onToggleReveal: (id: string) => void;
}

export interface SidebarProps {
  questions: Question[]; // Current page questions for grid
  allQuestions: Question[]; // All questions for favorites lookup
  userAnswers: UserAnswers;
  favorites: string[];
  revealedQuestions: Set<string>;
  currentPage: number;
  pageSize: number;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  onJumpToQuestion: (id: string) => void;
}