import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Check, Eye, Settings, BarChart3, FileOutput, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToolCallCard({ step }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { tool, args, result } = step;

  const getToolMeta = () => {
    const name = tool.toLowerCase();
    if (name.includes('query') || name.includes('schema') || name.includes('list') || name.includes('sample') || name.includes('search'))
      return { icon: <Eye className="text-blue-400" size={14} />, category: 'READ', color: 'blue' };
    if (name.includes('insert') || name.includes('update') || name.includes('create'))
      return { icon: <Settings className="text-amber-400" size={14} />, category: 'WRITE', color: 'amber' };
    if (name.includes('rank') || name.includes('agg') || name.includes('stat') || name.includes('detect') || name.includes('compare'))
      return { icon: <BarChart3 className="text-emerald-400" size={14} />, category: 'ANALYSIS', color: 'emerald' };
    if (name.includes('export') || name.includes('import'))
      return { icon: <FileOutput className="text-purple-400" size={14} />, category: 'EXPORT', color: 'purple' };
    return { icon: <Terminal className="text-text-muted" size={14} />, category: 'SYSTEM', color: 'gray' };
  };

  const meta = getToolMeta();

  const categoryStyles = {
    READ: 'border-blue-500/12 bg-blue-500/[0.03]',
    WRITE: 'border-amber-500/12 bg-amber-500/[0.03]',
    ANALYSIS: 'border-emerald-500/12 bg-emerald-500/[0.03]',
    EXPORT: 'border-purple-500/12 bg-purple-500/[0.03]',
    SYSTEM: 'border-white/[0.06] bg-white/[0.02]'
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

  const toolDisplayName = tool.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <motion.div 
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border ${categoryStyles[meta.category]} overflow-hidden transition-all duration-200`}
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-black/25 shrink-0">
            {meta.icon}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted/40">{meta.category}</span>
            <span className="text-[9px] text-text-muted/20">•</span>
            <span className="text-xs font-semibold text-text-primary truncate">{toolDisplayName}</span>
          </div>
          {args && !isExpanded && (
            <span className="text-[10px] text-text-muted/30 font-mono truncate max-w-[180px] hidden sm:inline">
              {JSON.stringify(args).slice(0, 60)}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {result ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/8 text-success text-[9px] font-semibold uppercase tracking-wider border border-success/12">
              <Check size={9} strokeWidth={3} /> Done
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/8 text-primary text-[9px] font-semibold uppercase tracking-wider border border-primary/12">
              <Loader2 size={9} className="animate-spin" /> Running
            </div>
          )}
          <ChevronDown size={13} className={`text-text-muted/30 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.04]"
          >
            <div className="p-3.5 space-y-3 bg-black/30">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted/30">Arguments</span>
                  <Terminal size={9} className="text-text-muted/20" />
                </div>
                <pre className="p-3 rounded-xl bg-black/50 text-[10px] text-text-muted/70 font-mono overflow-x-auto border border-white/[0.04] scroll-thin leading-relaxed">
                  {JSON.stringify(args, null, 2)}
                </pre>
              </div>
              {result && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted/30">Result</span>
                    <Check size={9} className="text-success/40" />
                  </div>
                  <div className="p-3 rounded-xl bg-black/50 text-[10px] text-text-muted/70 font-mono overflow-x-auto border border-white/[0.04] max-h-[200px] overflow-y-auto scroll-thin">
                    <pre className="whitespace-pre-wrap leading-relaxed">{parseResult(result)}</pre>
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
