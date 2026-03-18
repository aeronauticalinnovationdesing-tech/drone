import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

// Cálculo de SMA (Simple Moving Average)
function calculateSMA(data, period = 20) {
  return data.map((item, index) => {
    if (index < period - 1) return { ...item, sma: null };
    const sum = data.slice(index - period + 1, index + 1).reduce((acc, d) => acc + d.close, 0);
    return { ...item, sma: sum / period };
  });
}

// Cálculo de RSI (Relative Strength Index)
function calculateRSI(data, period = 14) {
  const rsiData = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsiData.push({ ...data[i], rsi: null });
      continue;
    }

    const changes = [];
    for (let j = i - period + 1; j <= i; j++) {
      changes.push(data[j].close - data[j - 1].close);
    }

    const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
    const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;

    const rs = losses === 0 ? 100 : gains / losses;
    const rsi = 100 - (100 / (1 + rs));

    rsiData.push({ ...data[i], rsi });
  }

  return rsiData;
}

// Cálculo de MACD (Moving Average Convergence Divergence)
function calculateMACD(data) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);

  return data.map((item, index) => ({
    ...item,
    macd: ema12[index]?.ema - ema26[index]?.ema,
    signal: null, // Signal line sería otra EMA del MACD
  }));
}

// Cálculo de EMA (Exponential Moving Average)
function calculateEMA(data, period) {
  const multiplier = 2 / (period + 1);
  const emaData = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      emaData.push({ ...data[i], ema: null });
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((a, d) => a + d.close, 0);
      emaData.push({ ...data[i], ema: sum / period });
    } else {
      const prevEMA = emaData[i - 1].ema;
      const ema = data[i].close * multiplier + prevEMA * (1 - multiplier);
      emaData.push({ ...data[i], ema });
    }
  }

  return emaData;
}

// Componente de Análisis Técnico
export default function TechnicalAnalysis({ candleData = [] }) {
  const [analysisType, setAnalysisType] = useState('rsi');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  if (!candleData || candleData.length === 0) return null;

  // Calcular indicadores
  const rsiData = calculateRSI(candleData);
  const smaData = calculateSMA(candleData, 20);
  const macdData = calculateMACD(candleData);

  const getAnalysisData = () => {
    switch (analysisType) {
      case 'rsi':
        return { data: rsiData, key: 'rsi', min: 0, max: 100 };
      case 'sma':
        return { data: smaData, key: 'sma', min: 'auto', max: 'auto' };
      case 'macd':
        return { data: macdData, key: 'macd', min: 'auto', max: 'auto' };
      default:
        return { data: rsiData, key: 'rsi', min: 0, max: 100 };
    }
  };

  const analysis = getAnalysisData();
  const filteredData = analysis.data.filter(d => d[analysis.key] !== null);

  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const lastCandles = candleData.slice(-20);
      const currentPrice = lastCandles[lastCandles.length - 1]?.close;
      const rsi = rsiData[rsiData.length - 1]?.rsi || 50;
      const trend = currentPrice > lastCandles[0]?.open ? 'alcista' : 'bajista';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analiza esta situación técnica de trading:
        
Precio actual: $${currentPrice?.toFixed(2)}
RSI (14): ${rsi?.toFixed(2)}
Tendencia reciente: ${trend}
Últimos 5 cierres: ${lastCandles.slice(-5).map(c => '$' + c.close.toFixed(2)).join(', ')}

Proporciona un análisis técnico breve con:
1. Señal técnica (COMPRA/VENTA/NEUTRAL)
2. Nivel de confianza (ALTO/MEDIO/BAJO)
3. Soporte y resistencia próximos
4. Risk/Reward sugerido
5. Reasoning en 2-3 líneas

Sé conciso y directo.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            signal: { type: 'string', enum: ['COMPRA', 'VENTA', 'NEUTRAL'] },
            confidence: { type: 'string', enum: ['ALTO', 'MEDIO', 'BAJO'] },
            support: { type: 'number' },
            resistance: { type: 'number' },
            riskReward: { type: 'string' },
            reasoning: { type: 'string' },
          },
        },
      });
      setAiAnalysis(response.data);
    } catch (err) {
      console.error('Error en análisis IA:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  const signalColor = aiAnalysis?.signal === 'COMPRA' ? 'text-emerald-500'
    : aiAnalysis?.signal === 'VENTA' ? 'text-red-500'
    : 'text-amber-500';

  return (
    <div className="space-y-4">
      {/* Selector de indicadores */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Indicadores técnicos</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['rsi', 'sma', 'macd'].map(type => (
            <button
              key={type}
              onClick={() => setAnalysisType(type)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                analysisType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico del indicador */}
      <div className="bg-card rounded-xl border border-border p-4">
        <ResponsiveContainer width="100%" height={250}>
          {analysis.key === 'rsi' ? (
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                formatter={(value) => value?.toFixed(2)}
              />
              <Line type="monotone" dataKey="rsi" stroke="#f59e0b" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey={() => 70} stroke="#ef4444" strokeDasharray="5 5" name="Sobrecompra" />
              <Line type="monotone" dataKey={() => 30} stroke="#10b981" strokeDasharray="5 5" name="Sobreventa" />
            </LineChart>
          ) : (
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                formatter={(value) => value?.toFixed(4)}
              />
              <Line type="monotone" dataKey={analysis.key} stroke="#3b82f6" dot={false} strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Análisis IA */}
      <div className="bg-card rounded-xl border border-border p-4">
        <Button
          onClick={handleAIAnalysis}
          disabled={loadingAI}
          className="w-full gap-2 mb-4"
        >
          {loadingAI ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          {loadingAI ? 'Analizando...' : 'Análisis IA avanzado'}
        </Button>

        {aiAnalysis && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <span className="font-semibold">Señal técnica:</span>
              <span className={cn('font-bold text-base', signalColor)}>
                {aiAnalysis.signal}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <span className="font-semibold">Confianza:</span>
              <span className="font-bold">{aiAnalysis.confidence}</span>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg space-y-1">
              <p className="text-muted-foreground text-xs">Soporte / Resistencia</p>
              <p className="font-semibold">
                ${aiAnalysis.support?.toFixed(2)} / ${aiAnalysis.resistance?.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-muted-foreground text-xs mb-1">Análisis</p>
              <p className="text-xs">{aiAnalysis.reasoning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}