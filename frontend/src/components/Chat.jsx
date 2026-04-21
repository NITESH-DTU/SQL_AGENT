import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Database, Table, Search, Download, PlusCircle, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../hooks/useAgent';
import ToolCallCard from './ToolCallCard';

export default function Chat({ activeTables, db, messages, sendMessage, isThinking, currentIteration }) {
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

      {/* Top Bar */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-surface/40 backdrop-blur-xl z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-bold tracking-tight">{db?.name || 'No DB Connected'}</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{activeTables.length} Active Tables</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {isThinking && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest"
              >
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                Agent Thinking...
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-thin z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 shadow-2xl relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <Sparkles size={48} className="text-primary relative z-10" />
            </motion.div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tight bg-gradient-to-b from-white to-text-muted bg-clip-text text-transparent">
                What shall we build?
              </h2>
              <p className="text-text-muted text-lg font-medium leading-relaxed">
                I'm your autonomous data engineer. I can query, analyze, and manipulate your SQL database using advanced tool calling.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
              {starterQuestions.map((q, i) => (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  onClick={() => setInput(q)}
                  className="p-4 text-left text-sm font-semibold rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-10">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'agent' ? (
                    <div className="space-y-6">
                      {/* Tool Steps */}
                      <div className="space-y-3">
                        {msg.steps && msg.steps.map((step, idx) => (
                          <ToolCallCard key={idx} step={step} />
                        ))}
                      </div>
                      
                      {/* Final Answer */}
                      {msg.content && (
                        <div className="p-8 rounded-[32px] glass-card border-l-4 border-l-secondary relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                            <Sparkles size={40} className="text-secondary" />
                          </div>
                          <div className="relative z-10 prose prose-invert prose-p:leading-relaxed prose-headings:font-black max-w-none text-sm font-medium">
                            {msg.content.split('\n').map((line, i) => (
                              <p key={i} className="mb-2 last:mb-0">{line}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="inline-block p-5 px-8 rounded-[28px] bg-gradient-to-br from-primary to-primary/80 text-white shadow-2xl shadow-primary/30 font-bold text-lg tracking-tight">
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
      <div className="p-10 pt-0 z-20">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/40 to-secondary/40 rounded-[40px] blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
            <div className="relative glass rounded-[36px] p-2.5 flex flex-col gap-2 border-white/10">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask the SQL Agent..."
                className="w-full bg-transparent border-none focus:ring-0 p-5 min-h-[70px] max-h-[300px] text-lg font-semibold placeholder:text-text-muted/50 resize-none scroll-thin"
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={() => handleQuickAction("Analyze ")} 
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                  >
                    <Search size={14} /> Analyze
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleQuickAction("Insert into ")} 
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-secondary hover:bg-secondary/10 transition-all"
                  >
                    <PlusCircle size={14} /> Insert
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleQuickAction("Export last result to PDF")} 
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-success hover:bg-success/10 transition-all"
                  >
                    <Download size={14} /> Export
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={!input.trim() || isThinking}
                  className="w-14 h-14 rounded-2xl bg-primary hover:bg-primary/80 disabled:opacity-20 disabled:grayscale text-white flex items-center justify-center transition-all shadow-xl shadow-primary/40 active:scale-95"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
