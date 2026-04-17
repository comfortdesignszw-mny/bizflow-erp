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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Package, Truck, Factory, Wrench, CheckCircle } from "lucide-react";
import DepartmentTaskWidget from "../components/tasks/DepartmentTaskWidget";
import { toast } from "sonner";

const orderStatusColors = {
  Draft: "bg-slate-100 text-slate-600",
  "Pending Approval": "bg-amber-100 text-amber-700",
  Approved: "bg-blue-100 text-blue-700",
  Ordered: "bg-violet-100 text-violet-700",
  Delivered: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
};
const productionStatusColors = {
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Halted: "bg-red-100 text-red-700",
};

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = { indigo: "from-indigo-500 to-indigo-600", emerald: "from-emerald-500 to-emerald-600", amber: "from-amber-500 to-amber-600", blue: "from-blue-500 to-blue-600", violet: "from-violet-500 to-violet-600" };
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

const emptyOrder = { order_number: "", supplier_name: "", item_description: "", quantity: "", unit_price: "", total_amount: "", department: "", requested_by: "", approved_by: "", order_date: "", delivery_date: "", status: "Draft", notes: "" };
const emptyProduction = { product_name: "", production_date: "", quantity_target: "", quantity_produced: "", supervisor: "", shift: "Morning", quality_passed: "", quality_failed: "", downtime_minutes: "0", notes: "", status: "In Progress" };

export default function Operations() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("procurement");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showProdForm, setShowProdForm] = useState(false);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [prodForm, setProdForm] = useState(emptyProduction);

  const { data: orders = [] } = useQuery({ queryKey: ["procurement"], queryFn: () => base44.entities.ProcurementOrder.list("-order_date", 200) });
  const { data: production = [] } = useQuery({ queryKey: ["production"], queryFn: () => base44.entities.ProductionLog.list("-production_date", 200) });
  const { data: maintenance = [] } = useQuery({ queryKey: ["maint-ops"], queryFn: () => base44.entities.MaintenanceRequest.list("-created_date", 100) });
  const { data: fleet = [] } = useQuery({ queryKey: ["fleet-ops"], queryFn: () => base44.entities.FleetVehicle.list("-created_date", 100) });

  const createOrder = useMutation({ mutationFn: d => base44.entities.ProcurementOrder.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["procurement"] }); setShowOrderForm(false); setOrderForm(emptyOrder); toast.success("Order created"); } });
  const createProd = useMutation({ mutationFn: d => base44.entities.ProductionLog.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["production"] }); setShowProdForm(false); setProdForm(emptyProduction); toast.success("Production log saved"); } });
  const approveOrder = useMutation({ mutationFn: (id) => base44.entities.ProcurementOrder.update(id, { status: "Approved" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["procurement"] }); toast.success("Order approved"); } });

  const pendingOrders = orders.filter(o => o.status === "Pending Approval").length;
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const activeProduction = production.filter(p => p.status === "In Progress").length;
  const totalProcurementValue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  const productionChart = production.slice(0, 7).map(p => ({
    name: p.product_name?.slice(0, 10),
    Target: p.quantity_target,
    Produced: p.quantity_produced,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations</h1>
          <p className="text-sm text-slate-500 mt-1">Procurement · Production · Logistics · Maintenance · Drivers</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowProdForm(true)}><Factory className="w-4 h-4 mr-1.5" />Log Production</Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowOrderForm(true)}><Plus className="w-4 h-4 mr-1.5" />New Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Approvals" value={pendingOrders} icon={Package} color="amber" subtitle="Orders awaiting" />
        <StatCard title="Delivered Orders" value={deliveredOrders} icon={Truck} color="emerald" subtitle="Completed" />
        <StatCard title="Active Production" value={activeProduction} icon={Factory} color="blue" subtitle="In progress" />
        <StatCard title="Procurement Value" value={`$${totalProcurementValue.toLocaleString()}`} icon={CheckCircle} color="indigo" subtitle="Total orders" />
      </div>

      <DepartmentTaskWidget department="Operations" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="logistics">Logistics & Drivers</TabsTrigger>
          <TabsTrigger value="general-maint">General Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="procurement" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Order #</TableHead><TableHead>Supplier</TableHead><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Total</TableHead><TableHead>Dept</TableHead><TableHead>Delivery</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {orders.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-slate-400 py-8">No orders yet</TableCell></TableRow>}
                  {orders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="text-sm font-mono">{o.order_number || "-"}</TableCell>
                      <TableCell className="text-sm font-medium">{o.supplier_name}</TableCell>
                      <TableCell className="text-sm">{o.item_description}</TableCell>
                      <TableCell className="text-sm">{o.quantity}</TableCell>
                      <TableCell className="text-sm font-medium">${(o.total_amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{o.department}</TableCell>
                      <TableCell className="text-sm">{o.delivery_date}</TableCell>
                      <TableCell><Badge className={orderStatusColors[o.status]}>{o.status}</Badge></TableCell>
                      <TableCell>
                        {o.status === "Pending Approval" && (
                          <Button variant="ghost" size="sm" className="text-emerald-600 text-xs h-7" onClick={() => approveOrder.mutate(o.id)}>
                            <CheckCircle className="w-3 h-3 mr-1" />Approve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="mt-4 space-y-4">
          {productionChart.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Production Output (Target vs Actual)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={productionChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Produced" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Product</TableHead><TableHead>Date</TableHead><TableHead>Shift</TableHead><TableHead>Target</TableHead><TableHead>Produced</TableHead><TableHead>QC Passed</TableHead><TableHead>Downtime (min)</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {production.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-8">No production logs yet</TableCell></TableRow>}
                  {production.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">{p.product_name}</TableCell>
                      <TableCell className="text-sm">{p.production_date}</TableCell>
                      <TableCell className="text-sm">{p.shift}</TableCell>
                      <TableCell className="text-sm">{p.quantity_target}</TableCell>
                      <TableCell className="text-sm">{p.quantity_produced}</TableCell>
                      <TableCell className="text-sm text-emerald-700">{p.quality_passed}</TableCell>
                      <TableCell className="text-sm">{p.downtime_minutes}</TableCell>
                      <TableCell><Badge className={productionStatusColors[p.status]}>{p.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logistics" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Fleet & Driver Management</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Vehicle</TableHead><TableHead>Reg. Number</TableHead><TableHead>Driver</TableHead><TableHead>Fuel</TableHead><TableHead>Mileage</TableHead><TableHead>Insurance Expiry</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {fleet.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">No fleet data — add vehicles in Engineering</TableCell></TableRow>}
                  {fleet.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm font-medium">{v.vehicle_name}</TableCell>
                      <TableCell className="text-sm font-mono">{v.registration_number}</TableCell>
                      <TableCell className="text-sm">{v.assigned_driver || <span className="text-slate-400">Unassigned</span>}</TableCell>
                      <TableCell className="text-sm">{v.fuel_type}</TableCell>
                      <TableCell className="text-sm">{(v.mileage || 0).toLocaleString()} km</TableCell>
                      <TableCell className="text-sm">{v.insurance_expiry}</TableCell>
                      <TableCell><Badge className={v.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{v.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general-maint" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">General Maintenance Requests</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Location</TableHead><TableHead>Assigned To</TableHead><TableHead>Cost</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {maintenance.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No requests — log requests in Engineering</TableCell></TableRow>}
                  {maintenance.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm font-medium">{m.title}</TableCell>
                      <TableCell className="text-sm">{m.engineering_type}</TableCell>
                      <TableCell className="text-sm">{m.location}</TableCell>
                      <TableCell className="text-sm">{m.assigned_to}</TableCell>
                      <TableCell className="text-sm">${(m.cost || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge className={m.status === "Completed" ? "bg-emerald-100 text-emerald-700" : m.status === "Open" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}>{m.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Form */}
      <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Procurement Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Order Number</label><Input placeholder="PO-001" value={orderForm.order_number} onChange={e => setOrderForm({ ...orderForm, order_number: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Supplier *</label><Input value={orderForm.supplier_name} onChange={e => setOrderForm({ ...orderForm, supplier_name: e.target.value })} /></div>
            </div>
            <div><label className="text-xs text-slate-500">Item Description *</label><Input value={orderForm.item_description} onChange={e => setOrderForm({ ...orderForm, item_description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-slate-500">Quantity *</label><Input type="number" value={orderForm.quantity} onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value, total_amount: String(parseFloat(e.target.value || 0) * parseFloat(orderForm.unit_price || 0)) })} /></div>
              <div><label className="text-xs text-slate-500">Unit Price ($)</label><Input type="number" value={orderForm.unit_price} onChange={e => setOrderForm({ ...orderForm, unit_price: e.target.value, total_amount: String(parseFloat(orderForm.quantity || 0) * parseFloat(e.target.value || 0)) })} /></div>
              <div><label className="text-xs text-slate-500">Total ($)</label><Input type="number" value={orderForm.total_amount} onChange={e => setOrderForm({ ...orderForm, total_amount: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Department</label><Input value={orderForm.department} onChange={e => setOrderForm({ ...orderForm, department: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Requested By</label><Input value={orderForm.requested_by} onChange={e => setOrderForm({ ...orderForm, requested_by: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Order Date</label><Input type="date" value={orderForm.order_date} onChange={e => setOrderForm({ ...orderForm, order_date: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Expected Delivery</label><Input type="date" value={orderForm.delivery_date} onChange={e => setOrderForm({ ...orderForm, delivery_date: e.target.value })} /></div>
            </div>
            <div><label className="text-xs text-slate-500">Status</label>
              <Select value={orderForm.status} onValueChange={v => setOrderForm({ ...orderForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Draft","Pending Approval","Approved","Ordered","Delivered","Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => createOrder.mutate({ ...orderForm, quantity: parseFloat(orderForm.quantity) || 0, unit_price: parseFloat(orderForm.unit_price) || 0, total_amount: parseFloat(orderForm.total_amount) || 0 })}>Create Order</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Production Form */}
      <Dialog open={showProdForm} onOpenChange={setShowProdForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Production</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Product Name *</label><Input value={prodForm.product_name} onChange={e => setProdForm({ ...prodForm, product_name: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Date *</label><Input type="date" value={prodForm.production_date} onChange={e => setProdForm({ ...prodForm, production_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-slate-500">Target Qty *</label><Input type="number" value={prodForm.quantity_target} onChange={e => setProdForm({ ...prodForm, quantity_target: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Produced</label><Input type="number" value={prodForm.quantity_produced} onChange={e => setProdForm({ ...prodForm, quantity_produced: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">QC Passed</label><Input type="number" value={prodForm.quality_passed} onChange={e => setProdForm({ ...prodForm, quality_passed: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Supervisor</label><Input value={prodForm.supervisor} onChange={e => setProdForm({ ...prodForm, supervisor: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Shift</label>
                <Select value={prodForm.shift} onValueChange={v => setProdForm({ ...prodForm, shift: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Morning","Afternoon","Night"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => createProd.mutate({ ...prodForm, quantity_target: parseFloat(prodForm.quantity_target) || 0, quantity_produced: parseFloat(prodForm.quantity_produced) || 0, quality_passed: parseFloat(prodForm.quality_passed) || 0, quality_failed: parseFloat(prodForm.quality_failed) || 0, downtime_minutes: parseFloat(prodForm.downtime_minutes) || 0 })}>Save Log</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}