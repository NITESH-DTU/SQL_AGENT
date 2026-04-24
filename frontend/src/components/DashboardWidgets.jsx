import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { RefreshCw, Trash2, Edit3, Maximize2, MoreHorizontal, ArrowUpRight, ArrowDownRight, Hash, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = {
  violet: ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  cyan: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'],
  green: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  amber: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7']
};

export function MetricWidget({ data, title, trend }) {
  const value = data?.value ?? '0';
  const displayTrend = data?.trend || trend || 'neutral';

  return (
    <div className="flex flex-col items-center justify-center h-full py-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl font-black text-text-primary tracking-tighter">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {displayTrend !== 'neutral' && (
          <div className={`p-1 rounded-lg ${displayTrend === 'up' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {displayTrend === 'up' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
          </div>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mt-2">{title}</span>
    </div>
  );
}

export function MiniTableWidget({ rows, columns }) {
  if (!rows || rows.length === 0) return <div className="h-full flex items-center justify-center text-text-muted text-xs">No data</div>;
  
  const displayCols = columns || Object.keys(rows[0]).slice(0, 4);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto scroll-thin">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-surface/90 backdrop-blur z-10">
            <tr>
              {displayCols.map(col => (
                <th key={col} className="px-3 py-2 font-bold text-text-muted/50 uppercase tracking-wider border-b border-white/[0.03]">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {rows.slice(0, 20).map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.01]">
                {displayCols.map(col => (
                  <td key={col} className="px-3 py-2 text-text-muted font-medium truncate max-w-[120px]">{String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 border-t border-white/[0.03] flex justify-end">
        <span className="text-[9px] font-bold text-text-muted/30 uppercase tracking-widest">{rows.length} rows</span>
      </div>
    </div>
  );
}

export function ChartWidget({ data, chartType, xCol, yCol, colorScheme = 'violet' }) {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-text-muted text-xs">No data</div>;
  
  const palette = COLORS[colorScheme] || COLORS.violet;
  const keys = Object.keys(data[0]);
  
  // Find a numeric column for Y if not specified
  let y = yCol;
  if (!y || !keys.includes(y)) {
    y = keys.find(k => {
      const val = data[0][k];
      return typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val));
    });
  }
  
  // Find a string column for X if not specified
  let x = xCol;
  if (!x || !keys.includes(x)) {
    x = keys.find(k => k !== y) || keys[0];
  }

  // Fallback to first two columns if still nothing found
  if (!x) x = keys[0];
  if (!y) y = keys[1] || keys[0];

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return (
          <PieChart>
            <Pie data={data} dataKey={y} nameKey={x} cx="50%" cy="50%" outerRadius="80%" fill={palette[0]}>
              {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#0d0d14', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
          </PieChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey={x} stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#0d0d14', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
            <Line type="monotone" dataKey={y} stroke={palette[0]} strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${colorScheme}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={palette[0]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={palette[0]} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey={x} stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#0d0d14', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
            <Area type="monotone" dataKey={y} stroke={palette[0]} fillOpacity={1} fill={`url(#gradient-${colorScheme})`} />
          </AreaChart>
        );
      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis type="number" dataKey={x} name={x} stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis type="number" dataKey={y} name={y} stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
            <ZAxis type="category" dataKey={Object.keys(data[0]).find(k => k !== x && k !== y) || x} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#0d0d14', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
            <Scatter name="Data" data={data} fill={palette[0]} />
          </ScatterChart>
        );
      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey={x} stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: '#0d0d14', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
            <Bar dataKey={y} fill={palette[0]} radius={[2, 2, 0, 0]} barSize={20} />
          </BarChart>
        );
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
}
