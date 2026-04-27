import React, { useState, useEffect } from 'react';
import { X, Play, Save, Layout, BarChart3, Hash, Table as TableIcon, Settings, Database, Sparkles, ChevronDown, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function WidgetModal({ isOpen, onClose, onSave, initialData = null, startInAnalysisMode = false, activeTables = [] }) {
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
  
  const [analysisMode, setAnalysisMode] = useState(startInAnalysisMode);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [tables, setTables] = useState([]);
  const [tableSchema, setTableSchema] = useState([]);
  const [analysisConfig, setAnalysisConfig] = useState({
    table: '',
    dimension: '',
    measure: '',
    aggregation: 'COUNT'
  });

  const [previewData, setPreviewData] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (initialData) setFormData({ ...formData, ...initialData });
    fetchTables();
  }, [initialData]);

  const fetchTables = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tables`);
      setTables(res.data.tables);
    } catch (err) {
      console.error("Failed to fetch tables");
    }
  };

  const fetchTableSchema = async (table) => {
    try {
      const res = await axios.get(`${API_BASE}/schema/${table}`);
      setTableSchema(res.data.schema);
    } catch (err) {
      console.error("Failed to fetch schema");
    }
  };

  useEffect(() => {
    if (analysisConfig.table) {
      fetchTableSchema(analysisConfig.table);
    }
  }, [analysisConfig.table]);

  useEffect(() => {
    if (analysisMode && analysisConfig.table) {
      const { table, dimension, measure, aggregation } = analysisConfig;
      let sql = '';
      if (dimension && measure) {
        sql = `SELECT ${dimension}, ${aggregation}(${measure}) as value FROM "${table}" GROUP BY ${dimension} ORDER BY value DESC`;
      } else if (dimension) {
        sql = `SELECT ${dimension}, COUNT(*) as count FROM "${table}" GROUP BY ${dimension} ORDER BY count DESC`;
      } else if (measure) {
        sql = `SELECT ${aggregation}(${measure}) as value FROM "${table}"`;
      } else {
        sql = `SELECT * FROM "${table}" LIMIT 100`;
      }
      setFormData(prev => ({ ...prev, sql_query: sql }));
    }
  }, [analysisConfig, analysisMode]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt for the AI");
      return;
    }
    setIsAiGenerating(true);
    try {
      const res = await axios.post(`${API_BASE}/ai/suggest-query`, { 
        prompt: aiPrompt,
        active_tables: activeTables
      });
      setFormData(prev => ({ ...prev, sql_query: res.data.sql }));
      toast.success("Query generated!");
    } catch (err) {
      toast.error("Failed to generate query");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleRunPreview = async () => {
    if (!formData.sql_query.trim()) return;
    setIsExecuting(true);
    try {
      const res = await axios.post(`${API_BASE}/execute-sql`, { 
        sql: formData.sql_query,
        active_tables: activeTables
      });
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label-caps block">SQL Query</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setAnalysisMode(!analysisMode)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border transition-all ${analysisMode ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/10 text-text-muted hover:text-text-primary'}`}
                    >
                      <Settings2 size={12} className="inline mr-1" /> {analysisMode ? 'Custom SQL' : 'Query Builder'}
                    </button>
                  </div>
                </div>

                {analysisMode ? (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-4">
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase mb-1 block">Select Table</label>
                      <select 
                        value={analysisConfig.table}
                        onChange={e => setAnalysisConfig({...analysisConfig, table: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none"
                      >
                        <option value="">Choose a table...</option>
                        {tables.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase mb-1 block">Dimension (Group)</label>
                        <select 
                          value={analysisConfig.dimension}
                          onChange={e => setAnalysisConfig({...analysisConfig, dimension: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none"
                        >
                          <option value="">None</option>
                          {tableSchema.map(s => (
                            <option key={s.name || s.column_name} value={s.name || s.column_name}>
                              {s.name || s.column_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase mb-1 block">Measure (Value)</label>
                        <select 
                          value={analysisConfig.measure}
                          onChange={e => setAnalysisConfig({...analysisConfig, measure: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none"
                        >
                          <option value="">None / Count(*)</option>
                          {tableSchema.map(s => (
                            <option key={s.name || s.column_name} value={s.name || s.column_name}>
                              {s.name || s.column_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {analysisConfig.measure && (
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase mb-1 block">Aggregation</label>
                        <div className="flex gap-1.5">
                          {['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].map(agg => (
                            <button
                              key={agg}
                              type="button"
                              onClick={() => setAnalysisConfig({...analysisConfig, aggregation: agg})}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${analysisConfig.aggregation === agg ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-text-muted'}`}
                            >
                              {agg}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative group">
                      <input 
                        type="text"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="Describe what you want to see..."
                        className="w-full bg-primary/5 border border-primary/20 rounded-xl pl-4 pr-12 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary/50"
                      />
                      <button 
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={isAiGenerating}
                        className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-primary rounded-lg text-white hover:bg-primary/90 transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {isAiGenerating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={14} />}
                      </button>
                    </div>
                    
                    <textarea 
                      value={formData.sql_query} 
                      onChange={e => setFormData({...formData, sql_query: e.target.value})}
                      className="w-full h-32 bg-black/40 border border-white/[0.06] rounded-xl p-4 text-[13px] font-mono text-text-primary focus:outline-none focus:border-primary/50 resize-none scroll-thin"
                      placeholder="SELECT count(*) as total FROM sales..."
                    />
                  </div>
                )}
                
                <button 
                  type="button" 
                  onClick={handleRunPreview}
                  disabled={isExecuting}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-text-primary transition-all border border-white/10 w-full justify-center"
                >
                  <Play size={14} /> Run Preview & Detect Columns
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
                        <option value="area">Area Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="scatter">Scatter Chart</option>
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
