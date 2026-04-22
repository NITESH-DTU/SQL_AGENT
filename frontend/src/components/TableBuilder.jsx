import React, { useState } from 'react';
import { X, Plus, Trash2, Code, Sparkles, Check, ChevronRight, Loader2 } from 'lucide-react';
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
    }).join(',\n  ');
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
      toast.success("Table created successfully!");
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl glass rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/[0.08] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/[0.05] flex items-center justify-between bg-black/15">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/15 flex items-center justify-center border border-secondary/25 shadow-lg shadow-secondary/10">
              <Plus className="text-secondary" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gradient">Table Builder</h2>
              <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider mt-0.5">Schema Design Studio</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-white/[0.06] rounded-xl transition-all text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-thin">
          <div className="grid grid-cols-12 gap-8">
            {/* Left: Schema Editor */}
            <div className="col-span-8 space-y-6">
              <div className="space-y-2.5">
                <label className="label-caps px-1">Table Name</label>
                <input 
                  type="text" 
                  value={tableName}
                  onChange={e => setTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="e.g. analytics_events" 
                  className="input-field text-lg font-bold tracking-tight py-4"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="label-caps">Columns</label>
                  <button onClick={addColumn} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/8 text-secondary hover:bg-secondary/15 text-[10px] font-semibold uppercase tracking-wider transition-all">
                    <Plus size={13} /> Add Column
                  </button>
                </div>

                <div className="space-y-2.5">
                  {columns.map((col, idx) => (
                    <motion.div 
                      layout 
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx} 
                      className="flex items-center gap-3 bg-white/[0.015] p-3 rounded-xl border border-white/[0.05] group hover:border-secondary/15 transition-all duration-200"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/[0.03] flex items-center justify-center text-[10px] font-bold text-text-muted/30 shrink-0">{idx + 1}</div>
                      <input 
                        type="text" 
                        value={col.name}
                        onChange={e => updateColumn(idx, 'name', e.target.value)}
                        placeholder="column_name"
                        className="flex-1 bg-black/30 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:border-secondary/30 outline-none transition-all"
                      />
                      <select 
                        value={col.type}
                        onChange={e => updateColumn(idx, 'type', e.target.value)}
                        className="bg-black/30 border border-white/[0.06] rounded-xl px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider focus:border-secondary/30 outline-none cursor-pointer hover:bg-black/40 transition-all"
                      >
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="flex items-center gap-3 px-2 bg-black/15 rounded-xl py-1.5">
                        <Checkbox label="PK" checked={col.primary_key} onChange={v => updateColumn(idx, 'primary_key', v)} />
                        <Checkbox label="AI" checked={col.auto_increment} onChange={v => updateColumn(idx, 'auto_increment', v)} />
                        <Checkbox label="NN" checked={col.not_null} onChange={v => updateColumn(idx, 'not_null', v)} />
                      </div>
                      <button onClick={() => removeColumn(idx)} className="w-8 h-8 flex items-center justify-center text-danger/40 hover:text-danger hover:bg-danger/8 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={15} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Options & Preview */}
            <div className="col-span-4 space-y-6">
              {/* AI Seeding */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/12 space-y-4 relative overflow-hidden group">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <h3 className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2 text-amber-400">
                  <Sparkles size={13} /> AI Seeding
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-text-muted">Auto-populate</span>
                  <button 
                    onClick={() => setSeedAI(!seedAI)}
                    className={`w-11 h-6 rounded-full transition-all relative ${seedAI ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'bg-white/[0.08]'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${seedAI ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
                {seedAI && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-medium">
                      <span className="text-text-muted">Row Count</span>
                      <span className="text-amber-400 font-bold text-sm">{seedRows}</span>
                    </div>
                    <input type="range" min="1" max="100" value={seedRows} onChange={e => setSeedRows(e.target.value)} className="w-full h-1 bg-black/30 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                  </motion.div>
                )}
              </div>

              {/* SQL Preview */}
              <div className="p-5 rounded-2xl bg-black/30 border border-white/[0.05] space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2 text-secondary">
                  <Code size={13} /> SQL Preview
                </h3>
                <pre className="text-[10px] font-mono text-text-muted/60 bg-black/40 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-white/[0.04] scroll-thin">
                  {generateSQL()}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/[0.05] flex justify-end gap-4 bg-black/15">
          <button onClick={onClose} className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted hover:text-white transition-all">Cancel</button>
          <button 
            onClick={handleCreate} 
            disabled={isCreating || !tableName}
            className="px-8 py-3.5 rounded-xl bg-secondary hover:bg-secondary/85 disabled:opacity-20 text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-secondary/25 hover:shadow-secondary/35 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            {isCreating ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
            {isCreating ? 'Creating...' : 'Create Table'}
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
      className="flex flex-col items-center gap-1 group shrink-0"
    >
      <div className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${checked ? 'bg-secondary border-secondary text-white shadow-[0_0_8px_rgba(6,182,212,0.2)]' : 'border-white/[0.1] group-hover:border-white/[0.2]'}`}>
        {checked && <Check size={10} strokeWidth={4} />}
      </div>
      <span className="text-[8px] font-semibold uppercase tracking-wider text-text-muted/40 group-hover:text-text-muted transition-colors">{label}</span>
    </button>
  );
}
