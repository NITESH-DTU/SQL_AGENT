import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Database, Terminal, Settings, Loader2, Send, CheckCircle2, LayoutTemplate, MessageSquare } from 'lucide-react';
import SchemaBuilder from './SchemaBuilder';

const API_URL = 'http://127.0.0.1:8000/api';

function App() {
  const [dbType, setDbType] = useState('sqlite');
  const [filePath, setFilePath] = useState('');
  const [postgresConfig, setPostgresConfig] = useState({
    host: 'localhost', port: '5432', dbname: '', user: '', password: ''
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [tables, setTables] = useState([]);
  const [activeTables, setActiveTables] = useState([]);
  const [chatReady, setChatReady] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'schema'
  const scrollRef = useRef(null);

  useEffect(() => {
    if(scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = dbType === 'sqlite' 
        ? { db_type: 'sqlite', filepath: filePath }
        : { db_type: 'postgresql', ...postgresConfig };
        
      const res = await axios.post(`${API_URL}/connect`, payload);
      setTables(res.data.tables);
      setIsConnected(true);
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
    setLoading(false);
  };

  const submitActiveTables = async () => {
    if (activeTables.length === 0) return alert('Select at least one table');
    try {
      await axios.post(`${API_URL}/tables/active`, { tables: activeTables });
      setChatReady(true);
      setMessages([{role: 'agent', isFinal: true, content: 'Hello! I am your autonomous Database AI Agent. How can I assist you today?'}]);
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
  };

  const toggleTable = (t) => {
    setActiveTables(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleTableCreated = async (newTableName) => {
    const newActiveTables = [...activeTables, newTableName];
    setTables(prev => [...prev, newTableName]);
    setActiveTables(newActiveTables);
    setCurrentView('chat');
    
    try {
      await axios.post(`${API_URL}/tables/active`, { tables: newActiveTables });
    } catch (err) {
      console.error("Failed to sync active tables", err);
    }

    if (messages.length === 0) {
      setMessages([{role: 'agent', isFinal: true, content: 'Hello! I am your autonomous Database AI Agent. How can I assist you today?'}]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/chat`, { query: userMessage.content });
      setMessages(prev => [...prev, { role: 'agent', isFinal: false, steps: res.data.steps }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'agent', isFinal: true, content: 'Error communicating with Agent: ' + (err.response?.data?.detail || err.message) }]);
    }
    setLoading(false);
  };

  if (!isConnected) {
    return (
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <Database size={32} color="#8b5cf6" />
          <div>
            <h1>SQL Agent</h1>
            <p style={{marginBottom: 0, marginTop: '-5px'}}>Database Connection Protocol</p>
          </div>
        </div>

        <form onSubmit={handleConnect}>
          <div className="form-group">
            <label>Database Engine</label>
            <select className="select" value={dbType} onChange={(e) => setDbType(e.target.value)}>
              <option value="sqlite">SQLite (.db file)</option>
              <option value="postgresql">PostgreSQL Server</option>
            </select>
          </div>

          {dbType === 'sqlite' ? (
            <div className="form-group">
              <label>Database Filepath (relative or absolute)</label>
              <input 
                required 
                className="input" 
                placeholder="e.g., example.db" 
                value={filePath} 
                onChange={(e) => setFilePath(e.target.value)} 
              />
            </div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <div className="form-group">
                <label>Host</label>
                <input required className="input" value={postgresConfig.host} onChange={(e) => setPostgresConfig({...postgresConfig, host: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Port</label>
                <input required className="input" value={postgresConfig.port} onChange={(e) => setPostgresConfig({...postgresConfig, port: e.target.value})} />
              </div>
              <div className="form-group" style={{gridColumn: '1 / -1'}}>
                <label>Database Name</label>
                <input required className="input" value={postgresConfig.dbname} onChange={(e) => setPostgresConfig({...postgresConfig, dbname: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input className="input" value={postgresConfig.user} onChange={(e) => setPostgresConfig({...postgresConfig, user: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="input" value={postgresConfig.password} onChange={(e) => setPostgresConfig({...postgresConfig, password: e.target.value})} />
              </div>
            </div>
          )}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? <Loader2 className="animate-pulse" /> : <Settings />} Connect Database
          </button>
        </form>
      </div>
    );
  }

  const skipToSchemaBuilder = () => {
    setChatReady(true);
    setCurrentView('schema');
  };

  if (!chatReady) {
    return (
      <div className="glass-panel">
        <h2>Authorize Tables</h2>
        <p>Select which tables the AI agent is allowed to read, analyze, and write to. Any queries targeting unselected tables will be blocked by internal guardrails.</p>
        
        <div className="table-list" style={{maxHeight:'300px', overflowY:'auto', paddingRight:'10px', marginBottom: '2rem'}}>
          {tables.length === 0 && <p>No tables found in this database.</p>}
          {tables.map(t => (
            <div key={t} className={`table-item ${activeTables.includes(t) ? 'active' : ''}`} onClick={() => toggleTable(t)}>
              {activeTables.includes(t) ? <CheckCircle2 size={18} color="#10b981" /> : <div style={{width:'18px', height:'18px', borderRadius:'50%', border:'1px solid var(--glass-border)'}}></div>}
              {t}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={submitActiveTables} disabled={activeTables.length===0}>
            Initialize Sub-Agent
          </button>
          {tables.length === 0 && (
            <button className="btn secondary" onClick={skipToSchemaBuilder}>
              <LayoutTemplate size={18} /> Create New Table
            </button>
          )}
        </div>
      </div>
    );
  }

  // Helper to neatly render markdown/tables quickly without deep dependencies
  // In production, you'd use react-markdown
  const renderSimpleMarkdown = (content) => {
    // For simplicity just render as pre to maintain JSON spacing if any
    return <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'inherit'}}>{content}</pre>;
  };

  return (
    <div className="glass-panel app-layout">
      <div className="sidebar">
        <div className="sidebar-section">
          <h2>SQL Agent</h2>
          <p style={{fontSize: '0.85rem', marginBottom: '0.5rem'}}>Database: {dbType}</p>
          <button className="btn secondary" style={{padding: '0.5rem', fontSize: '0.85rem'}} onClick={() => window.location.reload()}>
            Disconnect
          </button>
        </div>
        
        <div className="sidebar-section">
          <h3 style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Authorized Area</h3>
          <div className="table-list" style={{marginBottom: '1rem'}}>
            {activeTables.map(t => (
              <div key={t} className="table-item active">
                <CheckCircle2 size={16} /> {t}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section" style={{marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            <button 
              className={`btn ${currentView === 'chat' ? 'primary' : 'secondary'}`} 
              style={{justifyContent: 'flex-start', padding: '0.5rem 1rem'}}
              onClick={() => setCurrentView('chat')}
            >
              <MessageSquare size={18} /> Chat Assistant
            </button>
            <button 
              className={`btn ${currentView === 'schema' ? 'primary' : 'secondary'}`} 
              style={{justifyContent: 'flex-start', padding: '0.5rem 1rem'}}
              onClick={() => setCurrentView('schema')}
            >
              <LayoutTemplate size={18} /> Schema Builder
            </button>
          </div>
        </div>
      </div>
      
      <div className="chat-container">
        {currentView === 'schema' ? (
          <div style={{padding: '2rem', height: '100%', overflowY: 'auto'}}>
            <SchemaBuilder onTableCreated={handleTableCreated} />
          </div>
        ) : (
          <>
            <div className="chat-messages" ref={scrollRef}>
              {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              {m.isFinal || m.role === 'user' ? (
                <div className="message-bubble">
                  {m.content}
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  {m.steps?.map((step, idx) => (
                    <div key={idx}>
                      {step.type === 'thinking' && <div className="step-log thinking"><Loader2 size={14} className="animate-pulse"/> {step.content}</div>}
                      {step.type === 'tool_call' && <div className="step-log tool_call"><Terminal size={14}/> Invoking `{step.tool_name}`: {JSON.stringify(step.args)}</div>}
                      {step.type === 'tool_result' && <div className="step-log tool_result"><CheckCircle2 size={14}/> Returned {step.result.length} characters</div>}
                      {step.type === 'agent' && <div className="message-bubble" style={{marginTop: '0.5rem'}}>{renderSimpleMarkdown(step.content)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="message agent"><div className="step-log thinking"><Loader2 size={14} className="animate-pulse"/> Synthesizing action...</div></div>}
        </div>
        
        <div className="chat-input-wrapper">
          <form className="chat-form" onSubmit={sendMessage}>
            <input 
              type="text" 
              className="chat-input" 
              placeholder="Instruct the agent (e.g. 'Generate a report on users table')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="chat-submit" disabled={!query.trim() || loading}>
              <Send size={20} style={{marginLeft: '-2px'}}/>
            </button>
          </form>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
