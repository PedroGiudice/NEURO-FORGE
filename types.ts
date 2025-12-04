
export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  tags: string[];
}

export interface AnalysisResult {
  sentiment: {
    label: string;
    score: number;
  };
  conflict?: {
    label: string;
    score: number; // 0 to 1, probability of conflict
  };
  timestamp: number;
}

export interface ModelStatus {
  task: 'generator' | 'classifier' | 'conflict';
  status: 'idle' | 'loading' | 'ready' | 'error' | 'working';
  progress?: number;
  message?: string;
}

export interface AppSettings {
  generation: {
    temperature: number;
    maxTokens: number;
  };
  analysis: {
    modelId: string;
    threshold: number;
  };
}

export type TabView = 'telemetry' | 'config' | 'source';

export interface LogEntry {
  id: string;
  source: 'SYSTEM' | 'AI' | 'USER';
  message: string;
  timestamp: Date;
}
