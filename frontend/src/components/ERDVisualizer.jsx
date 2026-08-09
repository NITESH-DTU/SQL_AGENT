import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MarkerType, 
  applyNodeChanges, 
  applyEdgeChanges, 
  Handle, 
  Position 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { X, Database, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

const TableNode = ({ data }) => {
  return (
    <div className="bg-[#1e1e2d] rounded-xl border border-[#3b3b54] shadow-2xl overflow-hidden min-w-[200px]">
      <div className="bg-[#2d2d44] px-4 py-2 border-b border-[#3b3b54] flex items-center gap-2">
        <Database size={14} className="text-indigo-400" />
        <div className="font-bold text-white text-sm tracking-wide">{data.label}</div>
      </div>
      <div className="p-2 flex flex-col gap-1">
        {data.columns && data.columns.map(col => (
          <div key={col.name} className="relative flex items-center justify-between px-2 py-1 hover:bg-[#3b3b54] rounded group">
            <Handle type="target" position={Position.Left} id={col.name} className="w-2 h-2 !bg-indigo-500 border-none" style={{ left: -12 }} />
            
            <div className="flex items-center gap-2">
              {col.pk ? <Key size={12} className="text-amber-400 shrink-0" /> : <div className="w-3" />}
              <span className="text-xs text-gray-200 font-mono">{col.name}</span>
            </div>
            <span className="text-[10px] text-gray-400 uppercase font-semibold ml-4">{col.type}</span>
            
            <Handle type="source" position={Position.Right} id={col.name} className="w-2 h-2 !bg-indigo-500 border-none" style={{ right: -12 }} />
          </div>
        ))}
      </div>
    </div>
  );
};

const nodeTypes = {
  table: TableNode,
};

export default function ERDVisualizer({ isOpen, onClose }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  useEffect(() => {
    if (isOpen) fetchERD();
  }, [isOpen]);

  const fetchERD = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/erd`);
      const backendNodes = res.data.nodes || [];
      const backendEdges = res.data.edges || [];

      const cols = Math.ceil(Math.sqrt(backendNodes.length));
      
      const rfNodes = backendNodes.map((n, i) => ({
        id: n.id,
        type: 'table',
        position: { x: (i % cols) * 350 + 50, y: Math.floor(i / cols) * 250 + 50 },
        data: { label: n.id, columns: n.columns }
      }));

      const rfEdges = backendEdges.map((e, i) => ({
        id: `e-${e.source}-${e.target}-${i}`,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#818cf8', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch (e) {
      toast.error('Failed to load ERD');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="relative w-full h-full max-w-7xl glass rounded-3xl overflow-hidden flex flex-col bg-[#0a0a0f] border border-white/10"
      >
        <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between bg-black/40 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Entity Relationship Diagram</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Database Map</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 w-full h-full bg-[#0a0a0f]">
          {loading ? (
            <div className="h-full flex items-center justify-center text-indigo-400">Loading Schema...</div>
          ) : nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">No tables found</div>
          ) : (
            <ReactFlow 
              nodes={nodes} 
              edges={edges} 
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              className="dark"
            >
              <Background color="#ffffff" gap={20} size={1} opacity={0.05} />
              <Controls className="!bg-[#1e1e2d] !border-[#3b3b54] !fill-white" />
            </ReactFlow>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
