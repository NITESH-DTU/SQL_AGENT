import React, { useState, useEffect } from 'react';
import { X, Network, Database, Key, Link as LinkIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function ERDVisualizer({ isOpen, onClose }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchERD();
    }
  }, [isOpen]);

  const fetchERD = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/erd`);
      setNodes(res.data.nodes || []);
      setEdges(res.data.edges || []);
    } catch (e) {
      toast.error('Failed to load ERD');
    } finally {
      setLoading(false);
    }
  };

  const getTargetEdges = (tableName) => edges.filter(e => e.source === tableName);

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
        className="relative w-full h-full max-w-7xl glass rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/[0.08] overflow-hidden flex flex-col bg-[#0a0a0f]"
      >
        <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between bg-black/40 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/25 shadow-lg shadow-indigo-500/10">
              <Network className="text-indigo-400" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-text-primary">Entity Relationship Diagram</h2>
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mt-0.5">Database Map</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-12 bg-[#06060a] relative">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-indigo-400">
              <Loader2 size={40} className="animate-spin mb-4" />
              <p className="font-semibold uppercase tracking-widest text-xs">Analyzing Schema...</p>
            </div>
          ) : nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-muted">No tables found</div>
          ) : (
            <div className="flex flex-wrap gap-8 items-start justify-center relative z-10">
              {nodes.map((node, i) => {
                const tableEdges = getTargetEdges(node.id);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={node.id} 
                    className="w-72 bg-[#0d0d14] rounded-2xl border border-white/[0.08] shadow-xl overflow-hidden hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2">
                      <Database size={14} className="text-indigo-400" />
                      <h3 className="font-bold text-sm text-text-primary tracking-wide truncate">{node.id}</h3>
                    </div>
                    <div className="p-2 space-y-0.5">
                      {node.columns && node.columns.map(col => {
                        const isFk = tableEdges.find(e => e.sourceHandle === col.name);
                        return (
                          <div key={col.name} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/[0.02] group transition-colors">
                            <div className="flex items-center gap-2 truncate">
                              {col.pk ? <Key size={12} className="text-amber-400 shrink-0" /> : <div className="w-3" />}
                              <span className="text-xs font-medium text-text-primary/90 truncate font-mono">{col.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{col.type}</span>
                              {isFk && (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded" title={`References ${isFk.target}.${isFk.targetHandle}`}>
                                  <LinkIcon size={10} /> {isFk.target}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
