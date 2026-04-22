import React, { useState } from 'react';
import { X, Database, Globe, Lock, Terminal, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DBModal({ onClose, onConnect }) {
  const [tab, setTab] = useState('existing');
  const [dbType, setDbType] = useState('sqlite');
  const [form, setForm] = useState({
    filepath: 'antigravity.db',
    host: 'localhost',
    port: '5432',
    dbname: '',
    user: '',
    password: ''
  });

  const [recent, setRecent] = useState(() => {
    const saved = localStorage.getItem('recent_dbs');
    return saved ? JSON.parse(saved) : [];
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const config = { db_type: dbType, ...form };
    
    // Save to recent
    const newRecent = [config, ...recent.filter(r => r.filepath !== config.filepath || r.dbname !== config.dbname)].slice(0, 5);
    localStorage.setItem('recent_dbs', JSON.stringify(newRecent));
    setRecent(newRecent);

    onConnect(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg glass rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/[0.08] overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-6 border-b border-white/[0.05] flex items-center justify-between bg-black/15">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/15 flex items-center justify-center border border-primary/25 shadow-lg shadow-primary/10">
              <Database className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gradient">Connection</h2>
              <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider mt-0.5">Data Source Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-white/[0.06] rounded-xl transition-all text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Tabs */}
          <div className="flex p-1 rounded-xl bg-black/30 border border-white/[0.05]">
            <button 
              onClick={() => setTab('existing')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${tab === 'existing' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:text-white'}`}
            >
              Connect Existing
            </button>
            <button 
              onClick={() => setTab('create')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${tab === 'create' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:text-white'}`}
            >
              Create New
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Engine Type */}
            <div className="space-y-2.5">
              <label className="label-caps px-1">Engine Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'sqlite', name: 'SQLite', icon: <Terminal size={18} /> },
                  { id: 'postgresql', name: 'Postgres', icon: <Globe size={18} /> }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setDbType(type.id)}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all duration-200 relative overflow-hidden group ${
                      dbType === type.id ? 'bg-primary/8 border-primary/30' : 'bg-white/[0.01] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${dbType === type.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/[0.04] text-text-muted group-hover:bg-white/[0.08]'}`}>
                      {type.icon}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${dbType === type.id ? 'text-primary' : 'text-text-muted'}`}>
                      {type.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Connections */}
            {recent.length > 0 && (
              <div className="space-y-2.5">
                <label className="label-caps px-1">Recent</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scroll-thin">
                  {recent.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDbType(r.db_type);
                        setForm(r);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-primary/25 transition-all shrink-0"
                    >
                      {r.db_type === 'sqlite' ? <Terminal size={11} className="text-text-muted/50" /> : <Globe size={11} className="text-text-muted/50" />}
                      <span className="text-[10px] font-medium">{r.filepath || r.dbname}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {dbType === 'sqlite' ? (
                <div className="space-y-2.5">
                  <label className="label-caps px-1">Database Path</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted/30 group-focus-within:text-primary/50 transition-colors">
                      <Database size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={form.filepath}
                      onChange={e => setForm({...form, filepath: e.target.value})}
                      placeholder="e.g. project_data.db" 
                      className="input-field pl-11 font-mono text-[13px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2.5">
                    <label className="label-caps px-1">Host Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted/30 group-focus-within:text-primary/50 transition-colors">
                        <Server size={16} />
                      </div>
                      <input type="text" value={form.host} onChange={e => setForm({...form, host: e.target.value})} className="input-field pl-11 font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <label className="label-caps px-1">DB Name</label>
                    <input type="text" value={form.dbname} onChange={e => setForm({...form, dbname: e.target.value})} className="input-field" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="label-caps px-1">Username</label>
                    <input type="text" value={form.user} onChange={e => setForm({...form, user: e.target.value})} className="input-field" />
                  </div>
                  <div className="col-span-2 space-y-2.5">
                    <label className="label-caps px-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted/30 group-focus-within:text-primary/50 transition-colors">
                        <Lock size={16} />
                      </div>
                      <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field pl-11" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="w-full p-4 rounded-xl bg-primary hover:bg-primary/85 text-white font-bold uppercase tracking-wider text-sm shadow-lg shadow-primary/25 hover:shadow-primary/35 active:scale-[0.98] transition-all border border-white/[0.08]">
              {tab === 'create' ? 'Initialize Engine' : 'Establish Connection'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
