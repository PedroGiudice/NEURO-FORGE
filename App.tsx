
import React, { useState, useEffect } from 'react';
import { aiService } from './services/aiService';
import { getStreamlitCode } from './services/codeGenerator';
import Editor from './components/Editor';
import { ModelStatus, AnalysisResult, LogEntry, AppSettings, TabView } from './types';

// Icons
const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 12.15 13 2 10.5 2h.5A2.5 12.15 13 2 14.5 2h.5A2.5 12.15 13 2 18.5 2M9.5 22A2.5 12.15 13 2 10.5 22h.5A2.5 12.15 13 2 14.5 22h.5A2.5 12.15 13 2 18.5 22"/><path d="M2 13.5V13A2.5 12.15 13 2 2 9.5v-.5A2.5 12.15 13 2 2 5.5v-.5A2.5 12.15 13 2 2 2M22 13.5V13A2.5 12.15 13 2 22 9.5v-.5A2.5 12.15 13 2 22 5.5v-.5A2.5 12.15 13 2 22 2"/></svg>
);

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

const TerminalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
);

const CodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
);

export default function App() {
  const [content, setContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabView>('telemetry');
  
  // Model States
  const [genStatus, setGenStatus] = useState<ModelStatus>({ task: 'generator', status: 'idle' });
  const [classStatus, setClassStatus] = useState<ModelStatus>({ task: 'classifier', status: 'idle' });
  const [conflictStatus, setConflictStatus] = useState<ModelStatus>({ task: 'conflict', status: 'idle' });
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    generation: {
      temperature: 0.8,
      maxTokens: 50
    },
    analysis: {
      modelId: aiService.availableModels.classifier[0].id,
      threshold: 0.5
    }
  });

  const [copied, setCopied] = useState(false);

  const addLog = (message: string, source: LogEntry['source'] = 'SYSTEM') => {
    setLogs(prev => [...prev.slice(-4), {
      id: Math.random().toString(36),
      source,
      message,
      timestamp: new Date()
    }]);
  };

  const initModels = async () => {
    // 1. Generator
    if (!aiService.isModelLoaded('generator')) {
      setGenStatus({ task: 'generator', status: 'loading', progress: 0 });
      try {
        await aiService.loadModel('generator', (p) => setGenStatus(prev => ({ ...prev, progress: p })));
        setGenStatus({ task: 'generator', status: 'ready' });
        addLog('Neural Generator Online', 'SYSTEM');
      } catch (e) {
        setGenStatus({ task: 'generator', status: 'error' });
      }
    }

    // 2. Classifier
    if (!aiService.isModelLoaded('classifier')) {
      setClassStatus({ task: 'classifier', status: 'loading', progress: 0 });
      try {
        await aiService.setClassifierModel(settings.analysis.modelId, (p) => setClassStatus(prev => ({ ...prev, progress: p })));
        setClassStatus({ task: 'classifier', status: 'ready' });
        addLog('Analysis Engine Online', 'SYSTEM');
      } catch (e) {
        setClassStatus({ task: 'classifier', status: 'error' });
      }
    }

    // 3. Conflict Engine (Zero Shot)
    if (!aiService.isModelLoaded('conflict')) {
      setConflictStatus({ task: 'conflict', status: 'loading', progress: 0 });
      try {
        await aiService.loadModel('conflict', (p) => setConflictStatus(prev => ({ ...prev, progress: p })));
        setConflictStatus({ task: 'conflict', status: 'ready' });
        addLog('Conflict Scanner Online', 'SYSTEM');
      } catch (e) {
        setConflictStatus({ task: 'conflict', status: 'error' });
      }
    }
  };

  // Initial Load
  useEffect(() => {
    initModels();
  }, []);

  // Handle Model Swap
  useEffect(() => {
    if (classStatus.status === 'ready' || classStatus.status === 'error') {
       // Re-load if ID changed
       const swap = async () => {
         setClassStatus({ task: 'classifier', status: 'loading', progress: 0 });
         addLog(`Switching to ${settings.analysis.modelId.split('/').pop()}`, 'SYSTEM');
         try {
           await aiService.setClassifierModel(settings.analysis.modelId, (p) => setClassStatus(prev => ({ ...prev, progress: p })));
           setClassStatus({ task: 'classifier', status: 'ready' });
         } catch(e) {
           setClassStatus({ task: 'classifier', status: 'error' });
         }
       };
       swap();
    }
  }, [settings.analysis.modelId]);

  // Real-time Analysis
  useEffect(() => {
    if (content.length < 5 || classStatus.status !== 'ready') return;

    const timer = setTimeout(async () => {
      setClassStatus(prev => ({ ...prev, status: 'working' }));
      try {
        const result = await aiService.analyze(content);
        setAnalysis({ ...result, timestamp: Date.now() });
        setClassStatus(prev => ({ ...prev, status: 'ready' }));
      } catch (e) {
        console.error(e);
        setClassStatus(prev => ({ ...prev, status: 'error' }));
      }
    }, 1500); // Debounce slightly longer for dual analysis

    return () => clearTimeout(timer);
  }, [content, classStatus.status]);

  const handleGenerate = async () => {
    if (genStatus.status !== 'ready' || !content.trim()) return;

    setGenStatus(prev => ({ ...prev, status: 'working' }));
    addLog(`Synthesizing (Temp: ${settings.generation.temperature})...`, 'AI');
    
    try {
      const completion = await aiService.generate(content, settings.generation);
      setContent(prev => prev + completion);
      addLog('Sequence completed', 'AI');
      setGenStatus(prev => ({ ...prev, status: 'ready' }));
    } catch (e) {
      addLog('Generation failed', 'SYSTEM');
      setGenStatus(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getStreamlitCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addLog('Source code extracted to clipboard', 'SYSTEM');
  };

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
        <button 
          onClick={() => setActiveTab('telemetry')}
          title="Telemetry Deck"
          className={`p-3 rounded-lg transition-colors ${activeTab === 'telemetry' ? 'bg-gray-800 text-neon-cyan' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <ActivityIcon />
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          title="System Config"
          className={`p-3 rounded-lg transition-colors ${activeTab === 'config' ? 'bg-gray-800 text-neon-cyan' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <SettingsIcon />
        </button>
        <button 
          onClick={() => setActiveTab('source')}
          title="Extract Source"
          className={`p-3 rounded-lg transition-colors ${activeTab === 'source' ? 'bg-gray-800 text-neon-cyan' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <CodeIcon />
        </button>
        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse mt-4" title="System Online" />
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
              GEN
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(classStatus.status)}`} />
              ANA
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(conflictStatus.status)}`} />
              CNF
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
          </div>

          {/* Right Pane (Tabbed) */}
          <div className="w-80 border-l border-gray-800 bg-obsidian/80 backdrop-blur flex flex-col transition-all duration-300">
            
            {activeTab === 'telemetry' && (
              <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-neon-cyan text-sm font-bold uppercase tracking-wider">
                    <ActivityIcon />
                    Neural Telemetry
                  </div>
                  
                  {/* Sentiment Card */}
                  <div className="bg-basalt border border-gray-800 rounded-lg p-4 relative overflow-hidden">
                    <div className="text-xs text-gray-500 mb-2 font-mono">PRIMARY SENTIMENT</div>
                    {analysis ? (
                      <div>
                         <div className="flex justify-between items-end mb-1">
                           <span className={`text-lg font-bold ${analysis.sentiment.label === 'POSITIVE' ? 'text-neon-green' : analysis.sentiment.label === 'NEGATIVE' ? 'text-neon-red' : 'text-gray-400'}`}>
                             {analysis.sentiment.label}
                           </span>
                           <span className="text-xs font-mono text-gray-400">{(analysis.sentiment.score * 100).toFixed(0)}%</span>
                         </div>
                         <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                           <div 
                             className={`h-full transition-all duration-500 ${analysis.sentiment.label === 'POSITIVE' ? 'bg-neon-green' : 'bg-neon-red'}`}
                             style={{ width: `${analysis.sentiment.score * 100}%` }}
                           />
                         </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 font-mono py-2">NO SIGNAL</div>
                    )}
                  </div>

                  {/* Conflict Analysis Card */}
                  <div className="bg-basalt border border-gray-800 rounded-lg p-4 relative overflow-hidden">
                    <div className="text-xs text-gray-500 mb-2 font-mono">TECH CONFLICT SCAN</div>
                    {analysis && analysis.conflict ? (
                      <div>
                         <div className="flex justify-between items-end mb-1">
                           <span className={`text-md font-bold ${analysis.conflict.score > 0.5 ? 'text-neon-yellow' : 'text-gray-400'}`}>
                             {analysis.conflict.score > 0.5 ? 'CONFLICT DETECTED' : 'CONSISTENT'}
                           </span>
                           <span className="text-xs font-mono text-gray-400">{(analysis.conflict.score * 100).toFixed(0)}%</span>
                         </div>
                         <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                           <div 
                             className={`h-full transition-all duration-500 bg-neon-yellow`}
                             style={{ width: `${analysis.conflict.score * 100}%` }}
                           />
                         </div>
                         <div className="mt-2 text-[10px] text-gray-500 leading-tight">
                           Probability of conflicting technical information or logical contradictions.
                         </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 font-mono py-2">
                        {conflictStatus.status === 'loading' ? 'INITIALIZING ENGINE...' : 'NO SIGNAL'}
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
                  <div className="flex-1 bg-black border border-gray-800 rounded-lg p-3 overflow-y-auto font-mono text-[10px] space-y-2 font-mono max-h-[200px]">
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
              </div>
            )}

            {activeTab === 'config' && (
              <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="flex items-center gap-2 text-neon-cyan text-sm font-bold uppercase tracking-wider">
                    <SettingsIcon />
                    Configuration
                  </div>

                  {/* Generation Settings */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-gray-500 border-b border-gray-800 pb-1">GENERATOR MATRIX</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>Temperature</span>
                        <span className="font-mono text-neon-blue">{settings.generation.temperature}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" max="1.5" step="0.1"
                        value={settings.generation.temperature}
                        onChange={(e) => setSettings(s => ({...s, generation: {...s.generation, temperature: parseFloat(e.target.value)}}))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                      />
                      <div className="flex justify-between text-[10px] text-gray-600">
                        <span>PRECISE</span>
                        <span>CREATIVE</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>Max Tokens</span>
                        <span className="font-mono text-neon-blue">{settings.generation.maxTokens}</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" max="200" step="10"
                        value={settings.generation.maxTokens}
                        onChange={(e) => setSettings(s => ({...s, generation: {...s.generation, maxTokens: parseInt(e.target.value)}}))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                      />
                    </div>
                  </div>

                  {/* Analysis Settings */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-gray-500 border-b border-gray-800 pb-1">ANALYSIS MODULE</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-xs text-gray-300">Classifier Model</label>
                      <select 
                        value={settings.analysis.modelId}
                        onChange={(e) => setSettings(s => ({...s, analysis: {...s.analysis, modelId: e.target.value}}))}
                        className="w-full bg-basalt border border-gray-700 rounded p-2 text-xs text-white focus:border-neon-purple focus:outline-none"
                      >
                        {aiService.availableModels.classifier.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                     <div className="p-3 bg-blue-900/10 border border-blue-900/30 rounded text-[10px] text-blue-200/70 leading-relaxed">
                      Note: Switching analysis models triggers a dynamic download from HuggingFace Hub. 
                      Conflict analysis runs a separate Zero-Shot pipeline.
                    </div>
                  </div>
              </div>
            )}

            {activeTab === 'source' && (
               <div className="flex-1 p-0 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-4 flex items-center justify-between border-b border-gray-800 bg-obsidian">
                     <div className="flex items-center gap-2 text-neon-cyan text-sm font-bold uppercase tracking-wider">
                        <CodeIcon />
                        Source Extraction
                     </div>
                     <button 
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 text-[10px] bg-neon-blue/10 text-neon-blue border border-neon-blue/20 hover:bg-neon-blue/20 px-2 py-1 rounded transition-colors"
                     >
                        {copied ? 'EXTRACTED' : 'COPY'} <CopyIcon />
                     </button>
                  </div>
                  <div className="flex-1 relative overflow-hidden bg-black/50">
                     <pre className="absolute inset-0 p-4 overflow-auto text-[10px] font-mono text-gray-400 selection:bg-neon-purple/20">
                        {getStreamlitCode()}
                     </pre>
                  </div>
               </div>
            )}

            {/* Actions */}
            {activeTab !== 'source' && (
              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={handleGenerate}
                  disabled={genStatus.status !== 'ready'}
                  className="w-full py-3 bg-neon-blue/10 border border-neon-blue/50 text-neon-blue font-bold rounded hover:bg-neon-blue/20 hover:border-neon-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest"
                >
                  Execute Generation
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
