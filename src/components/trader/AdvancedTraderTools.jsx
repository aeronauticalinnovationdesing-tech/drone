import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdvancedTraderTools() {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const forexPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];

  // Fetch Forex Data
  const { data: forexData, isLoading: forexLoading } = useQuery({
    queryKey: ['forex-data', selectedPair],
    queryFn: async () => {
      const res = await base44.functions.invoke('getForexData', {
        pair: selectedPair,
        interval: '1h',
      });
      return res.data;
    },
    refetchInterval: 60000, // Actualizar cada minuto
  });

  // Fetch Technical Analysis
  const { data: technical, isLoading: technicalLoading } = useQuery({
    queryKey: ['technical-analysis', selectedPair, forexData],
    queryFn: async () => {
      if (!forexData?.candles) return null;
      const res = await base44.functions.invoke('analyzeTechnical', {
        candles: forexData.candles,
      });
      return res.data;
    },
    enabled: !!forexData?.candles,
  });

  // Fetch Financial News
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['financial-news'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getFinancialNews', {
        query: 'forex market financial news',
        limit: 8,
      });
      return res.data;
    },
    refetchInterval: 300000, // Actualizar cada 5 minutos
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Herramientas Avanzadas de Trading</h1>
        <p className="text-muted-foreground">Análisis técnico en tiempo real, noticias e indicadores especializados</p>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Análisis Técnico</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="news">Noticias</TabsTrigger>
        </TabsList>

        {/* Technical Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Par</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {forexPairs.map(pair => (
                  <Button
                    key={pair}
                    variant={selectedPair === pair ? 'default' : 'outline'}
                    onClick={() => setSelectedPair(pair)}
                    disabled={forexLoading}
                  >
                    {pair}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {technicalLoading ? (
            <Card className="p-8 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </Card>
          ) : technical ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trend Card */}
              <Card className={`${technical.trend === 'ALCISTA' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-destructive/50 bg-destructive/5'}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tendencia</CardTitle>
                  {technical.trend === 'ALCISTA' ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${technical.trend === 'ALCISTA' ? 'text-emerald-600' : 'text-destructive'}`}>
                    {technical.trend}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Precio: ${technical.lastPrice.toFixed(5)}
                  </p>
                </CardContent>
              </Card>

              {/* Signal Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Señal</CardTitle>
                  {technical.signal.signal === 'COMPRA' ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4 text-destructive" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    technical.signal.signal === 'COMPRA' ? 'text-emerald-600' : 
                    technical.signal.signal === 'VENTA' ? 'text-destructive' : 
                    'text-amber-600'
                  }`}>
                    {technical.signal.signal}
                  </div>
                  <Badge className="mt-2">
                    Fuerza: {technical.signal.strength}
                  </Badge>
                </CardContent>
              </Card>

              {/* Indicators Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Indicadores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">RSI (14)</span>
                    <span className={`font-bold ${technical.rsi < 30 ? 'text-emerald-600' : technical.rsi > 70 ? 'text-destructive' : 'text-amber-600'}`}>
                      {technical.rsi.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">MACD</span>
                    <span className={`font-bold ${technical.macd > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {technical.macd.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">EMA 12</span>
                    <span className="font-mono">{technical.ema12.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">EMA 26</span>
                    <span className="font-mono">{technical.ema26.toFixed(5)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Support/Resistance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Niveles Clave</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Resistencia</p>
                    <p className="text-lg font-bold text-destructive">${technical.resistance.toFixed(5)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Precio Actual</p>
                    <p className="text-lg font-bold">${technical.lastPrice.toFixed(5)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Soporte</p>
                    <p className="text-lg font-bold text-emerald-600">${technical.support.toFixed(5)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Detection */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Patrón Detectado</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="text-base py-2 px-3">
                    {technical.pattern}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts">
          {forexLoading ? (
            <Card className="p-8 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </Card>
          ) : forexData?.candles ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedPair} - Últimas 100 velas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={forexData.candles}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="close" stroke="#8884d8" name="Cierre" />
                    <Line type="monotone" dataKey="high" stroke="#82ca9d" name="Máximo" opacity={0.5} />
                    <Line type="monotone" dataKey="low" stroke="#ffc658" name="Mínimo" opacity={0.5} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news">
          {newsLoading ? (
            <Card className="p-8 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </Card>
          ) : newsData?.news ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newsData.news.map((article, idx) => (
                <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {article.image && (
                    <div className="w-full h-32 bg-muted overflow-hidden">
                      <img src={article.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm line-clamp-2">{article.title}</CardTitle>
                      <Badge className={`${
                        article.impact === 'high' ? 'bg-destructive' :
                        article.impact === 'medium' ? 'bg-amber-500' :
                        'bg-secondary'
                      }`}>
                        {article.impact === 'high' ? '🔴' : article.impact === 'medium' ? '🟡' : '🟢'}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">{article.source}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.description}</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        Leer más →
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}