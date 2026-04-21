import { Database, Plus, Table as TableIcon, Upload, CheckCircle2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar({ db, tables, activeTables, toggleTable, onOpenConnect, onOpenUpload, onOpenTableBuilder, onBrowseTable }) {
  return (
    <aside className="w-[280px] h-full glass border-r border-primary/20 flex flex-col z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          <Database className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-white to-text-muted bg-clip-text text-transparent">
            SQL Agent
          </h1>
          <div className="text-[10px] text-primary/80 font-bold uppercase tracking-widest leading-none">v2.0 Beta</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-4 space-y-6 pb-6">
        {/* Connection Section */}
        <section>
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-2">Database</h2>
          {db ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
                  <span className="font-medium truncate text-sm">{db.name}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase shrink-0">{db.type}</span>
              </div>
              <button 
                onClick={onOpenConnect}
                className="w-full py-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 border border-primary/20 rounded-lg hover:bg-primary/5 font-semibold uppercase tracking-wider"
              >
                Switch Database
              </button>
            </motion.div>
          ) : (
            <button 
              onClick={onOpenConnect}
              className="w-full btn-primary py-2.5"
            >
              <Plus size={18} />
              Connect Database
            </button>
          )}
        </section>

        {/* Tables Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Active Tables</h2>
            <button 
              onClick={onOpenTableBuilder} 
              className="p-1 hover:bg-primary/20 rounded text-primary transition-colors"
              title="Create new table"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1">
            {tables.length > 0 ? tables.map((table, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={table}
                className={`w-full flex items-center gap-1 group`}
              >
                <button
                  onClick={() => toggleTable(table)}
                  className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    activeTables.includes(table) 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-text-muted hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <TableIcon size={14} className={activeTables.includes(table) ? 'text-primary' : 'text-text-muted'} />
                    <span className="truncate">{table}</span>
                  </div>
                  {activeTables.includes(table) && <CheckCircle2 size={14} className="shrink-0" />}
                </button>
                <button 
                  onClick={() => onBrowseTable(table)}
                  className="p-2 rounded-lg text-text-muted/40 hover:text-primary hover:bg-white/10 transition-all"
                  title="Browse Data"
                >
                  <Eye size={14} />
                </button>
              </motion.div>
            )) : (
              <div className="px-3 py-6 text-center border border-dashed border-white/10 rounded-xl">
                <p className="text-xs text-text-muted">No tables found</p>
              </div>
            )}
          </div>
        </section>

        {/* Upload Section */}
        <section>
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-2">Quick Import</h2>
          <button 
            onClick={onOpenUpload}
            className="w-full p-4 border border-dashed border-primary/20 rounded-xl bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all group flex flex-col items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={18} className="text-primary" />
            </div>
            <span className="text-xs font-medium">Drop File Here</span>
            <span className="text-[10px] text-text-muted">PDF, CSV, XLSX, DOCX</span>
          </button>
        </section>
      </div>

      <div className="p-4 border-t border-primary/10 bg-black/20">
        <div className="flex items-center justify-between text-[9px] text-text-muted font-bold uppercase tracking-widest">
          <span>Safe Environment</span>
          <span className="text-primary/60">Ready</span>
        </div>
      </div>
    </aside>
  );
}
