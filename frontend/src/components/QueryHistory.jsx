import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Clock, Search, Bookmark, BookmarkCheck, Trash2, 
  Copy, Play, Calendar, Database, Filter, ChevronRight, ChevronDown, Download
} from 'lucide-react';
import useQueryHistory from '../hooks/useQueryHistory';

export default function QueryHistory({ isOpen, onClose, onReRun }) {
  const { history, isLoading, fetchHistory, toggleBookmark, deleteHistoryItem, clearHistory } = useQueryHistory();
  const [filter, setFilter] = useState('all'); // all, bookmarked, agent, manual
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) fetchHistory(1, filter === 'bookmarked');
  }, [isOpen, filter, fetchHistory]);

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.sql_text.toLowerCase().includes(search.toLowerCase());
    const matchesType = filter === 'all' || filter === 'bookmarked' || item.source === filter;
    return matchesSearch && matchesType;
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast here
  };

  const handleExport = (sql, format = 'csv') => {
    const API_BASE = 'http://localhost:8000/api';
    const filename = `export_${Date.now()}.${format}`;
    const url = `${API_BASE}/export/${format}?sql=${encodeURIComponent(sql)}&filename=${filename}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-end p-4"
    >
      <motion.div 
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="w-full max-w-xl h-full bg-surface border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary tracking-tight">Query History</h2>
              <p className="text-xs text-text-muted">Track and bookmark your SQL operations</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-text-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-white/[0.02]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input 
                  type="text"
                  placeholder="Search queries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/[0.08] rounded-xl text-[13px] text-text-primary placeholder:text-text-muted/40 focus:border-primary/40 focus:bg-white/[0.04] transition-all outline-none"
                />
              </div>
              <div className="relative">
                 <select 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)}
                    className="py-2 pl-3 pr-8 bg-white/[0.02] border border-white/[0.08] rounded-xl text-[13px] text-text-primary focus:border-primary/40 outline-none appearance-none font-medium cursor-pointer"
                 >
                    <option value="all" className="bg-card">All Queries</option>
                    <option value="bookmarked" className="bg-card">Bookmarked</option>
                    <option value="agent" className="bg-card">Agent</option>
                    <option value="manual" className="bg-card">Manual</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
              </div>
            </div>
            
            <div className="flex items-center justify-between px-1 text-[11px] font-medium text-text-muted">
              <span>{filteredHistory.length} result{filteredHistory.length !== 1 ? 's' : ''} found</span>
              <button 
                onClick={clearHistory}
                className="hover:text-danger flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={12} /> Clear History
              </button>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-thin">
          {isLoading && history.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm text-text-muted">Loading history...</span>
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40 grayscale text-center p-8">
              <Clock size={48} className="mb-4 text-text-muted" />
              <h3 className="text-lg font-semibold text-text-primary">No history found</h3>
              <p className="text-sm text-text-muted max-w-[200px]">Run some queries to see them appear here.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div 
                key={item.id}
                className="group relative bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 hover:border-primary/20 hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <pre className="text-[11px] font-mono text-text-primary bg-black/30 p-2.5 rounded-lg border border-white/[0.04] overflow-x-auto whitespace-pre-wrap max-h-[120px] scroll-thin leading-relaxed">
                      {item.sql_text}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => toggleBookmark(item.id)}
                      className={`p-2 rounded-lg transition-all ${
                        item.bookmarked ? 'bg-amber-500/10 text-amber-500' : 'hover:bg-white/5 text-text-muted'
                      }`}
                    >
                      {item.bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                    <button 
                      onClick={() => onReRun(item.sql_text)}
                      className="p-2 hover:bg-success/10 text-text-muted hover:text-success rounded-lg transition-all"
                      title="Re-run query"
                    >
                      <Play size={16} />
                    </button>
                    <button 
                      onClick={() => handleExport(item.sql_text, 'csv')}
                      className="p-2 hover:bg-blue-500/10 text-text-muted hover:text-blue-500 rounded-lg transition-all"
                      title="Export CSV"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-2 hover:bg-danger/10 text-text-muted hover:text-danger rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-text-muted font-medium">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.04]">
                    <Database size={10} /> {item.db_name || 'N/A'}
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${
                    item.source === 'agent' ? 'bg-purple-500/10 text-purple-400 border-purple-500/10' : 'bg-blue-500/10 text-blue-400 border-blue-500/10'
                  } uppercase tracking-wider font-bold`}>
                    {item.source}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={10} /> {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="font-bold text-text-primary/60">{item.result_count}</span> rows
                    <span className="text-text-muted/30">•</span>
                    <span className="text-text-primary/60">{item.execution_time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
