import { Database, Plus, Table as TableIcon, Upload, CheckCircle2, Eye, Terminal, ChevronDown, Layers, LayoutDashboard, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Sidebar({ db, tables, activeTables, toggleTable, onOpenConnect, onOpenUpload, onOpenTableBuilder, onOpenSQLConsole, onBrowseTable, onOpenDashboard, onOpenHistory }) {
  const [tablesExpanded, setTablesExpanded] = useState(true);

  return (
    <aside className="w-[270px] h-full glass border-r border-white/[0.06] flex flex-col z-10">
      {/* Brand Header */}
      <div className="p-5 pb-4 flex items-center gap-3 border-b border-white/[0.04]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/25 to-secondary/15 flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10">
          <Database className="text-primary" size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gradient leading-tight">
            SQL Agent
          </h1>
          <div className="text-[9px] text-primary/60 font-semibold uppercase tracking-[0.15em] leading-none mt-0.5">v2.0 • Autonomous</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-3 space-y-5 py-4">
        {/* Connection Section */}
        <section>
          <h2 className="label-caps mb-2.5 px-2">Connection</h2>
          {db ? (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse shrink-0" />
                  <span className="font-semibold truncate text-sm">{db.name}</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase tracking-wider shrink-0 border border-primary/15">{db.type}</span>
              </div>
              <button 
                onClick={onOpenConnect}
                className="w-full py-2 text-[10px] text-text-muted hover:text-primary transition-colors flex items-center justify-center gap-1.5 border border-white/[0.06] rounded-lg hover:bg-primary/5 hover:border-primary/20 font-semibold uppercase tracking-wider"
              >
                Switch Database
              </button>
            </motion.div>
          ) : (
            <button 
              onClick={onOpenConnect}
              className="w-full btn-primary py-2.5 rounded-xl"
            >
              <Plus size={16} />
              Connect Database
            </button>
          )}
        </section>

        {/* SQL Console Button */}
        <section>
          <button
            onClick={onOpenSQLConsole}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-gradient-to-r from-primary/8 to-secondary/8 border border-primary/15 hover:border-primary/30 hover:from-primary/12 hover:to-secondary/12 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
              <Terminal size={16} className="text-primary" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold block leading-tight">SQL Console</span>
              <span className="text-[9px] text-text-muted font-medium tracking-wider">Manual Query Execution</span>
            </div>
          </button>
        </section>

        {/* BI Tools Section */}
        <section>
          <h2 className="label-caps mb-2.5 px-2">BI & Analytics</h2>
          <div className="space-y-1.5">
            <button
              onClick={onOpenDashboard}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-primary/30 hover:bg-white/[0.05] transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <LayoutDashboard size={16} className="text-primary" />
              </div>
              <span className="text-sm font-semibold text-text-primary">Dashboard</span>
            </button>
            <button
              onClick={onOpenHistory}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/30 hover:bg-white/[0.05] transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Clock size={16} className="text-amber-500" />
              </div>
              <span className="text-sm font-semibold text-text-primary">History</span>
            </button>
          </div>
        </section>

        {/* Tables Section */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-2 w-full">
            <button 
              onClick={() => setTablesExpanded(!tablesExpanded)}
              className="flex items-center gap-2 group"
            >
              <h2 className="label-caps">Tables</h2>
              <span className="text-[9px] font-mono text-text-muted/40 bg-white/[0.03] px-1.5 py-0.5 rounded">{activeTables.length}/{tables.length}</span>
              <ChevronDown size={13} className={`text-text-muted/40 transition-transform duration-200 ${tablesExpanded ? '' : '-rotate-90'}`} />
            </button>
            <button 
              onClick={onOpenTableBuilder}
              className="p-1 hover:bg-primary/15 rounded text-text-muted hover:text-primary transition-colors"
              title="Create new table"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <AnimatePresence>
            {tablesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5">
                  {tables.length > 0 ? tables.map((table, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={table}
                      className="w-full flex items-center gap-0.5 group"
                    >
                      <button
                        onClick={() => toggleTable(table)}
                        className={`flex-1 flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                          activeTables.includes(table) 
                            ? 'bg-primary/8 text-primary border border-primary/15' 
                            : 'text-text-muted hover:bg-white/[0.03] border border-transparent hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <TableIcon size={13} className={activeTables.includes(table) ? 'text-primary' : 'text-text-muted/50'} />
                          <span className="truncate font-medium">{table}</span>
                        </div>
                        {activeTables.includes(table) && <CheckCircle2 size={13} className="shrink-0 opacity-60" />}
                      </button>
                      <button 
                        onClick={() => onBrowseTable(table)}
                        className="p-1.5 rounded-lg text-text-muted/20 hover:text-primary hover:bg-white/[0.04] transition-all opacity-0 group-hover:opacity-100"
                        title="Browse Data"
                      >
                        <Eye size={13} />
                      </button>
                    </motion.div>
                  )) : (
                    <div className="px-3 py-8 text-center border border-dashed border-white/[0.06] rounded-xl">
                      <Layers size={20} className="mx-auto text-text-muted/20 mb-2" />
                      <p className="text-[11px] text-text-muted/40 font-medium">No tables found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Upload Section */}
        <section>
          <h2 className="label-caps mb-2.5 px-2">Quick Import</h2>
          <button 
            onClick={onOpenUpload}
            className="w-full p-4 border border-dashed border-white/[0.08] rounded-xl bg-white/[0.01] hover:bg-primary/5 hover:border-primary/25 transition-all group flex flex-col items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/15 transition-all">
              <Upload size={16} className="text-primary" />
            </div>
            <span className="text-xs font-semibold text-text-muted group-hover:text-text-primary transition-colors">Drop File Here</span>
            <span className="text-[9px] text-text-muted/40 font-medium">CSV, XLSX, PDF, DOCX</span>
          </button>
        </section>
      </div>

      <div className="p-3 border-t border-white/[0.04] bg-black/20">
        <div className="flex items-center justify-between text-[9px] text-text-muted/40 font-medium uppercase tracking-wider px-2">
          <span>Safe Environment</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success/60" />
            <span className="text-success/50">Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
