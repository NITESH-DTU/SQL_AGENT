import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function useDashboard() {
  const [widgets, setWidgets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWidgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/dashboard/widgets`);
      setWidgets(res.data.widgets);
    } catch (err) {
      console.error('Failed to fetch widgets:', err);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addWidget = async (widgetData) => {
    try {
      const id = widgetData.id || crypto.randomUUID();
      await axios.post(`${API_BASE}/dashboard/widgets`, { ...widgetData, id });
      toast.success('Widget added to dashboard');
      fetchWidgets();
      return id;
    } catch (err) {
      toast.error('Failed to add widget');
      throw err;
    }
  };

  const updateWidget = async (widgetId, updates) => {
    try {
      await axios.patch(`${API_BASE}/dashboard/widgets/${widgetId}`, updates);
      setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, ...updates } : w));
    } catch (err) {
      toast.error('Failed to update widget');
    }
  };

  const deleteWidget = async (widgetId) => {
    try {
      await axios.delete(`${API_BASE}/dashboard/widgets/${widgetId}`);
      setWidgets(prev => prev.filter(w => w.id !== widgetId));
      toast.success('Widget removed');
    } catch (err) {
      toast.error('Failed to remove widget');
    }
  };

  const refreshWidget = async (widgetId, activeTables = []) => {
    try {
      const res = await axios.post(`${API_BASE}/dashboard/widgets/${widgetId}/refresh`, {
        active_tables: activeTables
      });
      if (res.data.error) {
        return { error: res.data.error };
      }
      return res.data;
    } catch (err) {
      return { error: 'Failed to refresh widget' };
    }
  };

  const reorderWidgets = async (ids) => {
    try {
      await axios.post(`${API_BASE}/dashboard/reorder`, { ids });
      // Optimized: local reorder first, then fetch or trust
    } catch (err) {
      toast.error('Failed to save order');
    }
  };

  return {
    widgets,
    isLoading,
    fetchWidgets,
    addWidget,
    updateWidget,
    deleteWidget,
    refreshWidget,
    reorderWidgets
  };
}
