import React, { useState, useEffect } from 'react';
import { X, BookOpen, Plus, Trash2, Edit2, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function GlossaryManager({ isOpen, onClose }) {
  const [glossary, setGlossary] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTerm, setEditingTerm] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // New entry state
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addingTermTo, setAddingTermTo] = useState(null);
  const [newTermName, setNewTermName] = useState('');
  const [newTermValue, setNewTermValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchGlossary();
    }
  }, [isOpen]);

  const fetchGlossary = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/glossary`);
      setGlossary(res.data || {});
    } catch (e) {
      toast.error('Failed to load semantic layer');
    } finally {
      setLoading(false);
    }
  };

  const saveGlossary = async (newGlossary) => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/glossary`, newGlossary);
      setGlossary(newGlossary);
      toast.success('Semantic layer updated');
    } catch (e) {
      toast.error('Failed to save changes');
      fetchGlossary(); // revert on fail
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    const catName = newCategory.trim();
    if (glossary[catName]) {
      toast.error('Category already exists');
      return;
    }
    const updated = { ...glossary, [catName]: {} };
    saveGlossary(updated);
    setNewCategory('');
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (cat) => {
    if (confirm(`Delete category "${cat}" and all its terms?`)) {
      const updated = { ...glossary };
      delete updated[cat];
      saveGlossary(updated);
    }
  };

  const handleAddTerm = (category) => {
    if (!newTermName.trim() || !newTermValue.trim()) return;
    const term = newTermName.trim();
    if (glossary[category][term]) {
      toast.error('Term already exists');
      return;
    }
    const updated = {
      ...glossary,
      [category]: { ...glossary[category], [term]: newTermValue.trim() }
    };
    saveGlossary(updated);
    setAddingTermTo(null);
    setNewTermName('');
    setNewTermValue('');
  };

  const handleDeleteTerm = (category, term) => {
    const updated = { ...glossary };
    delete updated[category][term];
    saveGlossary(updated);
  };

  const handleSaveEdit = (category, term) => {
    const updated = {
      ...glossary,
      [category]: { ...glossary[category], [term]: editValue.trim() }
    };
    saveGlossary(updated);
    setEditingTerm(null);
    setEditingCategory(null);
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="relative w-full h-full max-w-4xl glass rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/[0.08] overflow-hidden flex flex-col"
      >
        <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between bg-black/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/25 shadow-lg shadow-emerald-500/10">
              <BookOpen className="text-emerald-500" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-text-primary">Semantic Layer</h2>
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mt-0.5">Business Glossary & Logic</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full text-text-muted animate-pulse">Loading...</div>
          ) : (
            <div className="space-y-8">
              {Object.keys(glossary).map(category => (
                <div key={category} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
                    <h3 className="text-lg font-bold text-emerald-400">{category}</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setAddingTermTo(category)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Plus size={14} /> Add Term
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category)}
                        className="p-1.5 rounded-lg text-danger/50 hover:bg-danger/10 hover:text-danger transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(glossary[category]).map(([term, value]) => (
                      <div key={term} className="p-4 rounded-xl bg-black/20 border border-white/[0.03] group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="w-1/3 shrink-0">
                            <span className="text-sm font-bold text-text-primary">{term}</span>
                          </div>
                          
                          <div className="flex-1">
                            {editingCategory === category && editingTerm === term ? (
                              <textarea
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                className="w-full bg-black/40 border border-emerald-500/30 rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:border-emerald-500"
                                rows={2}
                              />
                            ) : (
                              <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">{value}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingCategory === category && editingTerm === term ? (
                              <button onClick={() => handleSaveEdit(category, term)} className="p-1.5 text-success hover:bg-success/10 rounded-lg" disabled={saving}>
                                <Check size={14} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditingTerm(term);
                                  setEditValue(value);
                                }} 
                                className="p-1.5 text-text-muted hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                            <button onClick={() => handleDeleteTerm(category, term)} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {addingTermTo === category && (
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex gap-3">
                        <input
                          placeholder="Term Name (e.g. Active User)"
                          value={newTermName}
                          onChange={e => setNewTermName(e.target.value)}
                          className="w-1/3 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          placeholder="Definition or SQL Formula"
                          value={newTermValue}
                          onChange={e => setNewTermValue(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-emerald-500"
                          onKeyDown={e => { if(e.key === 'Enter') handleAddTerm(category); }}
                        />
                        <button onClick={() => handleAddTerm(category)} className="px-4 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg">Save</button>
                        <button onClick={() => setAddingTermTo(null)} className="px-3 bg-white/5 hover:bg-white/10 rounded-lg text-text-muted">Cancel</button>
                      </div>
                    )}
                    
                    {Object.keys(glossary[category]).length === 0 && addingTermTo !== category && (
                      <div className="text-center py-6 text-sm text-text-muted/40 italic">No terms defined in this category</div>
                    )}
                  </div>
                </div>
              ))}

              {isAddingCategory ? (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] border-dashed flex items-center gap-3">
                  <input
                    placeholder="New Category Name (e.g. Marketing Metrics)"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-emerald-500"
                    onKeyDown={e => { if(e.key === 'Enter') handleAddCategory(); }}
                    autoFocus
                  />
                  <button onClick={handleAddCategory} className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-bold tracking-wider">Create</button>
                  <button onClick={() => setIsAddingCategory(false)} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-text-muted font-bold text-xs">Cancel</button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAddingCategory(true)}
                  className="w-full py-4 rounded-2xl border border-white/[0.05] border-dashed hover:border-emerald-500/30 hover:bg-emerald-500/5 text-text-muted hover:text-emerald-400 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <Plus size={18} /> Add New Category
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
