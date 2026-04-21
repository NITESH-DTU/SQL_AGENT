import React, { useState } from 'react';
import { X, Plus, Trash2, Code, Sparkles, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const TYPES = ['TEXT', 'INTEGER', 'REAL', 'BOOLEAN', 'TIMESTAMP', 'UUID', 'JSON', 'BLOB'];

export default function TableBuilder({ onClose, onSuccess }) {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState([
    { name: 'id', type: 'INTEGER', primary_key: true, auto_increment: true, not_null: true, unique: true }
  ]);
  const [seedAI, setSeedAI] = useState(false);
  const [seedRows, setSeedRows] = useState(10);
  const [isCreating, setIsCreating] = useState(false);

  const addColumn = () => {
    setColumns([...columns, { name: '', type: 'TEXT', primary_key: false, auto_increment: false, not_null: false, unique: false }]);
  };

  const removeColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index, field, value) => {
    const newCols = [...columns];
    newCols[index][field] = value;
    setColumns(newCols);
  };

  const generateSQL = () => {
    const colDefs = columns.map(c => {
      let line = `${c.name || 'column'} ${c.type}`;
      if (c.primary_key) line += " PRIMARY KEY";
      if (c.not_null) line += " NOT NULL";
      if (c.unique) line += " UNIQUE";
      if (c.auto_increment) line += " AUTOINCREMENT";
      return line;
    }).join(', ');
    return `CREATE TABLE ${tableName || 'table_name'} (\n  ${colDefs}\n);`;
  };

  const handleCreate = async () => {
    if (!tableName) return toast.error("Table name required");
    setIsCreating(true);
    try {
      await axios.post('http://localhost:8000/api/create-table', {
        table_name: tableName,
        columns,
        seed_ai: seedAI,
        seed_rows: parseInt(seedRows)
      });
      toast.success("Table architected successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Creation failed");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        className="relative w-full max-w-5xl glass rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center border border-secondary/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Plus className="text-secondary" size={36} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter">Table Architect</h2>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">Schema Engineering Studio</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-text-muted hover:text-white">
            <X size={32} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 scroll-thin">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary/60 px-2">Table Identifier</label>
                <input 
                  type="text" 
                  value={tableName}
                  onChange={e => setTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="e.g. analytics_payload" 
                  className="w-full bg-black/60 border border-white/10 rounded-[28px] py-6 px-8 focus:border-secondary/50 focus:ring-0 transition-all font-black text-xl tracking-tight placeholder:opacity-20"
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">Structural Units</label>
                  <button onClick={addColumn} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 text-[10px] font-black uppercase tracking-widest transition-all">
                    <Plus size={14} /> Add Property
                  </button>
                </div>

                <div className="space-y-4">
                  {columns.map((col, idx) => (
                    <motion.div 
                      layout 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx} 
                      className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-[32px] border border-white/5 group hover:border-secondary/30 transition-all duration-300"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-text-muted shrink-0">{idx + 1}</div>
                      <input 
                        type="text" 
                        value={col.name}
                        onChange={e => updateColumn(idx, 'name', e.target.value)}
                        placeholder="Key name..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold focus:border-secondary/50 outline-none transition-all"
                      />
                      <select 
                        value={col.type}
                        onChange={e => updateColumn(idx, 'type', e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest focus:border-secondary/50 outline-none cursor-pointer hover:bg-black/60 transition-all"
                      >
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="flex items-center gap-4 px-3 bg-black/20 rounded-2xl py-2">
                        <Checkbox label="PK" checked={col.primary_key} onChange={v => updateColumn(idx, 'primary_key', v)} />
                        <Checkbox label="AI" checked={col.auto_increment} onChange={v => updateColumn(idx, 'auto_increment', v)} />
                        <Checkbox label="NN" checked={col.not_null} onChange={v => updateColumn(idx, 'not_null', v)} />
                      </div>
                      <button onClick={() => removeColumn(idx)} className="w-10 h-10 flex items-center justify-center text-danger hover:bg-danger/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-4 space-y-8">
              <div className="p-8 rounded-[40px] bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 space-y-6 shadow-xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 text-amber-500">
                  <Sparkles size={16} /> Intelligent Seeding
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Active Status</span>
                  <button 
                    onClick={() => setSeedAI(!seedAI)}
                    className={`w-14 h-7 rounded-full transition-all relative ${seedAI ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all ${seedAI ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
                {seedAI && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-text-muted">Payload Volume</span>
                      <span className="text-amber-500 text-sm">{seedRows} Rows</span>
                    </div>
                    <input type="range" min="1" max="100" value={seedRows} onChange={e => setSeedRows(e.target.value)} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                  </motion.div>
                )}
              </div>

              <div className="p-8 rounded-[40px] bg-black/40 border border-white/5 space-y-5 shadow-inner">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 text-secondary">
                  <Code size={16} /> Syntax Manifest
                </h3>
                <pre className="text-[10px] font-mono text-text-muted bg-black/60 p-5 rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-white/5">
                  {generateSQL()}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-white/5 flex justify-end gap-6 bg-black/20">
          <button onClick={onClose} className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-white transition-all">Abort Design</button>
          <button 
            onClick={handleCreate} 
            disabled={isCreating || !tableName}
            className="px-10 py-5 rounded-[24px] bg-secondary hover:bg-secondary/80 disabled:opacity-20 text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_40px_rgba(6,182,212,0.3)] hover:shadow-[0_20px_50px_rgba(6,182,212,0.4)] transition-all active:scale-95 flex items-center gap-3"
          >
            {isCreating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <ChevronRight size={18} />}
            {isCreating ? 'Engineering...' : 'Instantiate Schema'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <button 
      type="button"
      onClick={() => onChange(!checked)}
      className="flex flex-col items-center gap-1.5 group shrink-0"
    >
      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${checked ? 'bg-secondary border-secondary text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-white/10 group-hover:border-white/30'}`}>
        {checked && <Check size={12} strokeWidth={4} />}
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest text-text-muted group-hover:text-text-primary transition-colors">{label}</span>
    </button>
  );
}
