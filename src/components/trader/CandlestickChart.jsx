import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';

// Componente para velas japonesas
function Candlestick({ x, y, width, height, payload }) {
  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) return null;

  const xMid = x + width / 2;
  const yMin = y;
  const yMax = y + height;
  const scale = height / (payload.maxPrice - payload.minPrice || 1);

  const open = payload.open;
  const close = payload.close;
  const high = payload.high;
  const low = payload.low;

  const yHigh = yMax - (high - payload.minPrice) * scale;
  const yLow = yMax - (low - payload.minPrice) * scale;
  const yOpen = yMax - (open - payload.minPrice) * scale;
  const yClose = yMax - (close - payload.minPrice) * scale;

  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#ef4444';
  const wickColor = isUp ? '#10b981' : '#ef4444';

  const yTop = Math.min(yOpen, yClose);
  const yBottom = Math.max(yOpen, yClose);
  const bodyWidth = Math.max(width * 0.6, 2);

  return (
    <g>
      {/* Wick (mecha) */}
      <line x1={xMid} y1={yHigh} x2={xMid} y2={yLow} stroke={wickColor} strokeWidth={1} />
      {/* Body (cuerpo) */}
      <rect
        x={xMid - bodyWidth / 2}
        y={yTop}
        width={bodyWidth}
        height={Math.max(yBottom - yTop, 1)}
        fill={color}
        stroke={color}
      />
    </g>
  );
}

// Componente personalizado de Tooltip
function CandleTooltip({ active, payload }) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="text-muted-foreground text-xs mb-1">{data.date}</p>
      <p className="text-foreground">
        <span className="font-semibold">O:</span> ${data.open?.toFixed(2)}
      </p>
      <p className="text-foreground">
        <span className="font-semibold">H:</span> ${data.high?.toFixed(2)}
      </p>
      <p className="text-foreground">
        <span className="font-semibold">L:</span> ${data.low?.toFixed(2)}
      </p>
      <p className={cn(
        'font-semibold',
        data.close >= data.open ? 'text-emerald-500' : 'text-red-500'
      )}>
        <span>C:</span> ${data.close?.toFixed(2)}
      </p>
    </div>
  );
}

export default function CandlestickChart({ data = [], title = '', symbol = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 h-96 flex items-center justify-center">
        <p className="text-muted-foreground">Sin datos disponibles</p>
      </div>
    );
  }

  const minPrice = Math.min(...data.map(d => d.low || d.close));
  const maxPrice = Math.max(...data.map(d => d.high || d.close));

  const chartData = data.map(d => ({
    ...d,
    minPrice,
    maxPrice,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-base">{title || symbol}</h3>
        <p className="text-xs text-muted-foreground">Datos en tiempo real</p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            fontSize={12}
            stroke="var(--muted-foreground)"
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            fontSize={12}
            stroke="var(--muted-foreground)"
            domain={[minPrice - 1, maxPrice + 1]}
            width={50}
          />
          <Tooltip content={<CandleTooltip />} />
          
          {/* Renderizar velas como barras personalizadas */}
          <Bar
            dataKey="close"
            shape={<Candlestick />}
            isAnimationActive={false}
          />
          
          {/* Volumen en la parte inferior */}
          {data[0]?.volume && (
            <Bar dataKey="volume" fill="rgba(100, 150, 200, 0.1)" yAxisId="right" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}