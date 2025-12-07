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
  showResultMode: boolean;
}
