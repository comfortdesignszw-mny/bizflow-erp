import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Plus, Search, FileText, CheckCircle, Download } from "lucide-react";
import usePayslipDownload from "@/components/payroll/PayslipPDF";

export default function Payroll() {
  const downloadPayslip = usePayslipDownload();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const queryClient = useQueryClient();

  const { data: payrolls = [], isLoading } = useQuery({
    queryKey: ["payrolls"],
    queryFn: () => base44.entities.Payroll.list("-created_date", 500),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active"],
    queryFn: () => base44.entities.Employee.filter({ status: "Active" }, "-created_date", 500),
  });

  const [form, setForm] = useState({
    employee_id: "", month: new Date().toISOString().slice(0, 7),
    basic_salary: "", overtime_pay: 0, allowances: 0, deductions: 0, tax: 0,
  });

  const filtered = payrolls.filter((p) => {
    const matchSearch = !search || p.employee_name?.toLowerCase().includes(search.toLowerCase());
    const matchMonth = !monthFilter || p.month === monthFilter;
    return matchSearch && matchMonth;
  });

  const totalNet = filtered.reduce((sum, p) => sum + (p.net_salary || 0), 0);
  const totalPaid = filtered.filter(p => p.payment_status === "Paid").reduce((sum, p) => sum + (p.net_salary || 0), 0);

  const handleSave = async () => {
    const emp = employees.find(e => e.employee_id === form.employee_id);
    const basic = Number(form.basic_salary) || 0;
    const overtime = Number(form.overtime_pay) || 0;
    const allowances = Number(form.allowances) || 0;
    const deductions = Number(form.deductions) || 0;
    const tax = Number(form.tax) || 0;
    const net = basic + overtime + allowances - deductions - tax;

    await base44.entities.Payroll.create({
      employee_id: form.employee_id,
      employee_name: emp?.full_name || form.employee_id,
      month: form.month,
      basic_salary: basic,
      overtime_pay: overtime,
      allowances,
      deductions,
      tax,
      net_salary: net,
      payment_status: "Pending",
    });
    queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    setShowForm(false);
    setForm({ employee_id: "", month: new Date().toISOString().slice(0, 7), basic_salary: "", overtime_pay: 0, allowances: 0, deductions: 0, tax: 0 });
  };

  const handleAutoFill = () => {
    const emp = employees.find(e => e.employee_id === form.employee_id);
    if (emp) setForm(prev => ({ ...prev, basic_salary: emp.salary || 0 }));
  };

  const markAsPaid = async (id) => {
    await base44.entities.Payroll.update(id, { payment_status: "Paid", payment_date: new Date().toISOString().split("T")[0] });
    queryClient.invalidateQueries({ queryKey: ["payrolls"] });
  };

  const statusColors = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Failed: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage employee salaries and payments</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Payroll
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/60 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Net Pay</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">${totalNet.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200/60 p-4">
          <p className="text-xs text-emerald-600 uppercase tracking-wider">Paid</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200/60 p-4">
          <p className="text-xs text-amber-600 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">${(totalNet - totalPaid).toLocaleString()}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9 rounded-lg text-sm" />
          </div>
          <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-40 h-9 rounded-lg text-sm" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-medium">Employee</TableHead>
                <TableHead className="text-xs font-medium">Month</TableHead>
                <TableHead className="text-xs font-medium">Basic</TableHead>
                <TableHead className="text-xs font-medium">Overtime</TableHead>
                <TableHead className="text-xs font-medium">Deductions</TableHead>
                <TableHead className="text-xs font-medium">Net Salary</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium w-24">Payslip</TableHead>
                <TableHead className="text-xs font-medium w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(8).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>)}</TableRow>)
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400 text-sm">No payroll records</TableCell></TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><p className="text-sm font-medium text-slate-800">{p.employee_name}</p></TableCell>
                    <TableCell className="text-sm text-slate-600">{p.month}</TableCell>
                    <TableCell className="text-sm text-slate-600">${p.basic_salary?.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-slate-600">${p.overtime_pay?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-sm text-slate-600">${((p.deductions || 0) + (p.tax || 0)).toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-semibold text-slate-900">${p.net_salary?.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[p.payment_status]}>{p.payment_status}</Badge></TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const emp = employees.find(e => e.employee_id === p.employee_id);
                          downloadPayslip({ ...p, department: emp?.department || "", job_title: emp?.job_title || "" });
                        }}
                        className="h-7 text-xs gap-1.5 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </Button>
                    </TableCell>
                    <TableCell>
                      {p.payment_status === "Pending" && (
                        <Button variant="ghost" size="sm" onClick={() => markAsPaid(p.id)} className="text-emerald-600 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" /> Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Payroll Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Payroll Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Employee</Label>
              <Select value={form.employee_id} onValueChange={(v) => { setForm(prev => ({ ...prev, employee_id: v })); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.employee_id}>{e.full_name}</SelectItem>)}</SelectContent>
              </Select>
              {form.employee_id && <Button type="button" variant="link" size="sm" className="text-xs p-0 h-auto" onClick={handleAutoFill}>Auto-fill salary</Button>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Month</Label>
              <Input type="month" value={form.month} onChange={(e) => setForm(prev => ({ ...prev, month: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Basic Salary</Label><Input type="number" value={form.basic_salary} onChange={(e) => setForm(prev => ({ ...prev, basic_salary: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Overtime Pay</Label><Input type="number" value={form.overtime_pay} onChange={(e) => setForm(prev => ({ ...prev, overtime_pay: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Allowances</Label><Input type="number" value={form.allowances} onChange={(e) => setForm(prev => ({ ...prev, allowances: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Deductions</Label><Input type="number" value={form.deductions} onChange={(e) => setForm(prev => ({ ...prev, deductions: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Tax</Label><Input type="number" value={form.tax} onChange={(e) => setForm(prev => ({ ...prev, tax: e.target.value }))} className="h-9 text-sm" /></div>
            </div>
            <Button onClick={handleSave} disabled={!form.employee_id || !form.basic_salary} className="w-full bg-indigo-600 hover:bg-indigo-700">Save Payroll</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}