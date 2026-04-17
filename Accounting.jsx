import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Plus, DollarSign, TrendingUp, TrendingDown, BookOpen, Wallet, FileText } from "lucide-react";
import DepartmentTaskWidget from "../components/tasks/DepartmentTaskWidget";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors = {
  Draft: "bg-slate-100 text-slate-600",
  Posted: "bg-emerald-100 text-emerald-700",
  Voided: "bg-red-100 text-red-700",
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = {
    emerald: "from-emerald-500 to-emerald-600",
    red: "from-red-500 to-red-600",
    indigo: "from-indigo-500 to-indigo-600",
    amber: "from-amber-500 to-amber-600",
  };
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Accounting() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showCashForm, setShowCashForm] = useState(false);
  const [journalForm, setJournalForm] = useState({ entry_date: "", reference: "", description: "", debit_account: "", credit_account: "", amount: "", department: "", status: "Draft" });
  const [cashForm, setCashForm] = useState({ transaction_date: "", type: "Income", category: "", amount: "", description: "", department: "", status: "Pending" });

  const { data: journals = [] } = useQuery({ queryKey: ["journals"], queryFn: () => base44.entities.JournalEntry.list("-entry_date", 200) });
  const { data: transactions = [] } = useQuery({ queryKey: ["cash-transactions"], queryFn: () => base44.entities.CashTransaction.list("-transaction_date", 200) });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => base44.entities.Account.list("-created_date", 100) });
  const { data: payrolls = [] } = useQuery({ queryKey: ["payrolls-acct"], queryFn: () => base44.entities.Payroll.list("-created_date", 200) });
  const { data: projects = [] } = useQuery({ queryKey: ["projects-acct"], queryFn: () => base44.entities.Project.list("-created_date", 100) });

  const createJournal = useMutation({ mutationFn: (d) => base44.entities.JournalEntry.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["journals"] }); setShowJournalForm(false); toast.success("Journal entry created"); } });
  const createCash = useMutation({ mutationFn: (d) => base44.entities.CashTransaction.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["cash-transactions"] }); setShowCashForm(false); toast.success("Transaction recorded"); } });

  const totalIncome = transactions.filter(t => t.type === "Income" && t.status === "Approved").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === "Expense" && t.status === "Approved").reduce((s, t) => s + (t.amount || 0), 0);
  const totalPayroll = payrolls.reduce((s, p) => s + (p.net_salary || 0), 0);
  const postedJournals = journals.filter(j => j.status === "Posted").length;

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const m = d.toISOString().slice(0, 7);
    const inc = transactions.filter(t => t.type === "Income" && t.transaction_date?.startsWith(m)).reduce((s, t) => s + (t.amount || 0), 0);
    const exp = transactions.filter(t => t.type === "Expense" && t.transaction_date?.startsWith(m)).reduce((s, t) => s + (t.amount || 0), 0);
    return { month: d.toLocaleString("default", { month: "short" }), Income: inc, Expense: exp };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounting</h1>
          <p className="text-sm text-slate-500 mt-1">Financial management, journals & cash handling</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCashForm(true)}><Wallet className="w-4 h-4 mr-1.5" />Cash Entry</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowJournalForm(true)}><Plus className="w-4 h-4 mr-1.5" />Journal Entry</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={`$${totalIncome.toLocaleString()}`} icon={TrendingUp} color="emerald" subtitle="Approved" />
        <StatCard title="Total Expenses" value={`$${totalExpense.toLocaleString()}`} icon={TrendingDown} color="red" subtitle="Approved" />
        <StatCard title="Payroll Cost" value={`$${totalPayroll.toLocaleString()}`} icon={DollarSign} color="amber" subtitle="All periods" />
        <StatCard title="Posted Journals" value={postedJournals} icon={BookOpen} color="indigo" subtitle="Active entries" />
      </div>

      <DepartmentTaskWidget department="Accounting" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="journals">Journals</TabsTrigger>
          <TabsTrigger value="cash">Cash Handling</TabsTrigger>
          <TabsTrigger value="payroll-sync">Payroll Sync</TabsTrigger>
          <TabsTrigger value="project-costs">Project Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Monthly Income vs Expense</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journals" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Description</TableHead><TableHead>Debit</TableHead><TableHead>Credit</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {journals.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">No journal entries yet</TableCell></TableRow>}
                  {journals.map(j => (
                    <TableRow key={j.id}>
                      <TableCell className="text-sm">{j.entry_date}</TableCell>
                      <TableCell className="text-sm font-mono">{j.reference || "-"}</TableCell>
                      <TableCell className="text-sm">{j.description}</TableCell>
                      <TableCell className="text-sm">{j.debit_account}</TableCell>
                      <TableCell className="text-sm">{j.credit_account}</TableCell>
                      <TableCell className="text-sm font-medium">${(j.amount || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge className={statusColors[j.status]}>{j.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {transactions.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No transactions yet</TableCell></TableRow>}
                  {transactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{t.transaction_date}</TableCell>
                      <TableCell><Badge className={t.type === "Income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>{t.type}</Badge></TableCell>
                      <TableCell className="text-sm">{t.category}</TableCell>
                      <TableCell className="text-sm font-medium">${(t.amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{t.department}</TableCell>
                      <TableCell><Badge className={statusColors[t.status]}>{t.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll-sync" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Payroll Ledger Sync</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Employee</TableHead><TableHead>Month</TableHead><TableHead>Basic Salary</TableHead><TableHead>Deductions</TableHead><TableHead>Tax</TableHead><TableHead>Net Pay</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payrolls.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">{p.employee_name}</TableCell>
                      <TableCell className="text-sm">{p.month}</TableCell>
                      <TableCell className="text-sm">${(p.basic_salary || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-red-600">-${(p.deductions || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-orange-600">-${(p.tax || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm font-bold text-emerald-700">${(p.net_salary || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge className={p.payment_status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{p.payment_status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project-costs" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Project Cost Tracking</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Project</TableHead><TableHead>Client</TableHead><TableHead>Budget</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {projects.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">{p.project_name}</TableCell>
                      <TableCell className="text-sm">{p.client_name}</TableCell>
                      <TableCell className="text-sm font-medium">${(p.budget || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge className={p.status === "Completed" ? "bg-emerald-100 text-emerald-700" : p.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}>{p.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Journal Form */}
      <Dialog open={showJournalForm} onOpenChange={setShowJournalForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Date</label><Input type="date" value={journalForm.entry_date} onChange={e => setJournalForm({ ...journalForm, entry_date: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Reference</label><Input placeholder="REF-001" value={journalForm.reference} onChange={e => setJournalForm({ ...journalForm, reference: e.target.value })} /></div>
            </div>
            <div><label className="text-xs text-slate-500">Description</label><Input placeholder="Description" value={journalForm.description} onChange={e => setJournalForm({ ...journalForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Debit Account</label><Input placeholder="e.g. Cash" value={journalForm.debit_account} onChange={e => setJournalForm({ ...journalForm, debit_account: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Credit Account</label><Input placeholder="e.g. Revenue" value={journalForm.credit_account} onChange={e => setJournalForm({ ...journalForm, credit_account: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Amount ($)</label><Input type="number" placeholder="0.00" value={journalForm.amount} onChange={e => setJournalForm({ ...journalForm, amount: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Status</label>
                <Select value={journalForm.status} onValueChange={v => setJournalForm({ ...journalForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Posted">Posted</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => createJournal.mutate({ ...journalForm, amount: parseFloat(journalForm.amount) || 0 })}>Save Journal Entry</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cash Form */}
      <Dialog open={showCashForm} onOpenChange={setShowCashForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Cash Transaction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Date</label><Input type="date" value={cashForm.transaction_date} onChange={e => setCashForm({ ...cashForm, transaction_date: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Type</label>
                <Select value={cashForm.type} onValueChange={v => setCashForm({ ...cashForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Income">Income</SelectItem><SelectItem value="Expense">Expense</SelectItem><SelectItem value="Transfer">Transfer</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Category</label><Input placeholder="e.g. Sales Revenue" value={cashForm.category} onChange={e => setCashForm({ ...cashForm, category: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Amount ($)</label><Input type="number" placeholder="0.00" value={cashForm.amount} onChange={e => setCashForm({ ...cashForm, amount: e.target.value })} /></div>
            </div>
            <div><label className="text-xs text-slate-500">Description</label><Input placeholder="Description" value={cashForm.description} onChange={e => setCashForm({ ...cashForm, description: e.target.value })} /></div>
            <div><label className="text-xs text-slate-500">Department</label><Input placeholder="e.g. Sales" value={cashForm.department} onChange={e => setCashForm({ ...cashForm, department: e.target.value })} /></div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => createCash.mutate({ ...cashForm, amount: parseFloat(cashForm.amount) || 0 })}>Save Transaction</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}