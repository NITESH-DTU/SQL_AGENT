import React, { useState, useEffect } from 'react';
import { X, Settings, Key, Globe, Cpu, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/settings`);
      setApiKey(res.data.openai_api_key || '');
      setBaseUrl(res.data.openai_base_url || '');
      setModel(res.data.openai_model || '');
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/settings`, {
        openai_api_key: apiKey,
        openai_base_url: baseUrl,
        openai_model: model
      });
      toast.success('Settings saved successfully');
      onClose();
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#0a0a0f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white">AI Configuration</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">API Keys & Models</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Key size={12} /> OpenAI API Key
                </label>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white"
                />
                <p className="text-[10px] text-gray-500 mt-1.5 ml-1">Leave as *** to keep the existing key.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Globe size={12} /> Base URL
                </label>
                <input 
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white"
                />
                <p className="text-[10px] text-gray-500 mt-1.5 ml-1">e.g. for Groq use https://api.groq.com/openai/v1</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Cpu size={12} /> Model Name
                </label>
                <input 
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white"
                />
                <p className="text-[10px] text-gray-500 mt-1.5 ml-1">e.g. gpt-4o-mini, llama-3.1-8b-instant</p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/[0.06] bg-black/40 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 hover:bg-white/5 rounded-xl text-xs font-bold text-gray-400">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl text-xs font-bold text-white shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
}
