import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Table as TableIcon, Download, Search, Loader2, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function DataExplorer({ table, onClose, activeTables = [] }) {
  const [data, setData] = useState({ rows: [], total: 0, total_pages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [table, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const activeParam = activeTables.join(',');
      const res = await axios.get(`${API_BASE}/data/${table}?page=${page}&active_tables=${activeParam}`);
      setData(res.data);
    } catch (err) {
      toast.error("Failed to fetch table data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const filename = `${table}_export.csv`;
    const activeParam = activeTables.join(',');
    const url = `${API_BASE}/export/csv?sql=${encodeURIComponent(`SELECT * FROM "${table}"`)}&filename=${filename}&active_tables=${activeParam}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full h-full max-w-6xl glass rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/[0.08] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/[0.05] flex items-center justify-between bg-black/15 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/15 flex items-center justify-center border border-primary/25 shadow-lg shadow-primary/10">
              <TableIcon className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gradient">{table}</h2>
              <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider mt-0.5">Data Explorer • {data.total} Records</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-success/30 text-xs font-semibold flex items-center gap-2 transition-all hover:bg-success/5"
            >
              <Download size={13} className="text-success" /> Export CSV
            </button>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-white/[0.06] rounded-xl transition-all text-text-muted hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto scroll-thin relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/15 blur-2xl rounded-full" />
                <Loader2 size={36} className="text-primary animate-spin relative z-10" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted animate-pulse">Fetching Records...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 bg-surface/90 backdrop-blur-xl z-10">
                <tr>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-muted/40 border-b border-white/[0.05] w-12 text-center">#</th>
                  {data.rows.length > 0 && Object.keys(data.rows[0]).map(col => (
                    <th key={col} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-primary/60 border-b border-white/[0.05]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {data.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3 text-[10px] font-mono text-text-muted/25 text-center">{(page - 1) * 15 + i + 1}</td>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-5 py-3 text-[13px] font-medium text-text-muted group-hover:text-text-primary transition-colors">
                        {val === null ? <span className="text-text-muted/15 italic text-xs">NULL</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && data.rows.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-15">
              <Search size={48} />
              <p className="mt-4 text-sm font-bold uppercase tracking-wider">No Records Found</p>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 border-t border-white/[0.05] bg-black/15 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-medium text-text-muted/50 uppercase tracking-wider">
            Page {data.page} of {data.total_pages}
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center disabled:opacity-15 hover:border-primary/30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {/* Page chips */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(data.total_pages, 5) }, (_, i) => {
                let pageNum;
                if (data.total_pages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= data.total_pages - 2) {
                  pageNum = data.total_pages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-[11px] font-semibold transition-all ${
                      pageNum === page 
                        ? 'bg-primary/15 text-primary border border-primary/20' 
                        : 'bg-white/[0.02] text-text-muted/40 hover:text-text-muted border border-transparent'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button 
              disabled={page === data.total_pages || loading}
              onClick={() => setPage(p => p + 1)}
              className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center disabled:opacity-15 hover:border-primary/30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
