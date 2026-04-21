import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Check, AlertCircle, Eye, Settings, BarChart3, FileOutput } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToolCallCard({ step }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { tool, args, result } = step;

  const getToolIcon = () => {
    const name = tool.toLowerCase();
    if (name.includes('query') || name.includes('schema') || name.includes('list')) return <Eye className="text-blue-400" size={16} />;
    if (name.includes('insert') || name.includes('update') || name.includes('create')) return <Settings className="text-amber-400" size={16} />;
    if (name.includes('rank') || name.includes('agg') || name.includes('stat') || name.includes('detect')) return <BarChart3 className="text-green-400" size={16} />;
    if (name.includes('export') || name.includes('import')) return <FileOutput className="text-purple-400" size={16} />;
    return <Terminal className="text-text-muted" size={16} />;
  };

  const getToolCategory = () => {
    const name = tool.toLowerCase();
    if (name.includes('query') || name.includes('schema') || name.includes('list') || name.includes('sample') || name.includes('search')) return 'READ';
    if (name.includes('insert') || name.includes('update') || name.includes('create')) return 'WRITE';
    if (name.includes('rank') || name.includes('agg') || name.includes('stat') || name.includes('detect') || name.includes('compare')) return 'ANALYSIS';
    return 'SYSTEM';
  };

  const category = getToolCategory();
  const categoryColors = {
    READ: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
    WRITE: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    ANALYSIS: 'border-green-500/20 bg-green-500/5 text-green-400',
    SYSTEM: 'border-white/10 bg-white/5 text-text-muted'
  };

  const parseResult = (res) => {
    if (!res) return null;
    try {
      const parsed = JSON.parse(res);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return String(res);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-2xl border ${categoryColors[category]} overflow-hidden transition-all duration-300 shadow-lg`}
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-black/30 shrink-0">
            {getToolIcon()}
          </div>
          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-50">{category}</span>
              <span className="text-xs font-bold truncate">{tool.replace(/_/g, ' ')}</span>
            </div>
            {args && !isExpanded && (
              <span className="text-[10px] text-text-muted font-mono truncate max-w-[200px] opacity-70">
                {JSON.stringify(args)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {result ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[9px] font-black uppercase tracking-widest border border-success/20">
              <Check size={10} /> Done
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse" /> Running
            </div>
          )}
          {isExpanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-4 space-y-4 bg-black/40">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Arguments</span>
                  <Terminal size={10} className="text-text-muted opacity-40" />
                </div>
                <pre className="p-3 rounded-xl bg-black/60 text-[10px] text-text-muted font-mono overflow-x-auto border border-white/5 scroll-thin">
                  {JSON.stringify(args, null, 2)}
                </pre>
              </div>
              {result && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Result</span>
                    <Check size={10} className="text-success opacity-40" />
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 text-[10px] text-text-muted font-mono overflow-x-auto border border-white/5 max-h-[250px] overflow-y-auto scroll-thin">
                    <pre className="whitespace-pre-wrap">{parseResult(result)}</pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
