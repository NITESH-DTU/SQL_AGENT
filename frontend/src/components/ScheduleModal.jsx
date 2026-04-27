import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Clock, Calendar, Mail, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function ScheduleModal({ isOpen, onClose, widget }) {
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !widget) return null;

  const handleSchedule = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/schedule`, {
        widget_id: widget.id,
        email,
        frequency,
        time
      });
      toast.success(res.data.message);
      onClose();
    } catch (e) {
      toast.error("Failed to schedule report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-[#0a0a0f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Send size={18} />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Schedule Report</h3>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{widget.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-text-muted transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
              <Mail size={12} /> Delivery Email
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team@company.com"
              className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                <Calendar size={12} /> Frequency
              </label>
              <select 
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock size={12} /> Time
              </label>
              <input 
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mt-4">
            <h4 className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-2"><CheckCircle2 size={12} /> Automated Delivery</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              This widget's data and visual chart will be exported as a PDF and sent to the specified email {frequency} at {time}.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.06] bg-black/40 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 hover:bg-white/5 rounded-xl text-xs font-bold text-text-muted">Cancel</button>
          <button 
            onClick={handleSchedule}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            {loading ? <Clock size={14} className="animate-spin" /> : <Send size={14} />}
            Confirm Schedule
          </button>
        </div>
      </motion.div>
    </div>
  );
}
