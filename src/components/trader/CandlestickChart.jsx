import React, { useMemo, useRef, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

// Renderizador SVG de velas japonesas
function CandleStickRenderer({ data, margin = { top: 20, right: 30, left: 60, bottom: 20 } }) {
  if (!data || data.length === 0) return null;

  const containerRef = React.useRef(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 400 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: Math.max(rect.width, 400), height: 400 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const minPrice = Math.min(...data.map(d => d.low || d.close));
  const maxPrice = Math.max(...data.map(d => d.high || d.close));
  const priceRange = maxPrice - minPrice || 1;

  const candleWidth = Math.max(innerWidth / data.length * 0.8, 2);
  const spacing = innerWidth / data.length;

  const yScale = (price) => {
    return innerHeight - ((price - minPrice) / priceRange) * innerHeight;
  };

  const xScale = (index) => {
    return margin.left + index * spacing + spacing / 2;
  };

  return (
    <svg ref={containerRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="w-full" style={{ maxHeight: '500px' }}>
      {/* Grid */}
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--border)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} fill="url(#grid)" />

      {/* Ejes */}
      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="var(--border)" strokeWidth="1" />
      <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="var(--border)" strokeWidth="1" />

      {/* Labels eje Y */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const price = minPrice + priceRange * pct;
        const y = yScale(price);
        return (
          <g key={i}>
            <line x1={margin.left - 5} y1={y} x2={margin.left} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={margin.left - 10} y={y} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="var(--muted-foreground)">
              ${price.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* Velas japonesas */}
      {data.map((candle, index) => {
        if (!candle.open || !candle.close || !candle.high || !candle.low) return null;

        const x = xScale(index);
        const yOpen = yScale(candle.open);
        const yClose = yScale(candle.close);
        const yHigh = yScale(candle.high);
        const yLow = yScale(candle.low);

        const isUp = candle.close >= candle.open;
        const bodyColor = isUp ? '#10b981' : '#ef4444';
        const wickColor = isUp ? '#10b981' : '#ef4444';

        const bodyTop = Math.min(yOpen, yClose);
        const bodyBottom = Math.max(yOpen, yClose);
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

        return (
          <g key={index}>
            {/* Wick (mecha) */}
            <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={wickColor} strokeWidth="1" opacity="0.8" />
            {/* Body (cuerpo) */}
            <rect
              x={x - candleWidth / 2}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={bodyColor}
              stroke={bodyColor}
              opacity="0.85"
            />
          </g>
        );
      })}

      {/* Labels eje X */}
      {data.map((candle, index) => {
        if (index % Math.max(Math.floor(data.length / 6), 1) !== 0) return null;
        const x = xScale(index);
        return (
          <text
            key={`label-${index}`}
            x={x}
            y={height - margin.bottom + 15}
            textAnchor="middle"
            fontSize="11"
            fill="var(--muted-foreground)"
          >
            {candle.date}
          </text>
        );
      })}
    </svg>
  );
}

// Tooltip personalizado
function CandleTooltip({ active, payload }) {
  if (!active || !payload || !payload[0]) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm z-50">
      <p className="text-muted-foreground text-xs mb-2 font-semibold">{data.date}</p>
      <div className="space-y-1 text-xs">
        <p><span className="text-muted-foreground">Apertura:</span> <span className="font-semibold">${data.open?.toFixed(2)}</span></p>
        <p><span className="text-muted-foreground">Máximo:</span> <span className="font-semibold">${data.high?.toFixed(2)}</span></p>
        <p><span className="text-muted-foreground">Mínimo:</span> <span className="font-semibold">${data.low?.toFixed(2)}</span></p>
        <p className={cn(
          'font-semibold',
          data.close >= data.open ? 'text-emerald-500' : 'text-red-500'
        )}>
          Cierre: ${data.close?.toFixed(2)}
        </p>
        {data.volume && (
          <p className="text-muted-foreground">Vol: {(data.volume / 1000000).toFixed(2)}M</p>
        )}
      </div>
    </div>
  );
}

export default function CandlestickChart({ data = [], title = '', symbol = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 h-96 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4 w-full">
      <div>
        <h3 className="font-semibold text-lg">{title || symbol}</h3>
        <p className="text-xs text-muted-foreground">Velas diarias en tiempo real</p>
      </div>

      {/* SVG Candlestick - Responsive */}
      <div className="w-full overflow-x-auto" style={{ minHeight: '450px' }}>
        <CandleStickRenderer data={data} />
      </div>

      {/* Info adicional */}
      {data.length > 0 && (
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="bg-secondary/50 rounded p-2">
            <p className="text-muted-foreground">Apertura</p>
            <p className="font-semibold">${data[0]?.open?.toFixed(2)}</p>
          </div>
          <div className="bg-secondary/50 rounded p-2">
            <p className="text-muted-foreground">Cierre</p>
            <p className={cn('font-semibold', data[data.length - 1]?.close >= data[0]?.open ? 'text-emerald-500' : 'text-red-500')}>
              ${data[data.length - 1]?.close?.toFixed(2)}
            </p>
          </div>
          <div className="bg-secondary/50 rounded p-2">
            <p className="text-muted-foreground">Máximo</p>
            <p className="font-semibold">${Math.max(...data.map(d => d.high || 0))?.toFixed(2)}</p>
          </div>
          <div className="bg-secondary/50 rounded p-2">
            <p className="text-muted-foreground">Mínimo</p>
            <p className="font-semibold">${Math.min(...data.map(d => d.low || 0))?.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}