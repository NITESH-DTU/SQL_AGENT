import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export function useDatabase() {
  const [db, setDb] = useState(null);
  const [tables, setTables] = useState([]);
  const [activeTables, setActiveTables] = useState([]);
  const [schema, setSchema] = useState({});

  const refreshTables = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tables`);
      setTables(res.data.tables);
    } catch (err) {
      console.error('Failed to fetch tables', err);
    }
  };

  const connect = async (config) => {
    try {
      const res = await axios.post(`${API_BASE}/connect`, config);
      setDb({ name: res.data.db_name, type: res.data.db_type });
      setTables(res.data.tables);
      setActiveTables(res.data.tables); // Auto-activate all initially or however you prefer
      toast.success(`Connected to ${res.data.db_name}`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Connection failed');
      return false;
    }
  };

  const toggleTable = (tableName) => {
    setActiveTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName) 
        : [...prev, tableName]
    );
  };

  const getSchema = async (tableName) => {
    if (schema[tableName]) return schema[tableName];
    try {
      const res = await axios.get(`${API_BASE}/schema/${tableName}`);
      setSchema(prev => ({ ...prev, [tableName]: res.data.schema }));
      return res.data.schema;
    } catch (err) {
      console.error(`Failed to fetch schema for ${tableName}`, err);
    }
  };

  return {
    db,
    tables,
    activeTables,
    setActiveTables,
    connect,
    toggleTable,
    refreshTables,
    getSchema,
    schema
  };
}
