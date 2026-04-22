import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Layout, Download, Table, Key, Clock, FileJson, FileText, ChevronDown, Columns, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function RightPanel({ isOpen, onToggle, activeTables, lastSql }) {
  const [activeTab, setActiveTab] = useState('schema');
  const [schemas, setSchemas] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'schema') {
      activeTables.forEach(t => fetchSchema(t));
    }
  }, [activeTab, activeTables, isOpen]);

  const fetchSchema = async (table) => {
    try {
      const res = await axios.get(`${API_BASE}/schema/${table}`);
      setSchemas(prev => ({ ...prev, [table]: res.data.schema }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = (format) => {
    if (!lastSql) {
      toast.error("No data to export. Run a query first!");
      return;
    }
    const filename = `export_${Date.now()}.${format}`;
    const url = `${API_BASE}/export/${format}?sql=${encodeURIComponent(lastSql)}&filename=${filename}`;
    window.open(url, '_blank');
  };

  // Count total columns across active schemas
  const totalColumns = Object.values(schemas).reduce((sum, s) => sum + (s ? s.length : 0), 0);

  return (
    <div className={`relative flex transition-all duration-400 ease-in-out h-full ${isOpen ? 'w-[300px]' : 'w-0'}`}>
      <button 
        onClick={onToggle}
        className="absolute -left-9 top-1/2 -translate-y-1/2 w-7 h-16 rounded-l-xl bg-surface/70 backdrop-blur-xl border border-r-0 border-white/[0.06] flex items-center justify-center text-text-muted hover:text-primary z-30 hover:bg-surface transition-all shadow-[-8px_0_16px_rgba(0,0,0,0.2)]"
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <motion.aside 
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 30 }}
        className="w-full h-full glass border-l border-white/[0.04] flex flex-col overflow-hidden z-20"
      >
        {/* Tabs */}
        <div className="flex border-b border-white/[0.04] bg-black/15">
          {['schema', 'export'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[10px] font-semibold uppercase tracking-wider transition-all relative ${
                activeTab === tab ? 'text-primary' : 'text-text-muted/50 hover:text-text-muted'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
              )}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        {activeTab === 'schema' && activeTables.length > 0 && (
          <div className="px-5 py-3 border-b border-white/[0.04] bg-black/10 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Table size={11} className="text-primary/50" />
              <span className="text-[10px] font-medium text-text-muted/60">{activeTables.length} table{activeTables.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Columns size={11} className="text-secondary/50" />
              <span className="text-[10px] font-medium text-text-muted/60">{totalColumns} column{totalColumns !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scroll-thin p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'schema' && (
              <motion.div 
                key="schema"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-3"
              >
                {activeTables.length === 0 ? (
                  <div className="text-center py-16 opacity-15 flex flex-col items-center gap-3">
                    <Table size={36} />
                    <p className="text-[10px] font-semibold uppercase tracking-wider">No active tables</p>
                  </div>
                ) : activeTables.map((table, idx) => (
                  <SchemaAccordion key={table} table={table} schema={schemas[table]} delay={idx * 0.08} />
                ))}
              </motion.div>
            )}

            {activeTab === 'export' && (
              <motion.div 
                key="export"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-3"
              >
                <ExportButton icon={<FileText className="text-blue-400" />} label="Last Result PDF" desc="Export as formatted PDF" onClick={() => handleExport('pdf')} />
                <ExportButton icon={<Layout className="text-emerald-400" />} label="Last Result CSV" desc="Export as spreadsheet" onClick={() => handleExport('csv')} />
                <ExportButton icon={<FileJson className="text-amber-400" />} label="Session Activity Log" desc="View agent session logs" onClick={() => window.open(`${API_BASE}/activity-log`, '_blank')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </div>
  );
}

function SchemaAccordion({ table, schema, delay }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeColor = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('INT') || t.includes('REAL') || t.includes('FLOAT') || t.includes('NUM') || t.includes('SERIAL')) return 'text-blue-400 bg-blue-500/8';
    if (t.includes('TEXT') || t.includes('CHAR') || t.includes('VARCHAR')) return 'text-emerald-400 bg-emerald-500/8';
    if (t.includes('BOOL')) return 'text-amber-400 bg-amber-500/8';
    if (t.includes('TIME') || t.includes('DATE')) return 'text-purple-400 bg-purple-500/8';
    return 'text-text-muted bg-white/[0.04]';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-white/[0.05] bg-white/[0.01] overflow-hidden hover:border-primary/15 transition-all duration-200"
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/8">
            <Table size={13} className="text-primary" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight truncate">{table}</span>
          {schema && <span className="text-[9px] font-mono text-text-muted/30">{schema.length} col{schema.length !== 1 ? 's' : ''}</span>}
        </div>
        <ChevronDown size={14} className={`text-text-muted/30 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.04] bg-black/15"
          >
            <div className="px-4 py-3 space-y-2">
              {schema ? schema.map((col, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] group">
                  <div className="flex items-center gap-2">
                    {(col.pk || col.primary_key) ? (
                      <Key size={10} className="text-amber-400 shrink-0" />
                    ) : (
                      <div className="w-[10px] shrink-0" />
                    )}
                    <span className="font-mono text-text-primary/80 font-medium">{col.name || col.column_name}</span>
                  </div>
                  <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${getTypeColor(col.type || col.data_type)}`}>
                    {col.type || col.data_type}
                  </span>
                </div>
              )) : (
                <div className="text-[10px] text-text-muted/30 italic animate-pulse">Loading schema...</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExportButton({ icon, label, desc, onClick }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.01, x: 3 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-primary/20 hover:bg-primary/[0.03] transition-all flex items-center gap-4 group relative overflow-hidden text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-black/25 flex items-center justify-center group-hover:scale-105 transition-all shadow-inner relative z-10 shrink-0">
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div className="relative z-10">
        <span className="text-sm font-semibold text-text-primary block">{label}</span>
        {desc && <span className="text-[10px] text-text-muted/50 font-medium">{desc}</span>}
      </div>
    </motion.button>
  );
}
