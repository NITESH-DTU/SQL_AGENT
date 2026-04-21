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
  const [browsingTable, setBrowsingTable] = useState(null);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-text-primary selection:bg-primary/30">
      <Toaster 
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#f8fafc',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backdropFilter: 'blur(10px)'
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
        onBrowseTable={(table) => setBrowsingTable(table)}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        <Chat 
          activeTables={activeTables} 
          db={db} 
          messages={messages} 
          sendMessage={sendMessage} 
          isThinking={isThinking} 
          currentIteration={currentIteration} 
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
