import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Table as TableIcon, Download, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function DataExplorer({ table, onClose }) {
  const [data, setData] = useState({ rows: [], total: 0, total_pages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [table, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/data/${table}?page=${page}`);
      setData(res.data);
    } catch (err) {
      toast.error("Failed to fetch table data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const filename = `${table}_export.csv`;
    const url = `${API_BASE}/export/csv?sql=${encodeURIComponent(`SELECT * FROM ${table}`)}&filename=${filename}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full h-full max-w-6xl glass rounded-[40px] shadow-2xl border border-white/10 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <TableIcon className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{table}</h2>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Manual Data Explorer • {data.total} Records</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExport}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-success/40 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              <Download size={14} className="text-success" /> Export CSV
            </button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-text-muted hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto scroll-thin relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Loader2 size={40} className="text-primary animate-spin" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Fetching Records...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 bg-surface/80 backdrop-blur-xl z-10">
                <tr>
                  {data.rows.length > 0 && Object.keys(data.rows[0]).map(col => (
                    <th key={col} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-primary border-b border-white/5">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {data.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-6 py-4 text-sm font-medium text-text-muted group-hover:text-text-primary transition-colors">
                        {val === null ? <span className="opacity-20 italic">NULL</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && data.rows.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-20">
              <Search size={64} />
              <p className="mt-4 text-xl font-black uppercase tracking-widest">No Records Found</p>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Page {data.page} of {data.total_pages}
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-20 hover:border-primary/50 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-1">
               {/* Simplified page numbers could go here */}
            </div>
            <button 
              disabled={page === data.total_pages || loading}
              onClick={() => setPage(p => p + 1)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-20 hover:border-primary/50 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
