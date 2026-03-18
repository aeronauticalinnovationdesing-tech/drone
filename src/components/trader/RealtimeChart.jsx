import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

export default function RealtimeChart({ pair = 'EUR/USD', candles = [], showRSI = true, showMA20 = true, showMA50 = true }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const ma20SeriesRef = useRef(null);
  const ma50SeriesRef = useRef(null);
  const [trend, setTrend] = useState(null);
  const [price, setPrice] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    // Crear gráfico - responsive en mobile y desktop
    const chartHeight = window.innerWidth < 768 ? 300 : 400;
    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: '#d1d5db',
        background: { type: 'solid', color: 'transparent' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      watermark: {
        color: 'rgba(209, 213, 219, 0.1)',
        visible: true,
        text: pair,
        fontSize: window.innerWidth < 768 ? 12 : 16,
        horzAlign: 'left',
        vertAlign: 'top',
      },
    });

    chartRef.current = chart;

    // Series de velas
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candleSeriesRef.current = candleSeries;

    // Convertir datos
    const chartData = candles.map(c => ({
      time: Math.floor(new Date(c.time).getTime() / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(chartData);

    // Medias móviles
    if (showMA20) {
      const ma20 = calculateMA(candles.map(c => c.close), 20);
      const ma20Data = ma20.map((val, idx) => ({
        time: Math.floor(new Date(candles[idx].time).getTime() / 1000),
        value: val,
      })).slice(20);
      
      ma20SeriesRef.current = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        title: 'MA 20',
      });
      ma20SeriesRef.current.setData(ma20Data);
    }

    if (showMA50) {
      const ma50 = calculateMA(candles.map(c => c.close), 50);
      const ma50Data = ma50.map((val, idx) => ({
        time: Math.floor(new Date(candles[idx].time).getTime() / 1000),
        value: val,
      })).slice(50);
      
      ma50SeriesRef.current = chart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 2,
        title: 'MA 50',
      });
      ma50SeriesRef.current.setData(ma50Data);
    }

    // RSI en panel separado
    if (showRSI) {
      const rsiSeries = chart.addLineSeries({
        color: '#8b5cf6',
        lineWidth: 2,
        title: 'RSI',
      });
      rsiSeriesRef.current = rsiSeries;

      const rsi = calculateRSI(candles.map(c => c.close), 14);
      const rsiData = rsi.map((val, idx) => ({
        time: Math.floor(new Date(candles[idx + 14].time).getTime() / 1000),
        value: val,
      }));

      rsiSeries.setData(rsiData);
    }

    // Fit content
    chart.timeScale().fitContent();

    // Update trend
    if (chartData.length > 0) {
      const lastPrice = chartData[chartData.length - 1].close;
      const firstPrice = chartData[0].close;
      setPrice(lastPrice);
      setTrend(lastPrice > firstPrice ? 'ALCISTA' : 'BAJISTA');
    }

    // Handle resize - recalcular altura también en mobile
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const newHeight = window.innerWidth < 768 ? 300 : 400;
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: newHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles, pair, showRSI, showMA20, showMA50]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-lg sm:text-xl">{pair}</CardTitle>
            {trend && (
              <Badge className={trend === 'ALCISTA' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-destructive/15 text-destructive'}>
                {trend === 'ALCISTA' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {trend}
              </Badge>
            )}
          </div>
          {price && (
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-bold">${price.toFixed(5)}</p>
              <p className="text-xs text-muted-foreground">Precio actual</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden bg-muted/20" style={{ minHeight: '300px' }} />
      </CardContent>
    </Card>
  );
}

function calculateMA(prices, period) {
  const ma = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      ma.push(null);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      ma.push(sum / period);
    }
  }
  return ma;
}

function calculateRSI(prices, period) {
  const rsi = [];
  let gains = 0, losses = 0;

  for (let i = 1; i < period + 1; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
}