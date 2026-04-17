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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Plus, Users, DollarSign, Target, TrendingUp, Phone, Mail, Building } from "lucide-react";
import DepartmentTaskWidget from "../components/tasks/DepartmentTaskWidget";
import { toast } from "sonner";

const stageColors = {
  Lead: "bg-slate-100 text-slate-600",
  Proposal: "bg-blue-100 text-blue-700",
  Negotiation: "bg-amber-100 text-amber-700",
  Won: "bg-emerald-100 text-emerald-700",
  Lost: "bg-red-100 text-red-700",
};

const clientTypeColors = {
  Lead: "bg-slate-100 text-slate-600",
  Prospect: "bg-blue-100 text-blue-700",
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-600",
  VIP: "bg-purple-100 text-purple-700",
};

const PIPELINE_COLORS = ["#94a3b8", "#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = { emerald: "from-emerald-500 to-emerald-600", blue: "from-blue-500 to-blue-600", violet: "from-violet-500 to-violet-600", amber: "from-amber-500 to-amber-600" };
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

export default function Sales() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pipeline");
  const [showClientForm, setShowClientForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);

  const emptyClient = { company_name: "", contact_person: "", email: "", phone: "", industry: "", client_type: "Lead", assigned_sales_rep: "", notes: "" };
  const emptySale = { client_name: "", sales_rep: "", product_service: "", amount: "", sale_date: "", stage: "Lead", probability: "50", notes: "" };
  const emptyTarget = { sales_rep: "", period: "", target_amount: "", achieved_amount: "0", notes: "" };

  const [clientForm, setClientForm] = useState(emptyClient);
  const [saleForm, setSaleForm] = useState(emptySale);
  const [targetForm, setTargetForm] = useState(emptyTarget);

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: () => base44.entities.SalesRecord.list("-sale_date", 200) });
  const { data: targets = [] } = useQuery({ queryKey: ["sales-targets"], queryFn: () => base44.entities.SalesTarget.list("-created_date", 100) });

  const createClient = useMutation({ mutationFn: d => base44.entities.Client.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setShowClientForm(false); setClientForm(emptyClient); toast.success("Client added"); } });
  const createSale = useMutation({ mutationFn: d => base44.entities.SalesRecord.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales"] }); setShowSaleForm(false); setSaleForm(emptySale); toast.success("Deal created"); } });
  const createTarget = useMutation({ mutationFn: d => base44.entities.SalesTarget.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales-targets"] }); setShowTargetForm(false); setTargetForm(emptyTarget); toast.success("Target set"); } });

  const totalRevenue = sales.filter(s => s.stage === "Won").reduce((sum, s) => sum + (s.amount || 0), 0);
  const pipelineValue = sales.filter(s => !["Won", "Lost"].includes(s.stage)).reduce((sum, s) => sum + (s.amount || 0), 0);
  const wonDeals = sales.filter(s => s.stage === "Won").length;
  const activeClients = clients.filter(c => c.status === "Active").length;

  const pipelineChartData = ["Lead", "Proposal", "Negotiation", "Won", "Lost"].map((stage, i) => ({
    name: stage,
    value: sales.filter(s => s.stage === stage).length,
    fill: PIPELINE_COLORS[i],
  }));

  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const m = d.toISOString().slice(0, 7);
    return {
      month: d.toLocaleString("default", { month: "short" }),
      Revenue: sales.filter(s => s.stage === "Won" && s.sale_date?.startsWith(m)).reduce((sum, s) => sum + (s.amount || 0), 0),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales & CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Manage clients, deals, pipeline & sales performance</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowTargetForm(true)}><Target className="w-4 h-4 mr-1.5" />Set Target</Button>
          <Button size="sm" variant="outline" onClick={() => setShowClientForm(true)}><Users className="w-4 h-4 mr-1.5" />Add Client</Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowSaleForm(true)}><Plus className="w-4 h-4 mr-1.5" />New Deal</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="emerald" subtitle="Won deals" />
        <StatCard title="Pipeline Value" value={`$${pipelineValue.toLocaleString()}`} icon={TrendingUp} color="blue" subtitle="Active deals" />
        <StatCard title="Deals Won" value={wonDeals} icon={Target} color="violet" subtitle="Closed won" />
        <StatCard title="Active Clients" value={activeClients} icon={Users} color="amber" subtitle="In database" />
      </div>

      <DepartmentTaskWidget department="Sales" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Client</TableHead><TableHead>Sales Rep</TableHead><TableHead>Product/Service</TableHead><TableHead>Amount</TableHead><TableHead>Stage</TableHead><TableHead>Probability</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sales.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">No deals yet — add your first deal</TableCell></TableRow>}
                  {sales.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm font-medium">{s.client_name}</TableCell>
                      <TableCell className="text-sm">{s.sales_rep}</TableCell>
                      <TableCell className="text-sm">{s.product_service}</TableCell>
                      <TableCell className="text-sm font-medium">${(s.amount || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge className={stageColors[s.stage]}>{s.stage}</Badge></TableCell>
                      <TableCell className="text-sm">{s.probability}%</TableCell>
                      <TableCell className="text-sm text-slate-500">{s.sale_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Company</TableHead><TableHead>Contact</TableHead><TableHead>Phone</TableHead><TableHead>Industry</TableHead><TableHead>Type</TableHead><TableHead>Sales Rep</TableHead></TableRow></TableHeader>
                <TableBody>
                  {clients.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No clients yet</TableCell></TableRow>}
                  {clients.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-medium">{c.company_name}</TableCell>
                      <TableCell className="text-sm">{c.contact_person}</TableCell>
                      <TableCell className="text-sm">{c.phone}</TableCell>
                      <TableCell className="text-sm">{c.industry}</TableCell>
                      <TableCell><Badge className={clientTypeColors[c.client_type]}>{c.client_type}</Badge></TableCell>
                      <TableCell className="text-sm">{c.assigned_sales_rep}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targets" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Sales Rep</TableHead><TableHead>Period</TableHead><TableHead>Target</TableHead><TableHead>Achieved</TableHead><TableHead>Progress</TableHead></TableRow></TableHeader>
                <TableBody>
                  {targets.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">No targets set yet</TableCell></TableRow>}
                  {targets.map(t => {
                    const pct = Math.min(100, Math.round(((t.achieved_amount || 0) / (t.target_amount || 1)) * 100));
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm font-medium">{t.sales_rep}</TableCell>
                        <TableCell className="text-sm">{t.period}</TableCell>
                        <TableCell className="text-sm font-medium">${(t.target_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-emerald-700">${(t.achieved_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} /></div>
                            <span className="text-xs text-slate-500 w-8">{pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Monthly Revenue</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Pipeline by Stage</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pipelineChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pipelineChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Client Form */}
      <Dialog open={showClientForm} onOpenChange={setShowClientForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Company Name *</label><Input value={clientForm.company_name} onChange={e => setClientForm({ ...clientForm, company_name: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Contact Person</label><Input value={clientForm.contact_person} onChange={e => setClientForm({ ...clientForm, contact_person: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Email</label><Input type="email" value={clientForm.email} onChange={e => setClientForm({ ...clientForm, email: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Phone</label><Input value={clientForm.phone} onChange={e => setClientForm({ ...clientForm, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Industry</label><Input value={clientForm.industry} onChange={e => setClientForm({ ...clientForm, industry: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Client Type</label>
                <Select value={clientForm.client_type} onValueChange={v => setClientForm({ ...clientForm, client_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Lead","Prospect","Active","Inactive","VIP"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-xs text-slate-500">Assigned Sales Rep</label><Input value={clientForm.assigned_sales_rep} onChange={e => setClientForm({ ...clientForm, assigned_sales_rep: e.target.value })} /></div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => createClient.mutate(clientForm)}>Save Client</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Form */}
      <Dialog open={showSaleForm} onOpenChange={setShowSaleForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Deal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Client Name *</label><Input value={saleForm.client_name} onChange={e => setSaleForm({ ...saleForm, client_name: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Sales Rep</label><Input value={saleForm.sales_rep} onChange={e => setSaleForm({ ...saleForm, sales_rep: e.target.value })} /></div>
            </div>
            <div><label className="text-xs text-slate-500">Product / Service *</label><Input value={saleForm.product_service} onChange={e => setSaleForm({ ...saleForm, product_service: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Amount ($) *</label><Input type="number" value={saleForm.amount} onChange={e => setSaleForm({ ...saleForm, amount: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Stage</label>
                <Select value={saleForm.stage} onValueChange={v => setSaleForm({ ...saleForm, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Lead","Proposal","Negotiation","Won","Lost"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Sale Date</label><Input type="date" value={saleForm.sale_date} onChange={e => setSaleForm({ ...saleForm, sale_date: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Win Probability (%)</label><Input type="number" min="0" max="100" value={saleForm.probability} onChange={e => setSaleForm({ ...saleForm, probability: e.target.value })} /></div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => createSale.mutate({ ...saleForm, amount: parseFloat(saleForm.amount) || 0, probability: parseInt(saleForm.probability) || 50 })}>Save Deal</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Target Form */}
      <Dialog open={showTargetForm} onOpenChange={setShowTargetForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Set Sales Target</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs text-slate-500">Sales Rep *</label><Input value={targetForm.sales_rep} onChange={e => setTargetForm({ ...targetForm, sales_rep: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Period (e.g. 2026-Q1)</label><Input value={targetForm.period} onChange={e => setTargetForm({ ...targetForm, period: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Target Amount ($)</label><Input type="number" value={targetForm.target_amount} onChange={e => setTargetForm({ ...targetForm, target_amount: e.target.value })} /></div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => createTarget.mutate({ ...targetForm, target_amount: parseFloat(targetForm.target_amount) || 0, achieved_amount: 0 })}>Save Target</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}