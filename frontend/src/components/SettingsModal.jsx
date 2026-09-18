import React, { useState, useEffect } from 'react';
import { X, Settings, Key, Globe, Cpu, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'sqlagent_ai_settings';

export function loadAISettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { apiKey: '', baseUrl: '', model: '' };
  } catch {
    return { apiKey: '', baseUrl: '', model: '' };
  }
}

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');

  useEffect(() => {
    if (isOpen) {
      const saved = loadAISettings();
      setApiKey(saved.apiKey || '');
      setBaseUrl(saved.baseUrl || '');
      setModel(saved.model || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    const settings = { apiKey, baseUrl, model };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success('Settings saved to your browser!');
    onClose();
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
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Stored locally in your browser</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-xs text-amber-400/80 bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3">
            🔐 Your API key is stored only in <strong>your browser</strong> and sent directly with each request. It is never saved on the server.
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Key size={12} /> API Key
            </label>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-... or gsk_... or AIza..."
              className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Globe size={12} /> Base URL
            </label>
            <input 
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.groq.com/openai/v1"
              className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white"
            />
            <p className="text-[10px] text-gray-500 mt-1.5 ml-1">Leave blank for OpenAI. Groq: https://api.groq.com/openai/v1</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Cpu size={12} /> Model Name
            </label>
            <input 
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="llama-3.1-8b-instant"
              className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white"
            />
            <p className="text-[10px] text-gray-500 mt-1.5 ml-1">e.g. gpt-4o-mini, llama-3.1-8b-instant, gemini-1.5-flash</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.06] bg-black/40 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 hover:bg-white/5 rounded-xl text-xs font-bold text-gray-400">Cancel</button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-primary hover:bg-primary/90 rounded-xl text-xs font-bold text-white shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Save size={14} />
            Save Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
}
