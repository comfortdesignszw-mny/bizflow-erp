import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { QrCode, LogIn, LogOut, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import QRScanner from "../components/accesscontrol/QRScanner";

export default function AccessControl() {
  const [showScan, setShowScan] = useState(false);
  const [scanForm, setScanForm] = useState({ employee_id: "", scan_type: "IN", location: "Main Entrance" });
  const [saving, setSaving] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const queryClient = useQueryClient();

  const { data: accessLogs = [], isLoading } = useQuery({
    queryKey: ["access-logs"],
    queryFn: () => base44.entities.AccessLog.list("-created_date", 200),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.filter({ status: "Active" }, "-created_date", 500),
  });

  const todayLogs = accessLogs.filter(l => {
    const today = new Date().toISOString().split("T")[0];
    return l.scan_time?.startsWith(today);
  });
  
  const checkIns = todayLogs.filter(l => l.scan_type === "IN").length;
  const checkOuts = todayLogs.filter(l => l.scan_type === "OUT").length;
  const currentlyInside = Math.max(0, checkIns - checkOuts);

  const handleScan = async () => {
    setSaving(true);
    const emp = employees.find(e => e.employee_id === scanForm.employee_id);
    await base44.entities.AccessLog.create({
      ...scanForm,
      employee_name: emp?.full_name || scanForm.employee_id,
      scan_time: new Date().toISOString(),
      device_id: "WEB-SCANNER",
    });

    // Auto-create attendance record if IN scan
    if (scanForm.scan_type === "IN") {
      const today = new Date().toISOString().split("T")[0];
      const existing = await base44.entities.Attendance.filter({ employee_id: scanForm.employee_id, date: today });
      if (existing.length === 0) {
        const now = new Date();
        const timeIn = now.toTimeString().split(" ")[0].slice(0, 5);
        const isLate = now.getHours() >= 9;
        await base44.entities.Attendance.create({
          employee_id: scanForm.employee_id,
          employee_name: emp?.full_name || scanForm.employee_id,
          date: today,
          time_in: timeIn,
          status: isLate ? "Late" : "Present",
        });
      }
    }

    // If OUT scan, update attendance
    if (scanForm.scan_type === "OUT") {
      const today = new Date().toISOString().split("T")[0];
      const records = await base44.entities.Attendance.filter({ employee_id: scanForm.employee_id, date: today });
      if (records.length > 0) {
        const now = new Date();
        const timeOut = now.toTimeString().split(" ")[0].slice(0, 5);
        const timeIn = records[0].time_in;
        let totalHours = 0;
        if (timeIn) {
          const [h1, m1] = timeIn.split(":").map(Number);
          const [h2, m2] = timeOut.split(":").map(Number);
          totalHours = Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 10) / 10;
        }
        const overtime = Math.max(0, totalHours - 8);
        await base44.entities.Attendance.update(records[0].id, { time_out: timeOut, total_hours: totalHours, overtime_hours: overtime });
      }
    }

    queryClient.invalidateQueries({ queryKey: ["access-logs"] });
    queryClient.invalidateQueries({ queryKey: ["attendance"] });
    setSaving(false);
    setShowScan(false);
    setScanForm({ employee_id: "", scan_type: "IN", location: "Main Entrance" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Access Control</h1>
          <p className="text-sm text-slate-500 mt-0.5">QR-based employee access tracking</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCameraScanner(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
            <Camera className="w-4 h-4" /> Camera Scan
          </Button>
          <Button onClick={() => setShowScan(true)} variant="outline" className="rounded-xl gap-2">
            <QrCode className="w-4 h-4" /> Manual
          </Button>
        </div>
      </div>

      {/* Presence Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Staff</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-emerald-200/60 bg-emerald-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{currentlyInside}</p>
            <p className="text-xs text-emerald-600 mt-1">Currently Inside</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-sky-200/60 bg-sky-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-sky-700">{checkIns}</p>
            <p className="text-xs text-sky-600 mt-1">Check-ins Today</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-amber-200/60 bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{checkOuts}</p>
            <p className="text-xs text-amber-600 mt-1">Check-outs Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Access Logs */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Access Log History</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-medium">Employee</TableHead>
                <TableHead className="text-xs font-medium">Type</TableHead>
                <TableHead className="text-xs font-medium">Time</TableHead>
                <TableHead className="text-xs font-medium">Location</TableHead>
                <TableHead className="text-xs font-medium">Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>)}
                  </TableRow>
                ))
              ) : accessLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm">No access logs</TableCell>
                </TableRow>
              ) : (
                accessLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-slate-800">{log.employee_name || log.employee_id}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={log.scan_type === "IN" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}>
                        {log.scan_type === "IN" ? <LogIn className="w-3 h-3 mr-1" /> : <LogOut className="w-3 h-3 mr-1" />}
                        {log.scan_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {log.scan_time ? new Date(log.scan_time).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{log.location || "—"}</TableCell>
                    <TableCell className="text-sm text-slate-400">{log.device_id || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Camera QR Scanner Dialog */}
      <Dialog open={showCameraScanner} onOpenChange={(o) => { if (!o) setShowCameraScanner(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600" /> Camera QR Scanner
            </DialogTitle>
          </DialogHeader>
          <QRScanner
            employees={employees}
            onScanned={() => {
              queryClient.invalidateQueries({ queryKey: ["access-logs"] });
              queryClient.invalidateQueries({ queryKey: ["attendance"] });
            }}
            onClose={() => setShowCameraScanner(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Scan Dialog */}
      <Dialog open={showScan} onOpenChange={setShowScan}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Simulate QR Scan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Employee</Label>
              <Select value={scanForm.employee_id} onValueChange={(v) => setScanForm(prev => ({ ...prev, employee_id: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.employee_id}>{e.full_name} ({e.employee_id})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Scan Type</Label>
              <Select value={scanForm.scan_type} onValueChange={(v) => setScanForm(prev => ({ ...prev, scan_type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Check In</SelectItem>
                  <SelectItem value="OUT">Check Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input value={scanForm.location} onChange={(e) => setScanForm(prev => ({ ...prev, location: e.target.value }))} className="h-9 text-sm" />
            </div>
            <Button onClick={handleScan} disabled={!scanForm.employee_id || saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Processing..." : "Process Scan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}