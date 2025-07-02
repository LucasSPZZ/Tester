import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showCopy?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language = 'text', 
  title,
  showCopy = true
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg overflow-hidden">
      {/* Header */}
      {(title || showCopy) && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            {title && (
              <span className="text-sm font-medium text-white">{title}</span>
            )}
            {language && (
              <span className="text-xs px-2 py-1 bg-[#2a2a2a] text-[#888888] rounded">
                {language}
              </span>
            )}
          </div>
          
          {showCopy && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copiar
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* Code Content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-[#e5e5e5] whitespace-pre-wrap font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}; 