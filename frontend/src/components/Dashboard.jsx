import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, LayoutDashboard, RefreshCw, Trash2, Edit3, 
  Plus, MousePointer2, Clock, Calendar, Database, Maximize2
} from 'lucide-react';
import useDashboard from '../hooks/useDashboard';
import { MetricWidget, MiniTableWidget, ChartWidget } from './DashboardWidgets';
import WidgetModal from './WidgetModal';

export default function Dashboard({ isOpen, onClose }) {
  const { widgets, isLoading, fetchWidgets, deleteWidget, refreshWidget, updateWidget, addWidget, reorderWidgets } = useDashboard();
  const [widgetData, setWidgetData] = useState({}); // { widgetId: { rows, trend, value } }
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchWidgets();
    }
  }, [isOpen, fetchWidgets]);

  const handleRefreshWidget = useCallback(async (widgetId) => {
    const data = await refreshWidget(widgetId);
    if (!data.error) {
      setWidgetData(prev => ({ ...prev, [widgetId]: data }));
    }
  }, [refreshWidget]);

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    await Promise.all(widgets.map(w => handleRefreshWidget(w.id)));
    setIsRefreshingAll(false);
  };

  // Initial load for each widget
  useEffect(() => {
    if (widgets.length > 0) {
      widgets.forEach(w => {
        if (!widgetData[w.id]) handleRefreshWidget(w.id);
      });
    }
  }, [widgets, handleRefreshWidget]);

  // Auto-refresh logic
  useEffect(() => {
    const intervals = widgets
      .filter(w => w.auto_refresh > 0)
      .map(w => setInterval(() => handleRefreshWidget(w.id), w.auto_refresh * 1000));
    
    return () => intervals.forEach(clearInterval);
  }, [widgets, handleRefreshWidget]);

  const handleSaveWidget = async (formData) => {
    if (editingWidget) {
      await updateWidget(editingWidget.id, formData);
      setEditingWidget(null);
    } else {
      await addWidget(formData);
    }
    fetchWidgets();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-8 py-5 border-b border-white/[0.05] flex items-center justify-between bg-surface/30 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <LayoutDashboard size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">Analytics Dashboard</h2>
            <div className="flex items-center gap-3 text-[10px] text-text-muted mt-0.5">
              <span className="flex items-center gap-1"><Clock size={10} /> Live Monitoring</span>
              <span className="text-white/10">•</span>
              <span className="flex items-center gap-1"><Database size={10} /> {widgets.length} Widgets Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefreshAll}
            disabled={isRefreshingAll}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-text-primary border border-white/[0.08] transition-all"
          >
            <RefreshCw size={14} className={isRefreshingAll ? 'animate-spin' : ''} />
            Refresh All
          </button>
          <button 
            onClick={() => { setEditingWidget(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all"
          >
            <Plus size={14} /> New Widget
          </button>
          <div className="w-px h-6 bg-white/[0.08] mx-1" />
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-text-muted transition-colors"><X size={22} /></button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-8 scroll-thin">
        {isLoading && widgets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 py-32">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-text-muted text-sm font-medium">Analyzing dashboard configuration...</span>
          </div>
        ) : widgets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-32">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6 text-text-muted/10">
              <Plus size={40} />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">No Widgets Found</h3>
            <p className="text-text-muted text-sm leading-relaxed mb-8">
              Pin charts from the chat or create new ones directly to start monitoring your metrics.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary px-8 py-3 rounded-2xl text-sm">Create First Widget</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1600px] mx-auto">
            {widgets.map((w) => (
              <motion.div 
                layout
                key={w.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group relative bg-surface border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl flex flex-col min-h-[340px] ${
                  w.width === 'full' ? 'md:col-span-2' : ''
                } hover:border-white/20 transition-all duration-300`}
              >
                {/* Widget Header */}
                <div className="px-6 py-4 border-b border-white/[0.03] flex items-center justify-between bg-white/[0.01]">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary truncate">{w.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-${w.color_scheme === 'violet' ? 'primary' : w.color_scheme === 'cyan' ? 'secondary' : w.color_scheme === 'green' ? 'success' : 'warning'}/10 text-${w.color_scheme === 'violet' ? 'primary' : w.color_scheme === 'cyan' ? 'secondary' : w.color_scheme === 'green' ? 'success' : 'warning'}`}>
                        {w.widget_type}
                      </span>
                      {w.last_refreshed && (
                        <span className="text-[9px] text-text-muted flex items-center gap-1 font-medium">
                          <Clock size={9} /> {new Date(w.last_refreshed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleRefreshWidget(w.id)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button 
                      onClick={() => { setEditingWidget(w); setIsModalOpen(true); }}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => deleteWidget(w.id)}
                      className="p-1.5 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Widget Content */}
                <div className="flex-1 p-6">
                  {!widgetData[w.id] ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : widgetData[w.id].error ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <span className="text-xs text-danger font-medium mb-1">Execution Error</span>
                      <span className="text-[10px] text-text-muted font-mono max-h-20 overflow-auto">{widgetData[w.id].error}</span>
                    </div>
                  ) : (
                    <div className="h-full">
                      {w.widget_type === 'metric' ? (
                        <MetricWidget 
                          data={widgetData[w.id]} 
                          title={w.title} 
                          trend={widgetData[w.id].trend} 
                        />
                      ) : w.widget_type === 'table' ? (
                        <MiniTableWidget rows={widgetData[w.id].rows} />
                      ) : (
                        <ChartWidget 
                          data={widgetData[w.id].rows} 
                          chartType={w.chart_type} 
                          xCol={w.x_column} 
                          yCol={w.y_column}
                          colorScheme={w.color_scheme}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="px-6 py-3 border-t border-white/[0.03] bg-black/20 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-text-muted/40 truncate max-w-[70%]">{w.sql_query}</span>
                  {w.auto_refresh > 0 && (
                    <span className="text-[9px] font-bold text-success/60 uppercase tracking-widest flex items-center gap-1">
                      <RefreshCw size={9} className="animate-spin-slow" /> {w.auto_refresh}s
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <WidgetModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSaveWidget}
            initialData={editingWidget}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
