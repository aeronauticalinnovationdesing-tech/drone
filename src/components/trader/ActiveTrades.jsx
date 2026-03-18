import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, X, Edit2 } from 'lucide-react';

export default function ActiveTrades() {
  const user = useCurrentUser();

  const { data: trades = [] } = useQuery({
    queryKey: ['active-trades', user?.email],
    queryFn: () => base44.entities.Trade.filter({
      created_by: user?.email,
      result: { $exists: false }, // Trades sin resultado final
    }, '-date', 50),
    enabled: !!user?.email,
  });

  const activeTrades = trades.filter(t => t.date && new Date(t.date) <= new Date());

  const stats = {
    total: activeTrades.length,
    long: activeTrades.filter(t => t.direction === 'long').length,
    short: activeTrades.filter(t => t.direction === 'short').length,
    totalRisk: activeTrades.reduce((sum, t) => sum + ((t.entry_price - t.stop_loss) * (t.lot_size || 1)), 0),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operaciones Activas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.long}</p>
            <p className="text-xs text-muted-foreground">Longs</p>
          </div>
          <div className="bg-destructive/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.short}</p>
            <p className="text-xs text-muted-foreground">Shorts</p>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-amber-600">${Math.abs(stats.totalRisk).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Riesgo</p>
          </div>
        </div>

        {/* Trades List */}
        {activeTrades.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activeTrades.map(trade => (
              <div key={trade.id} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center ${
                      trade.direction === 'long' ? 'bg-emerald-500/20' : 'bg-destructive/20'
                    }`}>
                      {trade.direction === 'long' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{trade.pair}</p>
                      <p className="text-xs text-muted-foreground">{trade.setup}</p>
                    </div>
                  </div>
                  <Badge variant={trade.direction === 'long' ? 'default' : 'destructive'} className="text-xs">
                    {trade.direction.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-muted-foreground">Entry:</span> ${trade.entry_price?.toFixed(5)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">SL:</span> ${trade.stop_loss?.toFixed(5)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">TP:</span> ${trade.take_profit?.toFixed(5)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">RR:</span> {trade.risk_reward?.toFixed(2)}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="flex-1 text-xs h-7">
                    <Edit2 className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 text-xs h-7 text-destructive hover:text-destructive">
                    <X className="w-3 h-3 mr-1" /> Cerrar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay operaciones activas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}