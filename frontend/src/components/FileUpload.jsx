import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, ChevronRight, FileCode, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function FileUpload({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importMode, setImportMode] = useState('create_new');
  const [tableName, setTableName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', selected);
    
    try {
      const res = await axios.post('http://localhost:8000/api/upload', formData);
      setPreview(res.data);
      setTableName(res.data.filename.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase());
    } catch (err) {
      toast.error("Upload failed");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!tableName) return toast.error("Table name required");
    setIsImporting(true);
    try {
      await axios.post('http://localhost:8000/api/import', {
        file_path: preview.file_path,
        table_name: tableName,
        mode: importMode
      });
      toast.success("Data ingested successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Ingestion failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-3xl glass rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              <Upload className="text-primary" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter">Data Ingestion</h2>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">External Asset Integration</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-text-muted hover:text-white">
            <X size={32} />
          </button>
        </div>

        <div className="p-10 space-y-10 overflow-y-auto scroll-thin">
          {!file ? (
            <div 
              onClick={() => fileRef.current?.click()}
              className="group border-2 border-dashed border-white/10 rounded-[40px] p-16 flex flex-col items-center gap-6 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 relative z-10 shadow-inner">
                <Upload size={40} className="text-primary" />
              </div>
              <div className="text-center relative z-10 space-y-2">
                <p className="text-xl font-black tracking-tight">Select Data Asset</p>
                <p className="text-sm text-text-muted font-medium">Supports CSV, XLSX, PDF, DOCX, TXT</p>
              </div>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>
          ) : uploading ? (
            <div className="py-24 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <Loader2 className="text-primary animate-spin relative z-10" size={64} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-black uppercase tracking-widest text-primary animate-pulse">Analyzing Payload</p>
                <p className="text-xs text-text-muted font-bold tracking-widest">EXTRACTING METADATA & SCHEMA</p>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex items-center gap-6 p-6 rounded-[32px] bg-white/[0.03] border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0">
                  <FileText size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xl tracking-tight truncate">{file.name}</p>
                  <p className="text-xs font-bold text-text-muted tracking-widest uppercase mt-1">{(file.size / 1024).toFixed(2)} KB • {file.name.split('.').pop().toUpperCase()}</p>
                </div>
                <button onClick={() => setFile(null)} className="w-12 h-12 flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-all">
                  <Trash2 size={24} />
                </button>
              </div>

              {preview && (
                <div className="space-y-8">
                  <div className="p-8 rounded-[32px] bg-black/40 border border-white/5 space-y-4 shadow-inner">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-2">Data Stream Preview</h3>
                    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20 scroll-thin">
                      {preview.preview.type === 'table' ? (
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-white/5 font-black uppercase tracking-widest text-primary">
                              {preview.preview.columns.map(c => <th key={c} className="p-4 border-b border-white/5">{c}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.preview.data.map((row, i) => (
                              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                {Object.values(row).map((v, j) => <td key={j} className="p-4 border-b border-white/5 text-text-muted truncate max-w-[150px] font-medium">{String(v)}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-6">
                          <pre className="text-[11px] font-mono text-text-muted whitespace-pre-wrap leading-relaxed">{preview.preview.preview}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Integration Protocol</label>
                      <select 
                        value={importMode} 
                        onChange={e => setImportMode(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-[24px] py-4 px-6 focus:border-primary/50 outline-none text-sm font-bold uppercase tracking-wide cursor-pointer hover:bg-black/80 transition-all"
                      >
                        <option value="create_new">Initialize New Architecture</option>
                        <option value="append">Append to Existing Logic</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Target Identifier</label>
                      <input 
                        type="text" 
                        value={tableName} 
                        onChange={e => setTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'))} 
                        className="w-full bg-black/60 border border-white/10 rounded-[24px] py-4 px-6 focus:border-primary/50 outline-none text-sm font-black tracking-tight"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="p-10 border-t border-white/5 flex justify-end gap-6 bg-black/20">
          <button onClick={onClose} className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-white transition-all">Cancel Mission</button>
          <button 
            onClick={handleImport} 
            disabled={!preview || isImporting}
            className="px-12 py-5 rounded-[24px] bg-primary hover:bg-primary/80 disabled:opacity-20 text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_40px_rgba(124,58,237,0.3)] hover:shadow-[0_20px_50px_rgba(124,58,237,0.4)] transition-all active:scale-95 flex items-center gap-3"
          >
            {isImporting ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
            {isImporting ? 'Ingesting Payload...' : 'Execute Ingestion'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
