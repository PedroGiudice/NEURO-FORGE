
import React, { useState, useEffect, useCallback } from 'react';
import { aiService } from './services/aiService';
import Editor from './components/Editor';
import { ModelStatus, AnalysisResult, LogEntry } from './types';

// Icons
const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 12.15 13 2 10.5 2h.5A2.5 12.15 13 2 14.5 2h.5A2.5 12.15 13 2 18.5 2M9.5 22A2.5 12.15 13 2 10.5 22h.5A2.5 12.15 13 2 14.5 22h.5A2.5 12.15 13 2 18.5 22"/><path d="M2 13.5V13A2.5 12.15 13 2 2 9.5v-.5A2.5 12.15 13 2 2 5.5v-.5A2.5 12.15 13 2 2 2M22 13.5V13A2.5 12.15 13 2 22 9.5v-.5A2.5 12.15 13 2 22 5.5v-.5A2.5 12.15 13 2 22 2"/></svg>
);

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);

const TerminalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
);

export default function App() {
  const [content, setContent] = useState<string>('');
  const [genStatus, setGenStatus] = useState<ModelStatus>({ task: 'generator', status: 'idle' });
  const [classStatus, setClassStatus] = useState<ModelStatus>({ task: 'classifier', status: 'idle' });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const addLog = (message: string, source: LogEntry['source'] = 'SYSTEM') => {
    setLogs(prev => [...prev.slice(-4), {
      id: Math.random().toString(36),
      source,
      message,
      timestamp: new Date()
    }]);
  };

  // Initialize Models
  useEffect(() => {
    const initModels = async () => {
      // 1. Load Generator
      if (!aiService.isModelLoaded('generator')) {
        setGenStatus({ task: 'generator', status: 'loading', progress: 0 });
        try {
          await aiService.loadModel('generator', (p) => {
            setGenStatus(prev => ({ ...prev, progress: p }));
          });
          setGenStatus({ task: 'generator', status: 'ready' });
          addLog('Neural Generator Online', 'SYSTEM');
        } catch (e) {
          setGenStatus({ task: 'generator', status: 'error', message: 'Failed to load' });
          addLog('Generator Load Failed', 'SYSTEM');
        }
      }

      // 2. Load Classifier
      if (!aiService.isModelLoaded('classifier')) {
        setClassStatus({ task: 'classifier', status: 'loading', progress: 0 });
        try {
          await aiService.loadModel('classifier', (p) => {
            setClassStatus(prev => ({ ...prev, progress: p }));
          });
          setClassStatus({ task: 'classifier', status: 'ready' });
          addLog('Sentiment Engine Online', 'SYSTEM');
        } catch (e) {
          setClassStatus({ task: 'classifier', status: 'error' });
        }
      }
    };

    initModels();
  }, []);

  // Real-time Analysis Debounce
  useEffect(() => {
    if (content.length < 5 || classStatus.status !== 'ready') return;

    const timer = setTimeout(async () => {
      setClassStatus(prev => ({ ...prev, status: 'working' }));
      try {
        const result = await aiService.analyze(content);
        // Fix: Explicitly spread result and cast the label to the union type defined in AnalysisResult
        setAnalysis({ 
          label: result.label as AnalysisResult['label'],
          score: result.score,
          timestamp: Date.now() 
        });
        setClassStatus(prev => ({ ...prev, status: 'ready' }));
      } catch (e) {
        console.error(e);
        setClassStatus(prev => ({ ...prev, status: 'error' }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, classStatus.status]);

  // Handle Text Generation
  const handleGenerate = async () => {
    if (genStatus.status !== 'ready' || !content.trim()) return;

    setGenStatus(prev => ({ ...prev, status: 'working' }));
    addLog('Synthesizing completion...', 'AI');
    
    try {
      const completion = await aiService.generate(content);
      setContent(prev => prev + completion);
      addLog('Sequence completed', 'AI');
      setGenStatus(prev => ({ ...prev, status: 'ready' }));
    } catch (e) {
      addLog('Generation failed', 'SYSTEM');
      setGenStatus(prev => ({ ...prev, status: 'error' }));
    }
  };

  // UI Components helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-neon-green';
      case 'working': return 'bg-neon-blue animate-pulse';
      case 'loading': return 'bg-neon-yellow';
      case 'error': return 'bg-neon-red';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="flex h-screen w-full bg-void text-gray-200 overflow-hidden font-sans selection:bg-neon-purple/30 selection:text-white">
      {/* Sidebar */}
      <div className="w-16 border-r border-gray-800 bg-obsidian flex flex-col items-center py-6 gap-6 z-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-lg shadow-neon-blue/20">
          <BrainIcon />
        </div>
        <div className="flex-1" />
        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" title="System Online" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-gray-800 bg-obsidian/50 backdrop-blur flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-white">NEURO<span className="text-neon-blue">FORGE</span></h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700">LOCAL_INFERENCE</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(genStatus.status)}`} />
              GEN: {genStatus.status.toUpperCase()}
              {genStatus.status === 'loading' && ` ${Math.round(genStatus.progress || 0)}%`}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(classStatus.status)}`} />
              ANA: {classStatus.status.toUpperCase()}
              {classStatus.status === 'loading' && ` ${Math.round(classStatus.progress || 0)}%`}
            </div>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 flex overflow-hidden">
          {/* Editor Pane */}
          <div className="flex-1 p-4 flex flex-col min-w-0 bg-gradient-to-b from-void to-obsidian">
            <Editor 
              value={content} 
              onChange={setContent} 
              onTriggerCompletion={handleGenerate}
              isGenerating={genStatus.status === 'working'}
            />
            <div className="mt-2 flex justify-between items-center text-xs text-gray-500 font-mono">
              <div>{content.length} CHARS // {content.split(/\s+/).filter(Boolean).length} WORDS</div>
              <div>CMD+J TO GENERATE</div>
            </div>
          </div>

          {/* Right Intelligence Pane */}
          <div className="w-80 border-l border-gray-800 bg-obsidian/80 backdrop-blur p-4 flex flex-col gap-6">
            
            {/* Analysis Module */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-neon-cyan text-sm font-bold uppercase tracking-wider">
                <ActivityIcon />
                Neural Telemetry
              </div>
              
              <div className="bg-basalt border border-gray-800 rounded-lg p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50" />
                
                {analysis ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">SENTIMENT POLARITY</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${analysis.label === 'POSITIVE' ? 'bg-neon-green' : 'bg-neon-red'}`}
                            style={{ width: `${analysis.score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono w-8 text-right">{(analysis.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className={`text-xs mt-1 font-mono ${analysis.label === 'POSITIVE' ? 'text-neon-green' : 'text-neon-red'}`}>
                        DETECTED: {analysis.label}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 font-mono text-center py-4">
                    WAITING FOR INPUT STREAM...
                  </div>
                )}
              </div>
            </div>

            {/* Log Stream */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 text-neon-purple text-sm font-bold uppercase tracking-wider mb-3">
                <TerminalIcon />
                System Log
              </div>
              <div className="flex-1 bg-black border border-gray-800 rounded-lg p-3 overflow-y-auto font-mono text-[10px] space-y-2 font-mono">
                {logs.length === 0 && <span className="text-gray-700">// System initialized</span>}
                {logs.map(log => (
                  <div key={log.id} className="border-l-2 border-gray-800 pl-2 py-0.5 animate-pulse-fast">
                    <span className="text-gray-500">[{log.timestamp.toLocaleTimeString().split(' ')[0]}]</span>{' '}
                    <span className={log.source === 'AI' ? 'text-neon-blue' : log.source === 'SYSTEM' ? 'text-neon-purple' : 'text-white'}>
                      {log.source}
                    </span>
                    <div className="text-gray-400">{log.message}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleGenerate}
              disabled={genStatus.status !== 'ready'}
              className="w-full py-3 bg-neon-blue/10 border border-neon-blue/50 text-neon-blue font-bold rounded hover:bg-neon-blue/20 hover:border-neon-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest"
            >
              Execute Generation
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
