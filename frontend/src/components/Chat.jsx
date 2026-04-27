import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Search, Download, PlusCircle, Zap, Trash2, X, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolCallCard from './ToolCallCard';
import ChartRenderer from './ChartRenderer';
import useDashboard from '../hooks/useDashboard';
import toast from 'react-hot-toast';

export default function Chat({ activeTables, db, messages, sendMessage, removeMessageStep, removeMessage, isThinking, currentIteration, onPin, onBrowseTable }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isThinking) {
      sendMessage(input, activeTables);
      setInput('');
    }
  };

  const starterQuestions = [
    "What are the top 5 records in my table?",
    "Summarize the data for me.",
    "Check for any null values or duplicates.",
    "Export the results of 'SELECT * FROM users' to PDF.",
    "Join my tables and show me the combined view."
  ];

  const handleQuickAction = (template) => {
    setInput(template);
  };

  // Simple markdown-like rendering for agent responses
  const renderContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Table parsing
      if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        const tableRows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableRows.push(lines[i]);
          i++;
        }
        
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-4 rounded-xl border border-white/[0.05] bg-black/20 scroll-thin">
            <table className="w-full text-left border-collapse text-[12px] whitespace-nowrap">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                  {tableRows[0].split('|').filter((_, index, arr) => index > 0 && index < arr.length - 1).map((cell, idx) => (
                    <th key={idx} className="px-4 py-2.5 font-bold text-text-primary uppercase tracking-wider">{cell.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {tableRows.slice(2).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                    {row.split('|').filter((_, index, arr) => index > 0 && index < arr.length - 1).map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 text-text-muted/80">{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // Headers
      if (line.startsWith('### ')) { elements.push(<h4 key={i} className="text-sm font-bold text-text-primary mt-3 mb-1">{line.slice(4)}</h4>); i++; continue; }
      if (line.startsWith('## ')) { elements.push(<h3 key={i} className="text-base font-bold text-text-primary mt-4 mb-1.5">{line.slice(3)}</h3>); i++; continue; }
      if (line.startsWith('# ')) { elements.push(<h2 key={i} className="text-lg font-bold text-text-primary mt-4 mb-2">{line.slice(2)}</h2>); i++; continue; }
      
      // Bold text inline
      let processed = line;
      const parts = [];
      let lastIdx = 0;
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;
      while ((match = boldRegex.exec(processed)) !== null) {
        if (match.index > lastIdx) {
          parts.push(processed.slice(lastIdx, match.index));
        }
        parts.push(<strong key={`b-${i}-${match.index}`} className="font-bold text-text-primary">{match[1]}</strong>);
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < processed.length) parts.push(processed.slice(lastIdx));
      
      if (parts.length === 0) parts.push(processed);
      
      // Empty line
      if (line.trim() === '') { elements.push(<div key={i} className="h-2" />); i++; continue; }
      
      // Deep Linking: Highlight active table names
      const finalParts = [];
      parts.forEach((p, pIdx) => {
        if (typeof p === 'string') {
          const sortedTables = [...activeTables].sort((a, b) => b.length - a.length);
          let currentText = p;
          
          while (currentText) {
            let found = false;
            for (const table of sortedTables) {
              const regex = new RegExp(`\\b${table}\\b`, 'i');
              const match = currentText.match(regex);
              if (match) {
                if (match.index > 0) {
                  finalParts.push(currentText.slice(0, match.index));
                }
                finalParts.push(
                  <button 
                    key={`link-${i}-${pIdx}-${table}-${match.index}`}
                    onClick={() => onBrowseTable(table)}
                    className="px-1.5 py-0.5 -mx-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all font-bold cursor-pointer"
                  >
                    {match[0]}
                  </button>
                );
                currentText = currentText.slice(match.index + match[0].length);
                found = true;
                break;
              }
            }
            if (!found) {
              finalParts.push(currentText);
              currentText = '';
            }
          }
        } else {
          finalParts.push(p);
        }
      });
      
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('• ')) {
        elements.push(<div key={i} className="flex gap-2 ml-1 mb-0.5"><span className="text-primary/50 shrink-0">•</span><span>{finalParts}</span></div>);
      } else {
        elements.push(<p key={i} className="mb-1.5 last:mb-0 leading-relaxed">{finalParts}</p>);
      }
      
      i++;
    }
    
    return elements;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">

      {/* Top Bar */}
      <header className="h-14 border-b border-white/[0.05] flex items-center justify-between px-6 bg-surface/30 backdrop-blur-xl z-20">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${db ? 'bg-success shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-text-muted/30'}`} />
            <span className="text-sm font-semibold tracking-tight">{db?.name || 'No DB Connected'}</span>
          </div>
          <div className="h-3.5 w-px bg-white/[0.06]" />
          <span className="text-[11px] font-medium text-text-muted">{activeTables.length} active table{activeTables.length !== 1 ? 's' : ''}</span>
        </div>
        <AnimatePresence>
          {isThinking && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-[10px] font-semibold text-primary uppercase tracking-wider"
            >
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              Agent Working...
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-thin z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/[0.08] shadow-sm mb-4">
              <Database size={32} className="text-text-muted" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-gradient">
                What shall we build?
              </h2>
              <p className="text-text-muted text-base font-medium leading-relaxed max-w-md mx-auto">
                I'm your autonomous data engineer. Query, analyze, and manipulate your database with natural language.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-lg">
              {starterQuestions.map((q, i) => (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  key={i} 
                  onClick={() => setInput(q)}
                  className="p-3.5 text-left text-[13px] font-medium rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-primary/25 hover:bg-primary/[0.03] transition-all duration-200 text-text-muted hover:text-text-primary leading-snug"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] ${msg.role === 'user' ? 'text-right' : 'text-left'} group/msg relative`}>
                  {msg.role === 'agent' && (
                    <button 
                      onClick={() => removeMessage(msg.id)}
                      className="absolute -right-10 top-0 p-2 text-text-muted hover:text-danger opacity-0 group-hover/msg:opacity-100 transition-opacity"
                      title="Delete message"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  {msg.role === 'agent' ? (
                    <div className="space-y-4">
                      {/* Tool Steps */}
                      <div className="space-y-2">
                        {msg.steps && msg.steps.map((step, idx) => (
                          <ToolCallCard key={idx} step={step} />
                        ))}
                      </div>
                      
                      {/* Final Answer */}
                      {msg.content && (
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[13px] text-text-primary leading-relaxed max-w-none">
                          {renderContent(msg.content)}
                        </div>
                      )}

                      {/* Auto-Charts */}
                      {msg.steps && msg.steps.map((step, sIdx) => {
                        const userMsgIndex = messages.findIndex(m => m.id === msg.id) - 1;
                        const userMsg = userMsgIndex >= 0 ? messages[userMsgIndex] : null;
                        const askedForChart = userMsg && userMsg.content && /(chart|graph|plot|visual|trend|pie|bar|scatter|line)/i.test(userMsg.content);

                        if (!askedForChart) return null;

                        if (step.result) {
                          try {
                            const data = JSON.parse(step.result);
                            if (Array.isArray(data) && data.length > 0) {
                              // Check if chartable (at least one numeric column)
                              const keys = Object.keys(data[0]);
                              const hasNumeric = keys.some(k => typeof data[0][k] === 'number' || !isNaN(parseFloat(data[0][k])));
                              
                              if (hasNumeric) {
                                // Detect Metric vs Chart
                                const isMetric = data.length === 1 && keys.length === 1;
                                
                                return (
                                  <ChartRenderer 
                                    key={`chart-${sIdx}`} 
                                    data={data} 
                                    title={step.tool.replace(/_/g, ' ').toUpperCase()}
                                    onDismiss={() => removeMessageStep(msg.id, sIdx)}
                                    onPin={(config) => {
                                      const sql = step.sql || step.args?.sql || step.args?.sql_query || '';
                                      onPin({
                                        title: config.title || "New Widget",
                                        sql_query: sql,
                                        widget_type: isMetric ? 'metric' : 'chart',
                                        chart_type: config.type,
                                        x_column: config.labelKey,
                                        y_column: config.numericKeys[0],
                                        db_type: db?.type,
                                        db_path: db?.name
                                      });
                                    }}
                                  />
                                );
                              }
                            }
                          } catch (e) { /* not json or not chartable */ }
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <div className="inline-block p-3.5 px-5 rounded-2xl bg-primary text-white shadow-sm font-medium text-[14px]">
                      {msg.content}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 pt-0 z-20">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="relative bg-white/[0.02] rounded-xl p-1.5 flex flex-col border border-white/[0.08] focus-within:border-primary/40 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask the SQL Agent anything..."
                className="w-full bg-transparent border-none focus:ring-0 p-3 min-h-[50px] max-h-[200px] text-[14px] font-medium placeholder:text-text-muted/40 resize-none scroll-thin outline-none"
              />
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-0.5">
                  <button 
                    type="button" 
                    onClick={() => handleQuickAction("Analyze ")} 
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-text-muted/50 hover:text-primary hover:bg-primary/8 transition-all"
                  >
                    <Search size={12} /> Analyze
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleQuickAction("Insert into ")} 
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-text-muted/50 hover:text-secondary hover:bg-secondary/8 transition-all"
                  >
                    <PlusCircle size={12} /> Insert
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={!input.trim() || isThinking}
                  className="w-10 h-10 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:grayscale text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
