import { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Database, AlertCircle, Check } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

export default function SchemaBuilder({ onTableCreated }) {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState([
    { id: Date.now(), name: 'id', type: 'INTEGER', is_primary: true, allow_null: false, is_unique: true, default_val: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addColumn = () => {
    setColumns([...columns, { 
      id: Date.now(), name: '', type: 'TEXT', is_primary: false, allow_null: true, is_unique: false, default_val: '' 
    }]);
  };

  const removeColumn = (id) => {
    setColumns(columns.filter(col => col.id !== id));
  };

  const updateColumn = (id, field, value) => {
    setColumns(columns.map(col => col.id === id ? { ...col, [field]: value } : col));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!tableName.trim()) {
      return setError('Table name is required');
    }

    if (columns.some(c => !c.name.trim())) {
      return setError('All columns must have a name');
    }

    setLoading(true);
    try {
      const payload = {
        table_name: tableName.trim(),
        columns: columns.map(c => ({
          name: c.name.trim(),
          type: c.type,
          is_primary: c.is_primary,
          allow_null: c.allow_null,
          is_unique: c.is_unique,
          default_val: c.default_val.trim()
        }))
      };

      await axios.post(`${API_URL}/tables/create`, payload);
      setSuccess(`Table '${tableName}' created successfully!`);
      setTableName('');
      setColumns([{ id: Date.now(), name: 'id', type: 'INTEGER', is_primary: true, allow_null: false, is_unique: true, default_val: '' }]);
      if (onTableCreated) onTableCreated(tableName);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
    setLoading(false);
  };

  return (
    <div className="schema-builder glass-panel">
      <div className="schema-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Database className="schema-icon" size={28} color="#8b5cf6" />
          <div>
            <h2 style={{marginBottom: 0, marginTop: '-2px'}}>Schema Builder</h2>
            <p style={{marginBottom: 0, marginTop: '-5px', fontSize: '0.85rem', color: 'var(--text-muted)'}}>Design and deploy new database tables visually.</p>
          </div>
        </div>
      </div>

      {error && <div className="alert error" style={{display: 'flex', gap: '0.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem'}}><AlertCircle size={18}/> {error}</div>}
      {success && <div className="alert success" style={{display: 'flex', gap: '0.5rem', padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', marginBottom: '1rem'}}><Check size={18}/> {success}</div>}

      <form onSubmit={handleSubmit} className="schema-form">
        <div className="form-group" style={{marginBottom: '1.5rem'}}>
          <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>Table Name</label>
          <input 
            required 
            className="input" 
            placeholder="e.g. users" 
            value={tableName} 
            onChange={e => setTableName(e.target.value)}
          />
        </div>

        <div className="columns-container" style={{marginBottom: '2rem'}}>
          <div className="columns-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3 style={{fontSize: '1rem'}}>Columns</h3>
            <button type="button" className="btn secondary" style={{padding: '0.4rem 0.75rem', fontSize: '0.85rem'}} onClick={addColumn}>
              <Plus size={16} style={{marginRight: '4px', verticalAlign: 'middle'}}/> Add Column
            </button>
          </div>

          <div className="columns-list" style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            {columns.map((col, index) => (
              <div key={col.id} className="column-row" style={{display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                <div className="col-input-group name-group" style={{flex: 2}}>
                  <label style={{display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)'}}>Name</label>
                  <input required className="input" style={{padding: '0.4rem', fontSize: '0.85rem'}} value={col.name} onChange={e => updateColumn(col.id, 'name', e.target.value)} placeholder="column_name" />
                </div>
                
                <div className="col-input-group type-group" style={{flex: 1.5}}>
                  <label style={{display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)'}}>Type</label>
                  <select className="select" style={{padding: '0.4rem', fontSize: '0.85rem'}} value={col.type} onChange={e => updateColumn(col.id, 'type', e.target.value)}>
                    <option value="TEXT">TEXT</option>
                    <option value="INTEGER">INTEGER</option>
                    <option value="FLOAT">FLOAT</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                    <option value="UUID">UUID</option>
                  </select>
                </div>

                <div className="col-input-group checkbox-group" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 0.5}}>
                  <label style={{fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)'}}>PK</label>
                  <input type="checkbox" checked={col.is_primary} onChange={e => updateColumn(col.id, 'is_primary', e.target.checked)} />
                </div>

                <div className="col-input-group checkbox-group" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 0.5}}>
                  <label style={{fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)'}}>NULL</label>
                  <input type="checkbox" checked={col.allow_null} onChange={e => updateColumn(col.id, 'allow_null', e.target.checked)} disabled={col.is_primary} />
                </div>

                <div className="col-input-group checkbox-group" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 0.5}}>
                  <label style={{fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)'}}>Unique</label>
                  <input type="checkbox" checked={col.is_unique} onChange={e => updateColumn(col.id, 'is_unique', e.target.checked)} disabled={col.is_primary} />
                </div>

                <div className="col-input-group default-group" style={{flex: 1.5}}>
                  <label style={{display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)'}}>Default</label>
                  <input className="input" style={{padding: '0.4rem', fontSize: '0.85rem'}} value={col.default_val} onChange={e => updateColumn(col.id, 'default_val', e.target.value)} placeholder="Default" />
                </div>

                <div style={{width: '32px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100%'}}>
                  {index > 0 ? (
                    <button type="button" style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px'}} onClick={() => removeColumn(col.id)}>
                      <Trash2 size={18} />
                    </button>
                  ) : <div style={{width: '26px'}}></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn" style={{width: '100%', justifyContent: 'center'}} disabled={loading}>
          {loading ? 'Deploying...' : 'Deploy Table Structure'}
        </button>
      </form>
    </div>
  );
}
