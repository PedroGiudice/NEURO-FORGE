import React, { useEffect, useRef, useState } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onTriggerCompletion: () => void;
  isGenerating: boolean;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, onTriggerCompletion, isGenerating }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lines, setLines] = useState<number[]>([1]);

  useEffect(() => {
    const lineCount = value.split('\n').length;
    setLines(Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1));
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
      e.preventDefault();
      onTriggerCompletion();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-row bg-obsidian border border-gray-800 rounded-lg overflow-hidden group focus-within:border-neon-blue transition-colors duration-300">
      {/* Line Numbers */}
      <div className="w-12 bg-basalt text-gray-600 font-mono text-sm py-4 text-right pr-3 select-none border-r border-gray-800">
        {lines.map((line) => (
          <div key={line} className="h-6 leading-6">{line}</div>
        ))}
      </div>

      {/* Text Area */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent text-gray-100 font-mono text-sm p-4 leading-6 resize-none focus:outline-none z-10 relative"
          spellCheck={false}
          placeholder="// Type your prompt here...
// Press Cmd+J (or Ctrl+J) to auto-complete using local AI."
        />
        
        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 pointer-events-none bg-neon-blue/5 z-20 flex items-end justify-end p-4">
            <span className="text-neon-blue text-xs font-mono animate-pulse">
              Generating sequences...
            </span>
          </div>
        )}
      </div>
      
      {/* Visual Glint */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-neon-blue/10 to-transparent pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity" />
    </div>
  );
};

export default Editor;