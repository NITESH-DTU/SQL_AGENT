import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import RightPanel from './components/RightPanel';
import DBModal from './components/DBModal';
import TableBuilder from './components/TableBuilder';
import FileUpload from './components/FileUpload';
import DataExplorer from './components/DataExplorer';
import SQLConsole from './components/SQLConsole';
import Dashboard from './components/Dashboard';
import QueryHistory from './components/QueryHistory';
import WidgetModal from './components/WidgetModal';
import useDashboard from './hooks/useDashboard';
import { useDatabase } from './hooks/useDatabase';
import { useAgent } from './hooks/useAgent';

function App() {
  const { 
    db, 
    tables, 
    activeTables, 
    connect, 
    toggleTable, 
    refreshTables 
  } = useDatabase();

  const { addWidget } = useDashboard();
  const { messages, sendMessage, isThinking, currentIteration, lastSql, reset } = useAgent();
  
  const handleConnect = async (config) => {
    const success = await connect(config);
    if (success) {
      reset();
    }
    return success;
  };
  
  const [isDBModalOpen, setIsDBModalOpen] = useState(!db);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isTableBuilderOpen, setIsTableBuilderOpen] = useState(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isSQLConsoleOpen, setIsSQLConsoleOpen] = useState(false);
  const [consoleQuery, setConsoleQuery] = useState('');
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinData, setPinData] = useState(null);
  const [browsingTable, setBrowsingTable] = useState(null);

  const handlePin = (data) => {
    setPinData(data);
    setIsPinModalOpen(true);
  };

  const handleReRun = (sql) => {
    setConsoleQuery(sql);
    setIsHistoryOpen(false);
    setIsSQLConsoleOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-text-primary selection:bg-primary/30 font-sans">
      <Toaster 
        toastOptions={{
          style: {
            background: '#13131f',
            color: '#f1f5f9',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '14px',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.01em',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        }}
      />
      
      <Sidebar 
        db={db} 
        tables={tables}
        activeTables={activeTables} 
        toggleTable={toggleTable}
        onOpenConnect={() => setIsDBModalOpen(true)}
        onOpenUpload={() => setIsFileUploadOpen(true)}
        onOpenTableBuilder={() => setIsTableBuilderOpen(true)}
        onOpenSQLConsole={() => {
          setConsoleQuery('');
          setIsSQLConsoleOpen(true);
        }}
        onBrowseTable={(table) => setBrowsingTable(table)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        <Chat 
          activeTables={activeTables} 
          db={db} 
          messages={messages} 
          sendMessage={sendMessage} 
          isThinking={isThinking} 
          currentIteration={currentIteration} 
          onPin={handlePin}
        />
      </main>

      <RightPanel 
        isOpen={isRightPanelOpen} 
        onToggle={() => setIsRightPanelOpen(!isRightPanelOpen)} 
        activeTables={activeTables}
        lastSql={lastSql}
      />

      <AnimatePresence>
        {isDBModalOpen && (
          <DBModal 
            onClose={() => setIsDBModalOpen(false)} 
            onConnect={handleConnect} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTableBuilderOpen && (
          <TableBuilder 
            onClose={() => setIsTableBuilderOpen(false)} 
            onSuccess={refreshTables}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFileUploadOpen && (
          <FileUpload 
            onClose={() => setIsFileUploadOpen(false)} 
            onSuccess={refreshTables}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSQLConsoleOpen && (
          <SQLConsole
            onClose={() => setIsSQLConsoleOpen(false)}
            db={db}
            initialSql={consoleQuery}
            onPin={handlePin}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPinModalOpen && (
          <WidgetModal
            isOpen={isPinModalOpen}
            onClose={() => setIsPinModalOpen(false)}
            onSave={addWidget}
            initialData={pinData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDashboardOpen && (
          <Dashboard 
            isOpen={isDashboardOpen} 
            onClose={() => setIsDashboardOpen(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHistoryOpen && (
          <QueryHistory 
            isOpen={isHistoryOpen} 
            onClose={() => setIsHistoryOpen(false)} 
            onReRun={handleReRun}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {browsingTable && (
          <DataExplorer 
            table={browsingTable} 
            onClose={() => setBrowsingTable(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
