import { useState } from 'react';

const API_BASE = 'http://localhost:8000/api';

export function useAgent() {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [lastSql, setLastSql] = useState('');

  const sendMessage = async (message, activeTables) => {
    if (!message.trim()) return;

    const userMsgId = Date.now();
    const agentMsgId = userMsgId + 1;

    // Add user message
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: message }]);
    setIsThinking(true);
    setCurrentIteration(0);

    // Initial agent message
    let currentAgentMsg = { id: agentMsgId, role: 'agent', content: '', steps: [] };
    setMessages(prev => [...prev, currentAgentMsg]);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, active_tables: activeTables }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              
              if (event.type === 'status') {
                setCurrentIteration(event.iteration);
              } else if (event.type === 'tool_call') {
                if (event.args?.query || event.args?.sql) {
                  setLastSql(event.args.query || event.args.sql);
                }
                currentAgentMsg = {
                  ...currentAgentMsg,
                  steps: [...currentAgentMsg.steps, { type: 'call', tool: event.tool, args: event.args, id: Math.random() }]
                };
                setMessages(prev => prev.map(m => m.id === agentMsgId ? currentAgentMsg : m));
              } else if (event.type === 'tool_result') {
                currentAgentMsg = {
                  ...currentAgentMsg,
                  steps: currentAgentMsg.steps.map(s => s.tool === event.tool && !s.result ? { ...s, result: event.result } : s)
                };
                setMessages(prev => prev.map(m => m.id === agentMsgId ? currentAgentMsg : m));
              } else if (event.type === 'final_answer') {
                currentAgentMsg = {
                  ...currentAgentMsg,
                  content: currentAgentMsg.content + event.message
                };
                setMessages(prev => prev.map(m => m.id === agentMsgId ? currentAgentMsg : m));
              } else if (event.type === 'error') {
                currentAgentMsg = {
                  ...currentAgentMsg,
                  content: currentAgentMsg.content + `\n\n**Error:** ${event.message}`
                };
                setMessages(prev => prev.map(m => m.id === agentMsgId ? currentAgentMsg : m));
              }
            } catch (e) {
              console.error("Error parsing SSE event", e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error', err);
      toast.error("Failed to connect to agent");
    } finally {
      setIsThinking(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setLastSql('');
    setCurrentIteration(0);
  };

  return { messages, sendMessage, isThinking, currentIteration, setMessages, lastSql, reset };
}
