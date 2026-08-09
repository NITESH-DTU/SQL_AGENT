import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, ShieldCheck, Clock, Database, EyeOff, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function AuditLogModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
    }
  }, [isOpen]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/audit-logs`);
      setLogs(res.data.logs || []);
    } catch (e) {
      toast.error('Failed to load governance audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    return (
      (log.sql_query && log.sql_query.toLowerCase().includes(term)) ||
      (log.block_reason && log.block_reason.toLowerCase().includes(term))
    );
  });

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
        className="relative w-full h-full max-w-6xl glass rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/[0.08] overflow-hidden flex flex-col bg-[#0a0a0f]"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between bg-black/40 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/25 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="text-emerald-400" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Data Governance & Security Audit Log</h2>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">Destructive Blocking • PII Masking • Audit Logs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="px-8 py-4 border-b border-white/[0.04] bg-[#0c0c14] flex items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input 
              type="text"
              placeholder="Search SQL, blocked reasons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500/40 text-white placeholder:text-gray-400/40 font-mono"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{logs.filter(l => !l.was_blocked).length} Safe Executions</span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">{logs.filter(l => l.was_blocked).length} Security Blocks</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-8 bg-[#06060a]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-emerald-400">
              <Loader2 size={40} className="animate-spin mb-4" />
              <p className="font-semibold uppercase tracking-widest text-xs">Fetching Governance Audit Logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShieldCheck size={36} className="mb-2 opacity-20" />
              <p className="text-xs font-medium">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-2xl border transition-all ${
                    log.was_blocked 
                      ? 'bg-rose-950/10 border-rose-500/20 hover:border-rose-500/40' 
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2.5">
                      {log.was_blocked ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 font-bold text-[10px] uppercase tracking-wider border border-rose-500/20">
                          <ShieldAlert size={13} /> BLOCKED
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/20">
                          <ShieldCheck size={13} /> PASSED
                        </div>
                      )}
                      <span className="text-[10px] font-mono text-gray-400/60">{log.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                      {log.execution_time && <span className="flex items-center gap-1"><Clock size={12} /> {log.execution_time}</span>}
                      {log.rows_returned !== undefined && <span>{log.rows_returned} rows</span>}
                    </div>
                  </div>

                  <pre className="text-xs font-mono bg-black/40 p-3 rounded-xl text-white/90 overflow-x-auto border border-white/[0.04]">
                    {log.sql_query}
                  </pre>

                  {log.was_blocked && log.block_reason && (
                    <div className="mt-2 text-xs font-medium text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center gap-2">
                      <ShieldAlert size={14} className="shrink-0" />
                      <span>Security Violation: {log.block_reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
