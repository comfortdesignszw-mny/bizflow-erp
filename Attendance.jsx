import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Search, CalendarDays } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  Present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Late: "bg-amber-50 text-amber-700 border-amber-200",
  Absent: "bg-rose-50 text-rose-700 border-rose-200",
  "Half Day": "bg-sky-50 text-sky-700 border-sky-200",
};

export default function Attendance() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ["attendance", dateFilter],
    queryFn: () => dateFilter
      ? base44.entities.Attendance.filter({ date: dateFilter }, "-created_date", 500)
      : base44.entities.Attendance.list("-created_date", 500),
  });

  const filtered = attendance.filter((a) => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchSearch = !search || a.employee_name?.toLowerCase().includes(search.toLowerCase()) || a.employee_id?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const presentCount = attendance.filter(a => a.status === "Present").length;
  const lateCount = attendance.filter(a => a.status === "Late").length;
  const absentCount = attendance.filter(a => a.status === "Absent").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track daily employee attendance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{attendance.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Records</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200/60 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{presentCount}</p>
          <p className="text-xs text-emerald-600 mt-1">Present</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200/60 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{lateCount}</p>
          <p className="text-xs text-amber-600 mt-1">Late</p>
        </div>
        <div className="bg-rose-50 rounded-xl border border-rose-200/60 p-4 text-center">
          <p className="text-2xl font-bold text-rose-700">{absentCount}</p>
          <p className="text-xs text-rose-600 mt-1">Absent</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9 rounded-lg text-sm" />
          </div>
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-40 h-9 rounded-lg text-sm" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9 rounded-lg text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Present">Present</SelectItem>
              <SelectItem value="Late">Late</SelectItem>
              <SelectItem value="Absent">Absent</SelectItem>
              <SelectItem value="Half Day">Half Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-medium">Employee</TableHead>
                <TableHead className="text-xs font-medium">Date</TableHead>
                <TableHead className="text-xs font-medium">Time In</TableHead>
                <TableHead className="text-xs font-medium">Time Out</TableHead>
                <TableHead className="text-xs font-medium">Hours</TableHead>
                <TableHead className="text-xs font-medium">Overtime</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(7).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No attendance records for this date
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{a.employee_name || a.employee_id}</p>
                        <p className="text-xs text-slate-400">{a.employee_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{a.date}</TableCell>
                    <TableCell className="text-sm text-slate-600">{a.time_in || "—"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{a.time_out || "—"}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-800">{a.total_hours ? `${a.total_hours}h` : "—"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{a.overtime_hours ? `${a.overtime_hours}h` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[a.status]}>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}