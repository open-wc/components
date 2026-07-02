import { TemplateResult } from 'lit';

export interface Questionnaire<T> {
  type: QuestionType;
  headline: (ctx?: T) => TemplateResult;
  text: (ctx?: T) => TemplateResult;
  options?: AnswerOptions[];
}

export type QuestionType = 'intro' | 'question' | 'outro';

export interface AnswerOptions {
  label: string;
  score: number;
  category?: AnswerCategory;
}

export type AnswerCategory = 'defensive' | 'offensive' | 'contractor';

export interface ResultEntry {
  name: string;
  data: number;
}
export type Result = ResultEntry[];
