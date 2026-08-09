import React, { useState } from 'react';
import { X, Database, Globe, Lock, Terminal, Server, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function DBModal({ onClose, onConnect }) {
  const [tab, setTab] = useState('existing');
  const [dbType, setDbType] = useState('sqlite');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    filepath: 'database.db',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const config = { db_type: dbType, ...form };

    try {
      let res;
      if (tab === 'create') {
        res = await axios.post(`${API_BASE}/create-db`, config);
        toast.success(`Database '${res.data.db_name}' created & connected`);
      } else {
        res = await axios.post(`${API_BASE}/connect`, config);
        toast.success(`Connected to ${res.data.db_name}`);
      }

      // Save to recent
      const newRecent = [config, ...recent.filter(r => r.filepath !== config.filepath || r.dbname !== config.dbname)].slice(0, 5);
      localStorage.setItem('recent_dbs', JSON.stringify(newRecent));
      setRecent(newRecent);

      onConnect({ ...res.data, config });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || (tab === 'create' ? 'Failed to create database' : 'Connection failed'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: 'white', border: '1.5px solid rgba(15,23,42,0.10)',
    borderRadius: '14px', padding: '11px 18px', outline: 'none',
    fontSize: '13px', fontWeight: '500', color: '#0f172a',
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    transition: 'all 0.15s',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(15,23,42,0.3)' }}
      />

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: 'white',
          border: '1px solid rgba(15,23,42,0.09)',
          boxShadow: '0 8px 40px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)',
        }}
      >
        {/* Subtle top gradient accent */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #4f46e5, #06b6d4, #818cf8)' }} />

        {/* Header */}
        <div className="px-8 pt-6 pb-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.10), rgba(6,182,212,0.08))', border: '1px solid rgba(79,70,229,0.15)' }}
            >
              <Database style={{ color: '#4f46e5' }} size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: '#0f172a' }}>Data Connection</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5" style={{ color: '#94a3b8' }}>Configure your data source</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{ color: '#94a3b8', border: '1px solid rgba(15,23,42,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Tabs */}
          <div className="flex p-1 rounded-2xl gap-1" style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.06)' }}>
            {[
              { id: 'existing', label: 'Connect Existing' },
              { id: 'create', label: 'Create New' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                style={tab === t.id
                  ? { background: 'white', color: '#4f46e5', boxShadow: '0 1px 6px rgba(15,23,42,0.08)', border: '1px solid rgba(79,70,229,0.15)' }
                  : { color: '#94a3b8', border: '1px solid transparent' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Engine Picker */}
            <div className="space-y-2">
              <label className="label-caps px-0.5">Engine Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'sqlite', name: 'SQLite', sub: 'Local file', icon: <Terminal size={17} /> },
                  { id: 'postgresql', name: 'PostgreSQL', sub: 'Remote server', icon: <Globe size={17} /> },
                ].map(type => (
                  <button
                    key={type.id} type="button" onClick={() => setDbType(type.id)}
                    className="p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left"
                    style={dbType === type.id
                      ? { background: 'rgba(79,70,229,0.06)', border: '1.5px solid rgba(79,70,229,0.25)' }
                      : { background: 'rgba(15,23,42,0.02)', border: '1.5px solid rgba(15,23,42,0.08)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                      style={dbType === type.id
                        ? { background: 'rgba(79,70,229,0.12)', color: '#4f46e5' }
                        : { background: 'rgba(15,23,42,0.05)', color: '#94a3b8' }}
                    >
                      {type.icon}
                    </div>
                    <div>
                      <div className="text-[12px] font-bold" style={{ color: dbType === type.id ? '#4f46e5' : '#334155' }}>{type.name}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>{type.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent */}
            {tab === 'existing' && recent.length > 0 && (
              <div className="space-y-2">
                <label className="label-caps px-0.5">Recent</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scroll-thin">
                  {recent.map((r, i) => (
                    <button
                      key={i} type="button"
                      onClick={() => { setDbType(r.db_type); setForm(r); }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0 transition-all"
                      style={{ background: 'rgba(15,23,42,0.03)', border: '1px solid rgba(15,23,42,0.08)', color: '#334155', fontSize: '11px', fontWeight: '600' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.2)'; e.currentTarget.style.color = '#4f46e5'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)'; e.currentTarget.style.color = '#334155'; }}
                    >
                      {r.db_type === 'sqlite' ? <Terminal size={11} style={{ color: '#94a3b8' }} /> : <Globe size={11} style={{ color: '#94a3b8' }} />}
                      {r.filepath || r.dbname}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fields */}
            <div className="space-y-3">
              {dbType === 'sqlite' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <label className="label-caps">
                      {tab === 'create' ? 'New Database Name' : 'Database Path'}
                    </label>
                    {tab === 'create' && (
                      <button type="button" onClick={() => setForm({ ...form, filepath: `mydb_${Date.now()}.db` })}
                        className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg transition-all"
                        style={{ background: 'rgba(79,70,229,0.08)', color: '#4f46e5' }}
                      >
                        <Sparkles size={10} className="inline mr-1" />Auto Name
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Database size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#cbd5e1' }} />
                    <input
                      type="text" value={form.filepath}
                      onChange={e => setForm({ ...form, filepath: e.target.value })}
                      placeholder={tab === 'create' ? 'e.g. analytics.db' : 'e.g. data.db'}
                      style={{ ...inputStyle, paddingLeft: '38px', fontFamily: 'JetBrains Mono, monospace' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(79,70,229,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.10)'; e.target.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04)'; }}
                    />
                  </div>
                  <p className="text-[10px] px-0.5" style={{ color: '#cbd5e1' }}>
                    {tab === 'create' ? 'A new SQLite file will be created at this name.' : 'Use simple names like \'data.db\'. Full paths are not supported.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="label-caps">Host Address</label>
                    <div className="relative">
                      <Server size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#cbd5e1' }} />
                      <input type="text" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} style={{ ...inputStyle, paddingLeft: '38px' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(79,70,229,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.10)'; e.target.style.boxShadow = ''; }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="label-caps">DB Name</label>
                    <input type="text" value={form.dbname} onChange={e => setForm({ ...form, dbname: e.target.value })} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'rgba(79,70,229,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.10)'; e.target.style.boxShadow = ''; }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="label-caps">Username</label>
                    <input type="text" value={form.user} onChange={e => setForm({ ...form, user: e.target.value })} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'rgba(79,70,229,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.10)'; e.target.style.boxShadow = ''; }}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="label-caps">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#cbd5e1' }} />
                      <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ ...inputStyle, paddingLeft: '38px' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(79,70,229,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.10)'; e.target.style.boxShadow = ''; }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              style={{
                background: loading ? 'rgba(79,70,229,0.5)' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: 'white',
                boxShadow: '0 2px 12px rgba(79,70,229,0.30)',
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Connecting...' : tab === 'create' ? '✨ Initialize New Database' : 'Establish Connection'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
