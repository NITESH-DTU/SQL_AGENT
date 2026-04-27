import React, { useState, useEffect } from 'react';
import { X, Activity, Database, AlertCircle, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export default function DataProfiler({ isOpen, onClose, activeTables }) {
  const [selectedTable, setSelectedTable] = useState(activeTables[0] || '');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTables.length > 0 && !selectedTable) {
      setSelectedTable(activeTables[0]);
    }
  }, [isOpen, activeTables, selectedTable]);

  useEffect(() => {
    if (selectedTable && isOpen) {
      fetchProfile(selectedTable);
    }
  }, [selectedTable, isOpen]);

  const fetchProfile = async (table) => {
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const res = await axios.get(`${API_BASE}/profile/${table}`);
      setProfile(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="relative w-full h-full max-w-5xl glass rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/[0.08] overflow-hidden flex flex-col"
      >
        <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between bg-black/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/25 shadow-lg shadow-amber-500/10">
              <Activity className="text-amber-500" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-text-primary">Data Quality Profiler</h2>
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mt-0.5">Automated Health Check</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar for Tables */}
          <div className="w-64 border-r border-white/[0.05] bg-black/20 flex flex-col">
            <div className="p-4 border-b border-white/[0.05]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Select Table</span>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-1">
              {activeTables.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedTable === t ? 'bg-amber-500/15 text-amber-400' : 'hover:bg-white/5 text-text-muted'
                  }`}
                >
                  <Database size={14} />
                  <span className="truncate">{t}</span>
                </button>
              ))}
              {activeTables.length === 0 && (
                <div className="text-center p-4 text-text-muted/50 text-xs">No active tables</div>
              )}
            </div>
          </div>

          {/* Profile Area */}
          <div className="flex-1 overflow-y-auto scroll-thin bg-black/10">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <Loader2 size={32} className="animate-spin text-amber-500" />
                <span className="text-sm font-medium text-text-muted">Profiling Data...</span>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-danger">
                <AlertCircle size={32} />
                <span>{error}</span>
              </div>
            ) : profile ? (
              <div className="p-8">
                <div className="mb-8 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary">{profile.table}</h3>
                    <p className="text-text-muted mt-1">{profile.total_rows.toLocaleString()} Total Rows</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">{profile.profile.length}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Columns</div>
                    </div>
                    <div className="w-px h-10 bg-white/[0.1]" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-danger">
                        {profile.profile.filter(c => c.issues.length > 0).length}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Flags</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Column Analysis</h4>
                  {profile.profile.map((col, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-base font-bold text-text-primary">{col.name}</span>
                          <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] font-mono text-text-muted">{col.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {col.issues.length === 0 ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 size={12} /> Healthy
                            </span>
                          ) : (
                            col.issues.map((issue, idx) => (
                              <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                                <AlertCircle size={12} /> {issue}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-black/20 border border-white/[0.03]">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Null Values</div>
                          <div className="flex items-end gap-2">
                            <span className="text-lg font-bold text-text-primary">{col.nulls.toLocaleString()}</span>
                            <span className="text-sm text-text-muted font-medium mb-0.5">({col.null_pct}%)</span>
                          </div>
                          {col.null_pct > 0 && (
                            <div className="w-full h-1 bg-white/[0.05] rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-amber-500" style={{ width: `${col.null_pct}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="p-3 rounded-xl bg-black/20 border border-white/[0.03]">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Unique Values</div>
                          <div className="flex items-end gap-2">
                            <span className="text-lg font-bold text-text-primary">{col.unique.toLocaleString()}</span>
                            <span className="text-sm text-text-muted font-medium mb-0.5">({((col.unique / profile.total_rows) * 100).toFixed(1)}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted/50">
                Select a table to view its profile
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
