export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  tags: string[];
}

export interface AnalysisResult {
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  timestamp: number;
}

export interface ModelStatus {
  task: 'generator' | 'classifier';
  status: 'idle' | 'loading' | 'ready' | 'error' | 'working';
  progress?: number;
  message?: string;
}

export type TabView = 'editor' | 'settings';

export interface LogEntry {
  id: string;
  source: 'SYSTEM' | 'AI' | 'USER';
  message: string;
  timestamp: Date;
}