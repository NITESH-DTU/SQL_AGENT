import React, { useState, useRef } from 'react';
import { X, Upload, FileText, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
      toast.success("Data imported successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-3xl glass rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/[0.08] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/[0.05] flex items-center justify-between bg-black/15">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/15 flex items-center justify-center border border-primary/25 shadow-lg shadow-primary/10">
              <Upload className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gradient">Data Import</h2>
              <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider mt-0.5">File Upload & Ingestion</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-white/[0.06] rounded-xl transition-all text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto scroll-thin">
          {!file ? (
            <div 
              onClick={() => fileRef.current?.click()}
              className="group border-2 border-dashed border-white/[0.08] rounded-2xl p-12 flex flex-col items-center gap-5 hover:border-primary/30 hover:bg-primary/[0.02] transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-10">
                <Upload size={32} className="text-primary" />
              </div>
              <div className="text-center relative z-10 space-y-1.5">
                <p className="text-lg font-bold tracking-tight">Select Data File</p>
                <p className="text-sm text-text-muted font-medium">Supports CSV, XLSX, PDF, DOCX, TXT</p>
              </div>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>
          ) : uploading ? (
            <div className="py-20 flex flex-col items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/15 blur-2xl rounded-full" />
                <Loader2 className="text-primary animate-spin relative z-10" size={48} />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-base font-bold text-primary animate-pulse">Analyzing File</p>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Extracting metadata & schema</p>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* File Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] group">
                <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center text-primary shrink-0">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base tracking-tight truncate">{file.name}</p>
                  <p className="text-[11px] text-text-muted font-medium mt-0.5">{(file.size / 1024).toFixed(1)} KB • {file.name.split('.').pop().toUpperCase()}</p>
                </div>
                <button onClick={() => setFile(null)} className="w-9 h-9 flex items-center justify-center text-text-muted/30 hover:text-danger hover:bg-danger/8 rounded-lg transition-all">
                  <Trash2 size={18} />
                </button>
              </div>

              {preview && (
                <div className="space-y-6">
                  {/* Preview Table */}
                  <div className="p-5 rounded-xl bg-black/25 border border-white/[0.04] space-y-3">
                    <h3 className="label-caps px-1">Data Preview</h3>
                    <div className="overflow-x-auto rounded-xl border border-white/[0.04] bg-black/15 scroll-thin">
                      {preview.preview.type === 'table' ? (
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-white/[0.03]">
                              {preview.preview.columns.map(c => <th key={c} className="px-4 py-2.5 border-b border-white/[0.04] font-bold uppercase tracking-wider text-primary/50 text-[10px]">{c}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.preview.data.map((row, i) => (
                              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                {Object.values(row).map((v, j) => <td key={j} className="px-4 py-2.5 border-b border-white/[0.03] text-text-muted truncate max-w-[140px] font-medium">{String(v)}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-5">
                          <pre className="text-[11px] font-mono text-text-muted whitespace-pre-wrap leading-relaxed">{preview.preview.preview}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Import Config */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <label className="label-caps px-1">Import Mode</label>
                      <select 
                        value={importMode} 
                        onChange={e => setImportMode(e.target.value)}
                        className="input-field text-sm font-medium cursor-pointer"
                      >
                        <option value="create_new">Create New Table</option>
                        <option value="append">Append to Existing</option>
                      </select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="label-caps px-1">Table Name</label>
                      <input 
                        type="text" 
                        value={tableName} 
                        onChange={e => setTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'))} 
                        className="input-field font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/[0.05] flex justify-end gap-4 bg-black/15">
          <button onClick={onClose} className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted hover:text-white transition-all">Cancel</button>
          <button 
            onClick={handleImport} 
            disabled={!preview || isImporting}
            className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary/85 disabled:opacity-20 text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            {isImporting ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
            {isImporting ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
