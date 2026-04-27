import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, Clock, Terminal, Trash2, ChevronRight, AlertCircle, CheckCircle2, Table as TableIcon, Copy, RotateCcw, Loader2, Database, Hash, Timer, LayoutDashboard, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';

const API_BASE = 'http://localhost:8000/api';

export default function SQLConsole({ onClose, db, initialSql = '', onPin, activeTables }) {
  const [sql, setSql] = useState(initialSql);
  const [result, setResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('sql_console_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState('editor');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (initialSql) {
      setSql(initialSql);
      setActiveTab('editor');
    }
  }, [initialSql]);

  const executeQuery = useCallback(async () => {
    if (!sql.trim() || isExecuting) return;

    setIsExecuting(true);
    setResult(null);
    setOptimizationResult(null);

    try {
      const res = await axios.post(`${API_BASE}/execute-sql`, { 
        sql: sql.trim(),
        active_tables: activeTables 
      });
      const data = res.data;

      setResult(data);

      // Save to history
      if (!data.error) {
        const entry = {
          sql: sql.trim(),
          type: data.type || 'unknown',
          timestamp: new Date().toISOString(),
          rowCount: data.rowCount || 0,
          executionTime: data.executionTime || '0ms',
        };
        const newHistory = [entry, ...history.filter(h => h.sql !== sql.trim())].slice(0, 30);
        setHistory(newHistory);
        localStorage.setItem('sql_console_history', JSON.stringify(newHistory));
      }
    } catch (err) {
      setResult({ error: err.response?.data?.detail || err.message || 'Execution failed' });
    } finally {
      setIsExecuting(false);
    }
  }, [sql, isExecuting, history, activeTables]);

  const optimizeQuery = async () => {
    if (!sql.trim() || isOptimizing) return;
    setIsOptimizing(true);
    setOptimizationResult(null);
    setResult(null);
    try {
      const res = await axios.post(`${API_BASE}/optimize-sql`, { sql: sql.trim(), active_tables: activeTables });
      setOptimizationResult(res.data.suggestion);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Use a ref to avoid stale closures in Monaco
  const executeQueryRef = useRef(executeQuery);
  useEffect(() => {
    executeQueryRef.current = executeQuery;
  }, [executeQuery]);

  const loadFromHistory = (entry) => {
    setSql(entry.sql);
    setActiveTab('editor');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('sql_console_history');
    toast.success('History cleared');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const lineCount = sql.split('\n').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full h-full max-w-6xl max-h-[90vh] glass rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/[0.08] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between bg-black/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/25 shadow-lg shadow-primary/10">
              <Terminal className="text-primary" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gradient">SQL Console</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{db?.name || 'No DB'} • {db?.type || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-black/40 rounded-xl p-1 border border-white/[0.06]">
              {['editor', 'history'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab ? 'bg-primary/15 text-primary border border-primary/25' : 'text-text-muted hover:text-text-primary border border-transparent'
                  }`}
                >
                  {tab === 'editor' ? <Terminal size={12} className="inline mr-1.5" /> : <Clock size={12} className="inline mr-1.5" />}
                  {tab}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-white/[0.06] rounded-xl transition-all text-text-muted hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'editor' ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Editor Area */}
              <div className="flex-none border-b border-white/[0.06]">
                <div className="flex items-center justify-between px-6 py-2 bg-black/20">
                  <div className="flex items-center gap-3">
                    <span className="label-caps text-primary/60">Query Editor</span>
                    <span className="text-[9px] font-mono text-text-muted/40">{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSql('')}
                      className="p-1.5 rounded-lg text-text-muted/40 hover:text-text-muted hover:bg-white/[0.04] transition-all"
                      title="Clear editor"
                    >
                      <RotateCcw size={13} />
                    </button>
                    <button
                      onClick={() => copyToClipboard(sql)}
                      className="p-1.5 rounded-lg text-text-muted/40 hover:text-text-muted hover:bg-white/[0.04] transition-all"
                      title="Copy query"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                  <div className="border-b border-white/[0.06] bg-black/20">
                    <Editor
                      height="300px"
                      defaultLanguage="sql"
                      theme="vs-dark"
                      value={sql}
                      onChange={(value) => setSql(value || '')}
                      onMount={(editor, monaco) => {
                        // Register Autocomplete
                        monaco.languages.registerCompletionItemProvider('sql', {
                          provideCompletionItems: async (model, position) => {
                            const word = model.getWordUntilPosition(position);
                            const range = {
                              startLineNumber: position.lineNumber,
                              endLineNumber: position.lineNumber,
                              startColumn: word.startColumn,
                              endColumn: word.endColumn,
                            };
                            
                            const textUntilPosition = model.getValueInRange({
                              startLineNumber: 1,
                              startColumn: 1,
                              endLineNumber: position.lineNumber,
                              endColumn: position.column,
                            });

                            try {
                              const res = await axios.post(`${API_BASE}/autocomplete`, { sql: textUntilPosition });
                              const suggestions = res.data.suggestions || [];
                              
                              return {
                                suggestions: suggestions.map(s => ({
                                  label: s,
                                  kind: monaco.languages.CompletionItemKind.Method,
                                  insertText: s,
                                  range: range,
                                }))
                              };
                            } catch (e) {
                              return { suggestions: [] };
                            }
                          }
                        });
                        
                        // Handle Ctrl+Enter
                        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                          if (executeQueryRef.current) executeQueryRef.current();
                        });
                      }}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        readOnly: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 },
                        backgroundColor: 'transparent'
                      }}
                    />
                  </div>
                {/* Execute Bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-black/20 border-t border-white/[0.04]">
                  <span className="text-[10px] text-text-muted/50 font-medium">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-text-muted/60 font-mono text-[9px] border border-white/[0.08]">Ctrl</kbd>
                    {' + '}
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-text-muted/60 font-mono text-[9px] border border-white/[0.08]">Enter</kbd>
                    {' to execute'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={optimizeQuery}
                      disabled={!sql.trim() || isOptimizing || isExecuting}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      {isOptimizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {isOptimizing ? 'Analyzing...' : 'AI Optimize'}
                    </button>
                    <button
                      onClick={executeQuery}
                      disabled={!sql.trim() || isExecuting || isOptimizing}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/85 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all active:scale-[0.97]"
                    >
                      {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      {isExecuting ? 'Executing...' : 'Run Query'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Area */}
              <div className="flex-1 overflow-auto scroll-thin">
                {isExecuting || isOptimizing ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-16">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/15 blur-2xl rounded-full" />
                      <Loader2 size={36} className="text-primary animate-spin relative z-10" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted animate-pulse">
                      {isOptimizing ? 'AI Analyzing Query...' : 'Executing Query...'}
                    </p>
                  </div>
                ) : optimizationResult ? (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <Sparkles size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-text-primary">AI Optimization Report</h3>
                    </div>
                    <div className="prose prose-invert max-w-none text-sm text-text-muted">
                      {optimizationResult.split('\n').map((line, i) => {
                        if (line.startsWith('### ')) return <h4 key={i} className="text-sm font-bold text-text-primary mt-4 mb-2">{line.slice(4)}</h4>;
                        if (line.startsWith('## ')) return <h3 key={i} className="text-base font-bold text-text-primary mt-6 mb-3">{line.slice(3)}</h3>;
                        if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-bold text-text-primary mt-8 mb-4">{line.slice(2)}</h2>;
                        if (line.startsWith('```sql')) return null;
                        if (line.startsWith('```')) return <div key={i} className="h-4" />;
                        return <p key={i} className="mb-2 leading-relaxed">{line}</p>;
                      })}
                    </div>
                  </div>
                ) : result ? (
                  <div className="h-full flex flex-col">
                    {/* Result Status Bar */}
                    <div className={`px-6 py-3 flex items-center justify-between border-b shrink-0 ${
                      result.error ? 'bg-danger/5 border-danger/15' : 'bg-success/5 border-success/15'
                    }`}>
                      <div className="flex items-center gap-3">
                        {result.error ? (
                          <AlertCircle size={15} className="text-danger" />
                        ) : (
                          <CheckCircle2 size={15} className="text-success" />
                        )}
                        <span className={`text-xs font-bold uppercase tracking-wider ${result.error ? 'text-danger' : 'text-success'}`}>
                          {result.error ? 'Error' : result.type === 'read' ? 'Query Successful' : 'Write Successful'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {result.executionTime && (
                          <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                            <Timer size={11} />
                            {result.executionTime}
                          </div>
                        )}
                        {result.rowCount !== undefined && (
                          <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                            <Hash size={11} />
                            {result.rowCount} row{result.rowCount !== 1 ? 's' : ''}
                          </div>
                        )}
                        <button
                          onClick={() => onPin({
                            title: 'Console Query',
                            sql_query: sql,
                            widget_type: result.rowCount === 1 && result.columns.length === 1 ? 'metric' : 'table',
                            db_type: db?.type,
                            db_path: db?.name
                          })}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[10px] font-bold uppercase tracking-wider ml-2"
                        >
                          <LayoutDashboard size={11} /> Pin to Dashboard
                        </button>
                      </div>
                    </div>

                    {/* Result Content */}
                    {result.error ? (
                      <div className="p-6">
                        <div className="p-5 rounded-2xl bg-danger/5 border border-danger/15">
                          <pre className="text-sm font-mono text-danger/80 whitespace-pre-wrap leading-relaxed">{result.error}</pre>
                        </div>
                      </div>
                    ) : result.type === 'read' && result.rows ? (
                      <div className="flex-1 overflow-auto scroll-thin">
                        {result.rows.length > 0 ? (
                          <table className="w-full text-left border-collapse min-w-max">
                            <thead className="sticky top-0 bg-surface/95 backdrop-blur-xl z-10">
                              <tr>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted/50 border-b border-white/[0.06] w-12 text-center">#</th>
                                {result.columns.map(col => (
                                  <th key={col} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-primary/70 border-b border-white/[0.06]">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                              {result.rows.map((row, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                  <td className="px-4 py-3 text-[10px] font-mono text-text-muted/30 text-center">{i + 1}</td>
                                  {result.columns.map(col => (
                                    <td key={col} className="px-5 py-3 text-sm font-medium text-text-muted group-hover:text-text-primary transition-colors font-mono">
                                      {row[col] === null ? <span className="text-text-muted/20 italic text-xs">NULL</span> : String(row[col])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-12 text-center">
                            <Database size={32} className="mx-auto text-text-muted/20 mb-3" />
                            <p className="text-xs font-bold uppercase tracking-wider text-text-muted/40">Query returned 0 rows</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4 border border-success/20">
                          <CheckCircle2 size={28} className="text-success" />
                        </div>
                        <p className="text-sm font-bold text-text-primary mb-1">Statement Executed Successfully</p>
                        <p className="text-xs text-text-muted">{result.executionTime}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-16 opacity-20">
                    <Terminal size={40} className="mb-3" />
                    <p className="text-xs font-bold uppercase tracking-[0.15em]">Write a query and hit Run</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-auto scroll-thin p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="label-caps">Query History ({history.length})</span>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-danger/60 hover:text-danger transition-colors">
                    <Trash2 size={12} /> Clear All
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <div className="text-center py-20 opacity-20">
                  <Clock size={40} className="mx-auto mb-3" />
                  <p className="text-xs font-bold uppercase tracking-[0.15em]">No queries yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry, idx) => (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={idx}
                      onClick={() => loadFromHistory(entry)}
                      className="w-full text-left p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-primary/25 hover:bg-primary/[0.03] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <pre className="text-xs font-mono text-text-muted group-hover:text-text-primary transition-colors truncate flex-1 whitespace-pre-wrap max-h-16 overflow-hidden">
                          {entry.sql}
                        </pre>
                        <ChevronRight size={14} className="text-text-muted/30 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                      </div>
                      <div className="flex items-center gap-4 mt-2.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          entry.type === 'read' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/15' : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                        }`}>
                          {entry.type}
                        </span>
                        {entry.rowCount > 0 && (
                          <span className="text-[9px] font-mono text-text-muted/40">{entry.rowCount} rows</span>
                        )}
                        <span className="text-[9px] font-mono text-text-muted/40">{entry.executionTime}</span>
                        <span className="text-[9px] font-mono text-text-muted/30 ml-auto">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
