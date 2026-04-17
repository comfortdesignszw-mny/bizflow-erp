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
import { Plus, Wrench, Car, Cpu, Zap, AlertTriangle, CheckCircle, Monitor } from "lucide-react";
import DepartmentTaskWidget from "../components/tasks/DepartmentTaskWidget";
import { toast } from "sonner";

const statusColors = {
  Open: "bg-red-100 text-red-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  "On Hold": "bg-amber-100 text-amber-700",
};
const priorityColors = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};
const assetStatusColors = {
  Active: "bg-emerald-100 text-emerald-700",
  "In Repair": "bg-amber-100 text-amber-700",
  Retired: "bg-slate-100 text-slate-600",
  Lost: "bg-red-100 text-red-700",
};
const vehicleStatusColors = {
  Active: "bg-emerald-100 text-emerald-700",
  "In Service": "bg-blue-100 text-blue-700",
  "Out of Order": "bg-red-100 text-red-700",
  Retired: "bg-slate-100 text-slate-600",
};

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = { red: "from-red-500 to-red-600", blue: "from-blue-500 to-blue-600", emerald: "from-emerald-500 to-emerald-600", violet: "from-violet-500 to-violet-600", amber: "from-amber-500 to-amber-600" };
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

const emptyMaintenance = { title: "", description: "", engineering_type: "Mechanical", category: "", location: "", reported_by: "", assigned_to: "", priority: "Medium", status: "Open", due_date: "", cost: "" };
const emptyVehicle = { vehicle_name: "", registration_number: "", make: "", model: "", year: "", assigned_driver: "", fuel_type: "Petrol", mileage: "", last_service_date: "", next_service_date: "", insurance_expiry: "", status: "Active" };
const emptyAsset = { asset_name: "", asset_type: "Computer", serial_number: "", assigned_to: "", department: "", purchase_date: "", warranty_expiry: "", condition: "Good", status: "Active", notes: "" };

export default function Engineering() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [maintForm, setMaintForm] = useState(emptyMaintenance);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [assetForm, setAssetForm] = useState(emptyAsset);

  const { data: maintenance = [] } = useQuery({ queryKey: ["maintenance"], queryFn: () => base44.entities.MaintenanceRequest.list("-created_date", 200) });
  const { data: fleet = [] } = useQuery({ queryKey: ["fleet"], queryFn: () => base44.entities.FleetVehicle.list("-created_date", 100) });
  const { data: assets = [] } = useQuery({ queryKey: ["it-assets"], queryFn: () => base44.entities.ITAsset.list("-created_date", 200) });

  const createMaint = useMutation({ mutationFn: d => base44.entities.MaintenanceRequest.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["maintenance"] }); setShowMaintForm(false); setMaintForm(emptyMaintenance); toast.success("Request submitted"); } });
  const createVehicle = useMutation({ mutationFn: d => base44.entities.FleetVehicle.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["fleet"] }); setShowVehicleForm(false); setVehicleForm(emptyVehicle); toast.success("Vehicle added"); } });
  const createAsset = useMutation({ mutationFn: d => base44.entities.ITAsset.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["it-assets"] }); setShowAssetForm(false); setAssetForm(emptyAsset); toast.success("Asset registered"); } });

  const openRequests = maintenance.filter(m => m.status === "Open").length;
  const criticalRequests = maintenance.filter(m => m.priority === "Critical").length;
  const activeVehicles = fleet.filter(v => v.status === "Active").length;
  const activeAssets = assets.filter(a => a.status === "Active").length;

  const maintByType = [
    { name: "Mechanical", value: maintenance.filter(m => m.engineering_type === "Mechanical").length, fill: "#f59e0b" },
    { name: "Electrical", value: maintenance.filter(m => m.engineering_type === "Electrical").length, fill: "#3b82f6" },
    { name: "Tech/IT", value: maintenance.filter(m => m.engineering_type === "Tech/IT").length, fill: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Engineering</h1>
          <p className="text-sm text-slate-500 mt-1">Mechanical · Electrical · Tech/IT — Maintenance & Asset Management</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowAssetForm(true)}><Monitor className="w-4 h-4 mr-1.5" />Add IT Asset</Button>
          <Button size="sm" variant="outline" onClick={() => setShowVehicleForm(true)}><Car className="w-4 h-4 mr-1.5" />Add Vehicle</Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowMaintForm(true)}><Plus className="w-4 h-4 mr-1.5" />New Request</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Open Requests" value={openRequests} icon={AlertTriangle} color="red" subtitle="Need attention" />
        <StatCard title="Critical Issues" value={criticalRequests} icon={Wrench} color="amber" subtitle="High priority" />
        <StatCard title="Active Fleet" value={activeVehicles} icon={Car} color="blue" subtitle="Vehicles" />
        <StatCard title="IT Assets" value={activeAssets} icon={Cpu} color="violet" subtitle="Active" />
      </div>

      <DepartmentTaskWidget department="Engineering" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mechanical">Mechanical (Fleet)</TabsTrigger>
          <TabsTrigger value="electrical">Electrical</TabsTrigger>
          <TabsTrigger value="tech">Tech / IT</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Requests by Engineering Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={maintByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {maintByType.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Legend /><Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">All Maintenance Requests</CardTitle></CardHeader>
              <CardContent className="p-0 max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50"><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {maintenance.slice(0, 8).map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm font-medium">{m.title}</TableCell>
                        <TableCell className="text-xs">{m.engineering_type}</TableCell>
                        <TableCell><Badge className={priorityColors[m.priority]}>{m.priority}</Badge></TableCell>
                        <TableCell><Badge className={statusColors[m.status]}>{m.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mechanical" className="mt-4 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-3"><CardTitle className="text-sm font-semibold text-slate-700">Fleet Management</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Vehicle</TableHead><TableHead>Reg. Number</TableHead><TableHead>Make/Model</TableHead><TableHead>Driver</TableHead><TableHead>Fuel</TableHead><TableHead>Next Service</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {fleet.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">No vehicles registered yet</TableCell></TableRow>}
                  {fleet.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm font-medium">{v.vehicle_name}</TableCell>
                      <TableCell className="text-sm font-mono">{v.registration_number}</TableCell>
                      <TableCell className="text-sm">{v.make} {v.model}</TableCell>
                      <TableCell className="text-sm">{v.assigned_driver}</TableCell>
                      <TableCell className="text-sm">{v.fuel_type}</TableCell>
                      <TableCell className="text-sm">{v.next_service_date}</TableCell>
                      <TableCell><Badge className={vehicleStatusColors[v.status]}>{v.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Mechanical Maintenance Requests</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Title</TableHead><TableHead>Location</TableHead><TableHead>Assigned To</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Cost</TableHead></TableRow></TableHeader>
                <TableBody>
                  {maintenance.filter(m => m.engineering_type === "Mechanical").map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm font-medium">{m.title}</TableCell>
                      <TableCell className="text-sm">{m.location}</TableCell>
                      <TableCell className="text-sm">{m.assigned_to}</TableCell>
                      <TableCell><Badge className={priorityColors[m.priority]}>{m.priority}</Badge></TableCell>
                      <TableCell><Badge className={statusColors[m.status]}>{m.status}</Badge></TableCell>
                      <TableCell className="text-sm">${(m.cost || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="electrical" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Electrical Maintenance</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Location</TableHead><TableHead>Assigned To</TableHead><TableHead>Due Date</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {maintenance.filter(m => m.engineering_type === "Electrical").length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">No electrical requests</TableCell></TableRow>
                  )}
                  {maintenance.filter(m => m.engineering_type === "Electrical").map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm font-medium">{m.title}</TableCell>
                      <TableCell className="text-sm">{m.category}</TableCell>
                      <TableCell className="text-sm">{m.location}</TableCell>
                      <TableCell className="text-sm">{m.assigned_to}</TableCell>
                      <TableCell className="text-sm">{m.due_date}</TableCell>
                      <TableCell><Badge className={priorityColors[m.priority]}>{m.priority}</Badge></TableCell>
                      <TableCell><Badge className={statusColors[m.status]}>{m.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tech" className="mt-4 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">IT Asset Register</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Asset</TableHead><TableHead>Type</TableHead><TableHead>Serial</TableHead><TableHead>Assigned To</TableHead><TableHead>Department</TableHead><TableHead>Condition</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assets.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">No IT assets registered</TableCell></TableRow>}
                  {assets.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-medium">{a.asset_name}</TableCell>
                      <TableCell className="text-sm">{a.asset_type}</TableCell>
                      <TableCell className="text-sm font-mono text-xs">{a.serial_number}</TableCell>
                      <TableCell className="text-sm">{a.assigned_to}</TableCell>
                      <TableCell className="text-sm">{a.department}</TableCell>
                      <TableCell className="text-sm">{a.condition}</TableCell>
                      <TableCell><Badge className={assetStatusColors[a.status]}>{a.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Tech/IT Maintenance Requests</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Assigned To</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {maintenance.filter(m => m.engineering_type === "Tech/IT").map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm font-medium">{m.title}</TableCell>
                      <TableCell className="text-sm">{m.category}</TableCell>
                      <TableCell className="text-sm">{m.assigned_to}</TableCell>
                      <TableCell><Badge className={priorityColors[m.priority]}>{m.priority}</Badge></TableCell>
                      <TableCell><Badge className={statusColors[m.status]}>{m.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Maintenance Form */}
      <Dialog open={showMaintForm} onOpenChange={setShowMaintForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Maintenance Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs text-slate-500">Title *</label><Input value={maintForm.title} onChange={e => setMaintForm({ ...maintForm, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Engineering Type</label>
                <Select value={maintForm.engineering_type} onValueChange={v => setMaintForm({ ...maintForm, engineering_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Mechanical">Mechanical</SelectItem><SelectItem value="Electrical">Electrical</SelectItem><SelectItem value="Tech/IT">Tech/IT</SelectItem></SelectContent>
                </Select>
              </div>
              <div><label className="text-xs text-slate-500">Priority</label>
                <Select value={maintForm.priority} onValueChange={v => setMaintForm({ ...maintForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Low","Medium","High","Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Category</label><Input placeholder="e.g. HVAC, Wiring, Server" value={maintForm.category} onChange={e => setMaintForm({ ...maintForm, category: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Location</label><Input value={maintForm.location} onChange={e => setMaintForm({ ...maintForm, location: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Reported By</label><Input value={maintForm.reported_by} onChange={e => setMaintForm({ ...maintForm, reported_by: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Assigned To</label><Input value={maintForm.assigned_to} onChange={e => setMaintForm({ ...maintForm, assigned_to: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Due Date</label><Input type="date" value={maintForm.due_date} onChange={e => setMaintForm({ ...maintForm, due_date: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Est. Cost ($)</label><Input type="number" value={maintForm.cost} onChange={e => setMaintForm({ ...maintForm, cost: e.target.value })} /></div>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => createMaint.mutate({ ...maintForm, cost: parseFloat(maintForm.cost) || 0 })}>Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Form */}
      <Dialog open={showVehicleForm} onOpenChange={setShowVehicleForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Register Vehicle</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Vehicle Name *</label><Input value={vehicleForm.vehicle_name} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_name: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Registration Number *</label><Input value={vehicleForm.registration_number} onChange={e => setVehicleForm({ ...vehicleForm, registration_number: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-slate-500">Make</label><Input value={vehicleForm.make} onChange={e => setVehicleForm({ ...vehicleForm, make: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Model</label><Input value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Year</label><Input value={vehicleForm.year} onChange={e => setVehicleForm({ ...vehicleForm, year: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Assigned Driver</label><Input value={vehicleForm.assigned_driver} onChange={e => setVehicleForm({ ...vehicleForm, assigned_driver: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Fuel Type</label>
                <Select value={vehicleForm.fuel_type} onValueChange={v => setVehicleForm({ ...vehicleForm, fuel_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Petrol","Diesel","Electric","Hybrid"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Last Service</label><Input type="date" value={vehicleForm.last_service_date} onChange={e => setVehicleForm({ ...vehicleForm, last_service_date: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Next Service</label><Input type="date" value={vehicleForm.next_service_date} onChange={e => setVehicleForm({ ...vehicleForm, next_service_date: e.target.value })} /></div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => createVehicle.mutate({ ...vehicleForm, mileage: parseFloat(vehicleForm.mileage) || 0 })}>Register Vehicle</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* IT Asset Form */}
      <Dialog open={showAssetForm} onOpenChange={setShowAssetForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Register IT Asset</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Asset Name *</label><Input value={assetForm.asset_name} onChange={e => setAssetForm({ ...assetForm, asset_name: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Asset Type</label>
                <Select value={assetForm.asset_type} onValueChange={v => setAssetForm({ ...assetForm, asset_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Computer","Printer","Server","Network Device","CCTV","Phone","Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Serial Number</label><Input value={assetForm.serial_number} onChange={e => setAssetForm({ ...assetForm, serial_number: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Assigned To</label><Input value={assetForm.assigned_to} onChange={e => setAssetForm({ ...assetForm, assigned_to: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500">Department</label><Input value={assetForm.department} onChange={e => setAssetForm({ ...assetForm, department: e.target.value })} /></div>
              <div><label className="text-xs text-slate-500">Condition</label>
                <Select value={assetForm.condition} onValueChange={v => setAssetForm({ ...assetForm, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Excellent","Good","Fair","Poor"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={() => createAsset.mutate(assetForm)}>Register Asset</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}