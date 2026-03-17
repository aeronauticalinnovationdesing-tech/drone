import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Wallet, TrendingUp, TrendingDown, Building2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import StatCard from "../components/dashboard/StatCard";

const categoryLabels = {
  salary: "Salario", freelance: "Freelance", investment: "Inversión", office: "Oficina",
  tools: "Herramientas", marketing: "Marketing", travel: "Viajes", food: "Alimentación",
  utilities: "Servicios", other: "Otro"
};

export default function Accounting() {
  const [showTx, setShowTx] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [txForm, setTxForm] = useState({ description: "", amount: 0, type: "expense", category: "other", date: format(new Date(), "yyyy-MM-dd"), bank_account_id: "" });
  const [accForm, setAccForm] = useState({ name: "", bank_name: "", account_type: "checking", balance: 0, currency: "USD" });
  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.Transaction.list("-created_date") });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => base44.entities.BankAccount.list() });

  const createTx = useMutation({ mutationFn: (d) => base44.entities.Transaction.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["transactions"] }); setShowTx(false); } });
  const deleteTx = useMutation({ mutationFn: (id) => base44.entities.Transaction.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }) });
  const createAcc = useMutation({ mutationFn: (d) => base44.entities.BankAccount.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["accounts"] }); setShowAccount(false); } });
  const deleteAcc = useMutation({ mutationFn: (id) => base44.entities.BankAccount.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }) });

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Contabilidad</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAccount(true)} className="gap-2"><Building2 className="w-4 h-4" /> Nueva Cuenta</Button>
          <Button onClick={() => setShowTx(true)} className="gap-2"><Plus className="w-4 h-4" /> Nuevo Movimiento</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Ingresos" value={`$${totalIncome.toLocaleString()}`} />
        <StatCard icon={TrendingDown} label="Gastos" value={`$${totalExpense.toLocaleString()}`} />
        <StatCard icon={Wallet} label="Balance" value={`$${(totalIncome - totalExpense).toLocaleString()}`} />
      </div>

      <Tabs defaultValue="transactions">
        <TabsList><TabsTrigger value="transactions">Movimientos</TabsTrigger><TabsTrigger value="accounts">Cuentas Bancarias</TabsTrigger></TabsList>

        <TabsContent value="transactions" className="space-y-2 mt-4">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border group">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                tx.type === "income" ? "bg-green-100" : "bg-red-100"
              )}>
                {tx.type === "income" ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabels[tx.category]} {accountMap[tx.bank_account_id] && `• ${accountMap[tx.bank_account_id]}`}
                  {tx.date && ` • ${format(new Date(tx.date), "d MMM yyyy", { locale: es })}`}
                </p>
              </div>
              <span className={cn("font-bold text-sm", tx.type === "income" ? "text-green-600" : "text-red-600")}>
                {tx.type === "income" ? "+" : "-"}${(tx.amount || 0).toLocaleString()}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteTx.mutate(tx.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {transactions.length === 0 && <div className="text-center py-12 text-muted-foreground">Sin movimientos registrados</div>}
        </TabsContent>

        <TabsContent value="accounts" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-card rounded-2xl border border-border p-5 group relative">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.bank_name}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">${(acc.balance || 0).toLocaleString()} <span className="text-sm text-muted-foreground">{acc.currency}</span></p>
                <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteAcc.mutate(acc.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
          {accounts.length === 0 && <div className="text-center py-12 text-muted-foreground">Sin cuentas registradas</div>}
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={showTx} onOpenChange={setShowTx}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo Movimiento</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createTx.mutate({ ...txForm, amount: Number(txForm.amount) }); }} className="space-y-4">
            <div><Label>Descripción</Label><Input value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monto</Label><Input type="number" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} required /></div>
              <div><Label>Tipo</Label>
                <Select value={txForm.type} onValueChange={v => setTxForm({ ...txForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="income">Ingreso</SelectItem><SelectItem value="expense">Gasto</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Categoría</Label>
                <Select value={txForm.category} onValueChange={v => setTxForm({ ...txForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Fecha</Label><Input type="date" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} /></div>
            </div>
            <div><Label>Cuenta</Label>
              <Select value={txForm.bank_account_id || "none"} onValueChange={v => setTxForm({ ...txForm, bank_account_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sin cuenta" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Sin cuenta</SelectItem>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowTx(false)}>Cancelar</Button><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Dialog */}
      <Dialog open={showAccount} onOpenChange={setShowAccount}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nueva Cuenta Bancaria</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createAcc.mutate({ ...accForm, balance: Number(accForm.balance) }); }} className="space-y-4">
            <div><Label>Nombre</Label><Input value={accForm.name} onChange={e => setAccForm({ ...accForm, name: e.target.value })} required /></div>
            <div><Label>Banco</Label><Input value={accForm.bank_name} onChange={e => setAccForm({ ...accForm, bank_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={accForm.account_type} onValueChange={v => setAccForm({ ...accForm, account_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="checking">Corriente</SelectItem><SelectItem value="savings">Ahorros</SelectItem><SelectItem value="credit">Crédito</SelectItem><SelectItem value="investment">Inversión</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Balance</Label><Input type="number" value={accForm.balance} onChange={e => setAccForm({ ...accForm, balance: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowAccount(false)}>Cancelar</Button><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}