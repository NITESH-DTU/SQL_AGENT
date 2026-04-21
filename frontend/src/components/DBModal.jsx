import React, { useState } from 'react';
import { X, Database, Globe, Lock, User, Terminal, CheckCircle2, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        className="relative w-full max-w-lg glass rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
      >
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              <Database className="text-primary" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter">Connection</h2>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">Data Source Setup</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-text-muted hover:text-white">
            <X size={28} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          <div className="flex p-2 rounded-[24px] bg-black/40 border border-white/5">
            <button 
              onClick={() => setTab('existing')}
              className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${tab === 'existing' ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'text-text-muted hover:text-white'}`}
            >
              Connect Existing
            </button>
            <button 
              onClick={() => setTab('create')}
              className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${tab === 'create' ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'text-text-muted hover:text-white'}`}
            >
              Create New
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-2">Engine Architecture</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'sqlite', name: 'SQLite', icon: <Terminal size={20} /> },
                  { id: 'postgresql', name: 'Postgres', icon: <Globe size={20} /> }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setDbType(type.id)}
                    className={`p-5 rounded-[28px] border flex flex-col items-center gap-3 transition-all duration-500 relative overflow-hidden group ${
                      dbType === type.id ? 'bg-primary/10 border-primary/50' : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                    }`}
                  >
                    {dbType === type.id && (
                      <motion.div layoutId="active-bg" className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${dbType === type.id ? 'bg-primary text-white scale-110' : 'bg-white/10 text-text-muted group-hover:scale-110'}`}>
                      {type.icon}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${dbType === type.id ? 'text-primary' : 'text-text-muted'}`}>
                      {type.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {recent.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Recent Connections</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scroll-thin">
                    {recent.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setDbType(r.db_type);
                          setForm(r);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all shrink-0"
                      >
                        {r.db_type === 'sqlite' ? <Terminal size={12} /> : <Globe size={12} />}
                        <span className="text-[10px] font-bold">{r.filepath || r.dbname}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {dbType === 'sqlite' ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Database Path</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                      <Database size={20} />
                    </div>
                    <input 
                      type="text" 
                      value={form.filepath}
                      onChange={e => setForm({...form, filepath: e.target.value})}
                      placeholder="e.g. project_data.db" 
                      className="w-full bg-black/60 border border-white/10 rounded-[24px] py-5 pl-14 pr-6 focus:border-primary/50 focus:ring-0 transition-all font-mono text-sm tracking-tight placeholder:text-text-muted/30"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Host Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                        <Server size={20} />
                      </div>
                      <input type="text" value={form.host} onChange={e => setForm({...form, host: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[24px] py-4 pl-14 pr-6 focus:border-primary/50 transition-all text-sm font-semibold" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">DB Name</label>
                    <input type="text" value={form.dbname} onChange={e => setForm({...form, dbname: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[24px] py-4 px-6 focus:border-primary/50 transition-all text-sm font-semibold" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Username</label>
                    <input type="text" value={form.user} onChange={e => setForm({...form, user: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[24px] py-4 px-6 focus:border-primary/50 transition-all text-sm font-semibold" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                        <Lock size={20} />
                      </div>
                      <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[24px] py-4 pl-14 pr-6 focus:border-primary/50 transition-all text-sm font-semibold" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="w-full p-6 rounded-[28px] bg-primary hover:bg-primary/80 text-white font-black uppercase tracking-[0.2em] text-sm shadow-[0_20px_40px_rgba(124,58,237,0.3)] hover:shadow-[0_20px_50px_rgba(124,58,237,0.4)] active:scale-95 transition-all mt-4 border border-white/10">
              {tab === 'create' ? 'Initialize Engine' : 'Establish Connect'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
