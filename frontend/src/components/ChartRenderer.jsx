import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, Legend
} from 'recharts';
import { Pin, Download, Maximize2, MoreHorizontal, X } from 'lucide-react';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#22d3ee', '#34d399'];

export default function ChartRenderer({ data, onPin, onDismiss, title = "Data Visualization" }) {
  const analysis = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const keys = Object.keys(data[0]);
    const numericKeys = keys.filter(k => {
      const val = data[0][k];
      return typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val));
    });

    const stringKeys = keys.filter(k => !numericKeys.includes(k));
    
    // Choose the best "label" column (usually the one with distinct values)
    const labelKey = stringKeys[0] || keys[0];
    
    // Determine chart type
    let type = 'bar';
    if (data.length <= 10 && numericKeys.length === 1) {
      type = 'pie';
    } else if (numericKeys.length >= 2) {
      type = 'line';
    } else if (data.length > 20) {
      type = 'bar';
    }

    return { numericKeys, stringKeys, labelKey, type, keys };
  }, [data]);

  if (!analysis || analysis.numericKeys.length === 0) return null;

  const { numericKeys, labelKey, type } = analysis;

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={numericKeys[0]}
              nameKey={labelKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#f1f5f9' }}
            />
          </PieChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey={labelKey} 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#64748b' }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#f1f5f9' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            {numericKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS[index % COLORS.length], strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        );
      default: // bar
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey={labelKey} 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#64748b' }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{ backgroundColor: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#f1f5f9' }}
            />
            <Bar 
              dataKey={numericKeys[0]} 
              fill="url(#barGradient)" 
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full bg-card/40 border border-white/[0.05] rounded-2xl overflow-hidden mb-4 group">
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">{title}</h4>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onPin && onPin({ type, numericKeys, labelKey, title })}
            className="p-1.5 hover:bg-white/5 rounded-lg text-text-muted transition-colors"
            title="Pin to Dashboard"
          >
            <Pin size={14} />
          </button>
          <button 
            onClick={onDismiss}
            className="p-1.5 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition-colors"
            title="Dismiss Chart"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="h-[250px] w-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
