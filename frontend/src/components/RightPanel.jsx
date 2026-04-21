import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Layout, Activity, Download, Table, Key, Box, Clock, FileJson, FileText, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

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

  return (
    <div className={`relative flex transition-all duration-500 ease-in-out h-full ${isOpen ? 'w-[320px]' : 'w-0'}`}>
      <button 
        onClick={onToggle}
        className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-20 rounded-l-2xl bg-surface/80 backdrop-blur-xl border border-r-0 border-white/10 flex items-center justify-center text-primary z-30 hover:bg-surface transition-all shadow-[-10px_0_20px_rgba(0,0,0,0.3)]"
      >
        {isOpen ? <ChevronRight size={20} className="animate-pulse" /> : <ChevronLeft size={20} className="animate-pulse" />}
      </button>

      <motion.aside 
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 50 }}
        className="w-full h-full glass border-l border-white/5 flex flex-col overflow-hidden z-20"
      >
        <div className="flex border-b border-white/5 bg-black/20">
          {['schema', 'export'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-5">
          <AnimatePresence mode="wait">
            {activeTab === 'schema' && (
              <motion.div 
                key="schema"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {activeTables.length === 0 ? (
                  <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                    <Table size={48} />
                    <p className="text-xs font-bold uppercase tracking-widest">No active tables</p>
                  </div>
                ) : activeTables.map((table, idx) => (
                  <SchemaAccordion key={table} table={table} schema={schemas[table]} delay={idx * 0.1} />
                ))}
              </motion.div>
            )}

            {activeTab === 'export' && (
              <motion.div 
                key="export"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <ExportButton icon={<FileText className="text-blue-400" />} label="Last Result PDF" onClick={() => handleExport('pdf')} />
                <ExportButton icon={<Layout className="text-green-400" />} label="Last Result CSV" onClick={() => handleExport('csv')} />
                <ExportButton icon={<FileJson className="text-amber-400" />} label="Full Session Log" onClick={() => window.open(`${API_BASE}/activity-log`, '_blank')} />
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
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-primary/20 transition-all duration-300 shadow-lg"
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.05] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Table size={16} className="text-primary" />
          </div>
          <span className="text-sm font-bold tracking-tight truncate">{table}</span>
        </div>
        <ChevronDown size={16} className={`text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-black/20"
          >
            <div className="px-5 py-4 space-y-3">
              {schema ? schema.map((col, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] group">
                  <div className="flex items-center gap-2">
                    <Key size={10} className={`${(col.pk || col.primary_key) ? 'text-amber-400' : 'opacity-0'} group-hover:scale-110 transition-transform`} />
                    <span className="font-mono text-text-primary font-medium">{col.name || col.column_name}</span>
                  </div>
                  <span className="text-[10px] text-text-muted font-black uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded">{col.type || col.data_type}</span>
                </div>
              )) : (
                <div className="text-[10px] text-text-muted italic animate-pulse">Loading schema...</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExportButton({ icon, label, onClick }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full p-5 rounded-[24px] bg-white/[0.03] border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center gap-5 group relative overflow-hidden text-left"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-12 h-12 rounded-[18px] bg-black/30 flex items-center justify-center group-hover:rotate-12 transition-all shadow-inner relative z-10">
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <span className="text-sm font-black uppercase tracking-widest text-text-primary relative z-10">{label}</span>
    </motion.button>
  );
}
