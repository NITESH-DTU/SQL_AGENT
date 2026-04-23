import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export default function useQueryHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = useCallback(async (pageNum = 1, bookmarked = false) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/query-history`, {
        params: { page: pageNum, limit: 20, bookmarked }
      });
      if (pageNum === 1) {
        setHistory(res.data.history);
      } else {
        setHistory(prev => [...prev, ...res.data.history]);
      }
      setHasMore(res.data.history.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleBookmark = async (id) => {
    try {
      await axios.patch(`${API_BASE}/query-history/${id}/bookmark`);
      setHistory(prev => prev.map(item => 
        item.id === id ? { ...item, bookmarked: 1 - item.bookmarked } : item
      ));
    } catch (err) {
      toast.error('Failed to update bookmark');
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      await axios.delete(`${API_BASE}/query-history/${id}`);
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Deleted from history');
    } catch (err) {
      toast.error('Failed to delete history item');
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all history?')) return;
    try {
      await axios.delete(`${API_BASE}/query-history`);
      setHistory([]);
      toast.success('History cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  return {
    history,
    isLoading,
    page,
    hasMore,
    fetchHistory,
    toggleBookmark,
    deleteHistoryItem,
    clearHistory
  };
}
