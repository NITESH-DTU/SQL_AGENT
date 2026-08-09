import { Database, Plus, Table as TableIcon, Upload, CheckCircle2, Eye, Terminal, ChevronDown, Layers, LayoutDashboard, Clock, Activity, BookOpen, Network, ShieldCheck, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Sidebar({ db, tables, activeTables, toggleTable, onOpenConnect, onOpenUpload, onOpenTableBuilder, onOpenSQLConsole, onBrowseTable, onOpenDashboard, onOpenDataProfiler, onOpenGlossary, onOpenERD, onOpenHistory, onOpenAuditLog, onOpenSettings }) {
  const [tablesExpanded, setTablesExpanded] = useState(true);

  return (
    <aside
      className="w-[272px] h-full flex flex-col z-10 shrink-0"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(15,23,42,0.08)',
        boxShadow: '1px 0 16px rgba(15,23,42,0.04)',
      }}
    >
      {/* Brand */}
      <div className="px-5 py-4 flex items-center gap-3.5" style={{ borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 2px 10px rgba(79,70,229,0.3)' }}
        >
          <Database className="text-white" size={18} />
        </div>
        <div>
          <h1 className="text-[15px] font-bold tracking-tight leading-tight" style={{ color: '#0f172a' }}>SQL Agent</h1>
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] mt-0.5" style={{ color: '#4f46e5', opacity: 0.7 }}>v2.0 · Autonomous</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-5">

        {/* Connection */}
        <section>
          <h2 className="label-caps mb-2 px-1">Connection</h2>
          {db ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl space-y-2.5"
              style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-success shrink-0" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
                  <span className="font-semibold truncate text-sm" style={{ color: '#0f172a' }}>{db.name}</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0" style={{ background: 'rgba(79,70,229,0.08)', color: '#4f46e5', border: '1px solid rgba(79,70,229,0.15)' }}>{db.type}</span>
              </div>
              <button
                onClick={onOpenConnect}
                className="w-full py-1.5 text-[10px] transition-colors flex items-center justify-center gap-1.5 font-semibold uppercase tracking-wider rounded-lg"
                style={{ border: '1px solid rgba(15,23,42,0.08)', color: '#64748b' }}
                onMouseEnter={e => { e.target.style.color = '#4f46e5'; e.target.style.borderColor = 'rgba(79,70,229,0.2)'; }}
                onMouseLeave={e => { e.target.style.color = '#64748b'; e.target.style.borderColor = 'rgba(15,23,42,0.08)'; }}
              >
                Switch Database
              </button>
            </motion.div>
          ) : (
            <button onClick={onOpenConnect} className="w-full btn-primary py-2.5 rounded-xl text-sm">
              <Plus size={16} /> Connect Database
            </button>
          )}
        </section>

        {/* SQL Console */}
        <section>
          <button
            onClick={onOpenSQLConsole}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all group"
            style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(6,182,212,0.04))', border: '1px solid rgba(79,70,229,0.12)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.25)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79,70,229,0.10), rgba(6,182,212,0.06))'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.12)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(6,182,212,0.04))'; }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79,70,229,0.10)' }}>
              <Terminal size={16} style={{ color: '#4f46e5' }} />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold block leading-tight" style={{ color: '#0f172a' }}>SQL Console</span>
              <span className="text-[9px] font-medium tracking-wider" style={{ color: '#94a3b8' }}>Manual Query Execution</span>
            </div>
          </button>
        </section>

        {/* BI & Governance */}
        <section>
          <h2 className="label-caps mb-2 px-1">BI & Governance</h2>
          <div className="space-y-1">
            {[
              { label: 'Dashboard', icon: <LayoutDashboard size={15} />, color: '#4f46e5', bg: 'rgba(79,70,229,0.07)', onClick: onOpenDashboard },
              { label: 'Data Profiler', icon: <Activity size={15} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', onClick: onOpenDataProfiler },
              { label: 'Semantic Layer', icon: <BookOpen size={15} />, color: '#10b981', bg: 'rgba(16,185,129,0.08)', onClick: onOpenGlossary },
              { label: 'Audit Logs', icon: <ShieldCheck size={15} />, color: '#14b8a6', bg: 'rgba(20,184,166,0.08)', onClick: onOpenAuditLog },
              { label: 'ERD Visualizer', icon: <Network size={15} />, color: '#6366f1', bg: 'rgba(99,102,241,0.07)', onClick: onOpenERD },
              { label: 'History', icon: <Clock size={15} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.07)', onClick: onOpenHistory },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all group"
                style={{ border: '1px solid transparent', color: '#334155' }}
                onMouseEnter={e => { e.currentTarget.style.background = item.bg; e.currentTarget.style.borderColor = `${item.color}25`; e.currentTarget.style.color = item.color; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#334155'; }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.bg, color: item.color }}>
                  {item.icon}
                </div>
                <span className="text-[13px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Tables */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <button onClick={() => setTablesExpanded(!tablesExpanded)} className="flex items-center gap-1.5 group">
              <h2 className="label-caps">Tables</h2>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(15,23,42,0.05)', color: '#94a3b8' }}>
                {activeTables.length}/{tables.length}
              </span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${tablesExpanded ? '' : '-rotate-90'}`} style={{ color: '#94a3b8' }} />
            </button>
            <button
              onClick={onOpenTableBuilder}
              className="p-1 rounded-lg transition-colors"
              style={{ color: '#94a3b8' }}
              title="Create new table"
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; e.currentTarget.style.color = '#4f46e5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <Plus size={14} />
            </button>
          </div>

          <AnimatePresence>
            {tablesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5">
                  {tables.length > 0 ? tables.map((table, idx) => (
                    <motion.div
                      key={table} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center gap-0.5 group"
                    >
                      <button
                        onClick={() => toggleTable(table)}
                        className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-all"
                        style={activeTables.includes(table)
                          ? { background: 'rgba(79,70,229,0.07)', border: '1px solid rgba(79,70,229,0.16)', color: '#4f46e5' }
                          : { border: '1px solid transparent', color: '#64748b' }}
                        onMouseEnter={e => { if (!activeTables.includes(table)) { e.currentTarget.style.background = 'rgba(15,23,42,0.03)'; e.currentTarget.style.color = '#0f172a'; } }}
                        onMouseLeave={e => { if (!activeTables.includes(table)) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#64748b'; } }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <TableIcon size={13} style={{ color: activeTables.includes(table) ? '#4f46e5' : '#cbd5e1' }} />
                          <span className="truncate font-medium">{table}</span>
                        </div>
                        {activeTables.includes(table) && <CheckCircle2 size={13} style={{ color: '#4f46e5', opacity: 0.7 }} />}
                      </button>
                      <button
                        onClick={() => onBrowseTable(table)}
                        className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        style={{ color: '#cbd5e1' }}
                        title="Browse Data"
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; e.currentTarget.style.color = '#4f46e5'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#cbd5e1'; }}
                      >
                        <Eye size={13} />
                      </button>
                    </motion.div>
                  )) : (
                    <div className="px-3 py-8 text-center rounded-xl" style={{ border: '1px dashed rgba(15,23,42,0.10)' }}>
                      <Layers size={20} className="mx-auto mb-2" style={{ color: '#e2e8f0' }} />
                      <p className="text-[11px] font-medium" style={{ color: '#cbd5e1' }}>No tables found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Quick Import */}
        <section>
          <h2 className="label-caps mb-2 px-1">Quick Import</h2>
          <button
            onClick={onOpenUpload}
            className="w-full p-4 rounded-xl transition-all group flex flex-col items-center gap-2"
            style={{ border: '1.5px dashed rgba(15,23,42,0.12)', background: 'rgba(248,249,252,0.8)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.3)'; e.currentTarget.style.background = 'rgba(79,70,229,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.12)'; e.currentTarget.style.background = 'rgba(248,249,252,0.8)'; }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: 'rgba(79,70,229,0.08)' }}>
              <Upload size={16} style={{ color: '#4f46e5' }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: '#64748b' }}>Drop File Here</span>
            <span className="text-[9px] font-medium" style={{ color: '#cbd5e1' }}>CSV, XLSX, PDF, DOCX</span>
          </button>
        </section>
      </div>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(15,23,42,0.07)' }}>
        <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider px-1" style={{ color: '#94a3b8' }}>
          <span>Safe Environment</span>
          <div className="flex items-center gap-2">
            <button onClick={onOpenSettings} className="p-1 hover:bg-black/5 rounded-md transition-colors" title="AI Configuration">
              <Settings size={12} className="text-gray-400 hover:text-primary transition-colors" />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span style={{ color: '#10b981' }}>Ready</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
