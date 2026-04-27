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
import DataProfiler from './components/DataProfiler';
import GlossaryManager from './components/GlossaryManager';
import ERDVisualizer from './components/ERDVisualizer';
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
  const { messages, sendMessage, removeMessage, removeMessageStep, isThinking, currentIteration, lastSql, reset } = useAgent();
  
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
  const [isDataProfilerOpen, setIsDataProfilerOpen] = useState(false);
  const [isGlossaryManagerOpen, setIsGlossaryManagerOpen] = useState(false);
  const [isERDOpen, setIsERDOpen] = useState(false);
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
        onOpenDataProfiler={() => setIsDataProfilerOpen(true)}
        onOpenGlossary={() => setIsGlossaryManagerOpen(true)}
        onOpenERD={() => setIsERDOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        <Chat 
          activeTables={activeTables} 
          db={db} 
          messages={messages} 
          sendMessage={sendMessage} 
          removeMessageStep={removeMessageStep}
          removeMessage={removeMessage}
          isThinking={isThinking} 
          currentIteration={currentIteration} 
          onPin={handlePin}
          onBrowseTable={(table) => setBrowsingTable(table)}
        />
      </main>

      <RightPanel 
        isOpen={isRightPanelOpen} 
        onToggle={() => setIsRightPanelOpen(!isRightPanelOpen)} 
        activeTables={activeTables}
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
            activeTables={activeTables}
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
            activeTables={activeTables}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDashboardOpen && (
          <Dashboard 
            isOpen={isDashboardOpen} 
            onClose={() => setIsDashboardOpen(false)} 
            activeTables={activeTables}
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
        {isDataProfilerOpen && (
          <DataProfiler 
            isOpen={isDataProfilerOpen} 
            onClose={() => setIsDataProfilerOpen(false)} 
            activeTables={activeTables}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGlossaryManagerOpen && (
          <GlossaryManager 
            isOpen={isGlossaryManagerOpen} 
            onClose={() => setIsGlossaryManagerOpen(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isERDOpen && (
          <ERDVisualizer 
            isOpen={isERDOpen} 
            onClose={() => setIsERDOpen(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {browsingTable && (
          <DataExplorer 
            table={browsingTable} 
            onClose={() => setBrowsingTable(null)} 
            activeTables={activeTables}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
