import React, { useState, useEffect } from 'react';
import { X, Play, Save, Layout, BarChart3, Hash, Table as TableIcon, Settings, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function WidgetModal({ isOpen, onClose, onSave, initialData = null }) {
  const [formData, setFormData] = useState({
    title: '',
    widget_type: 'chart',
    sql_query: '',
    chart_type: 'bar',
    x_column: '',
    y_column: '',
    color_scheme: 'violet',
    width: 'half',
    auto_refresh: 0,
    ...initialData
  });

  const [previewData, setPreviewData] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (initialData) setFormData({ ...formData, ...initialData });
  }, [initialData]);

  const handleRunPreview = async () => {
    if (!formData.sql_query.trim()) return;
    setIsExecuting(true);
    try {
      const res = await axios.post(`${API_BASE}/execute-sql`, { sql: formData.sql_query });
      if (res.data.error) {
        toast.error(res.data.error);
        setPreviewData(null);
      } else {
        setPreviewData(res.data.rows);
        if (res.data.rows.length > 0) {
          const cols = Object.keys(res.data.rows[0]);
          setColumns(cols);
          if (!formData.x_column) setFormData(prev => ({ ...prev, x_column: cols[0], y_column: cols[1] || cols[0] }));
        }
      }
    } catch (err) {
      toast.error('Failed to execute query');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.sql_query) {
      toast.error('Title and SQL query are required');
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-4xl max-h-[90vh] bg-surface border border-white/[0.08] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-lg font-bold text-text-primary">{initialData ? 'Edit Widget' : 'Create New Widget'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-text-muted"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-thin">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label-caps mb-1.5 block">Widget Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Total Revenue"
                  className="w-full bg-black/40 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="label-caps mb-1.5 block">Widget Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'chart', icon: <BarChart3 size={14} />, label: 'Chart' },
                    { id: 'metric', icon: <Hash size={14} />, label: 'Metric' },
                    { id: 'table', icon: <TableIcon size={14} />, label: 'Table' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({...formData, widget_type: t.id})}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                        formData.widget_type === t.id ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-white/[0.04] text-text-muted hover:border-white/10'
                      }`}
                    >
                      {t.icon}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-caps mb-1.5 block">SQL Query</label>
                <textarea 
                  value={formData.sql_query} 
                  onChange={e => setFormData({...formData, sql_query: e.target.value})}
                  className="w-full h-32 bg-black/40 border border-white/[0.06] rounded-xl p-4 text-[13px] font-mono text-text-primary focus:outline-none focus:border-primary/50 resize-none scroll-thin"
                  placeholder="SELECT count(*) as total FROM sales..."
                />
                <button 
                  type="button" 
                  onClick={handleRunPreview}
                  disabled={isExecuting}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-text-primary transition-all border border-white/10"
                >
                  <Play size={14} /> Run Preview
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {formData.widget_type === 'chart' && (
                <div className="p-4 rounded-2xl bg-black/20 border border-white/[0.04] space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Chart Type</label>
                      <select 
                        value={formData.chart_type}
                        onChange={e => setFormData({...formData, chart_type: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none"
                      >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="pie">Pie Chart</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Width</label>
                      <select 
                        value={formData.width}
                        onChange={e => setFormData({...formData, width: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none"
                      >
                        <option value="half">Half (1 Col)</option>
                        <option value="full">Full (2 Col)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">X-Axis / Label</label>
                      <select 
                        value={formData.x_column}
                        onChange={e => setFormData({...formData, x_column: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none"
                      >
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Y-Axis / Value</label>
                      <select 
                        value={formData.y_column}
                        onChange={e => setFormData({...formData, y_column: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none"
                      >
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="label-caps mb-1.5 block">Color Scheme</label>
                <div className="flex gap-2">
                  {['violet', 'cyan', 'green', 'amber'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({...formData, color_scheme: c})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color_scheme === c ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c === 'violet' ? '#7c3aed' : c === 'cyan' ? '#06b6d4' : c === 'green' ? '#10b981' : '#f59e0b' }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="label-caps mb-1.5 block">Preview</label>
                <div className="w-full h-40 bg-black/40 rounded-2xl border border-white/[0.04] flex items-center justify-center p-4">
                  {isExecuting ? (
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : previewData ? (
                    <div className="text-[10px] text-text-muted font-mono overflow-auto max-h-full">
                      {JSON.stringify(previewData.slice(0, 3), null, 2)}
                    </div>
                  ) : (
                    <span className="text-[10px] text-text-muted italic">Run query to see preview</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-end gap-3 bg-white/[0.02]">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold text-text-muted hover:bg-white/5 transition-all">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary px-6 py-2 rounded-xl text-sm"><Save size={16} /> {initialData ? 'Update Widget' : 'Create Widget'}</button>
        </div>
      </motion.div>
    </div>
  );
}
