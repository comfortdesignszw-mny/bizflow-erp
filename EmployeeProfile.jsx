import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function EmployeeProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const employeeId = urlParams.get("id");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => base44.entities.Employee.filter({ id: employeeId }),
    enabled: !!employeeId,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["emp-attendance", employeeId],
    queryFn: async () => {
      const emp = employees[0];
      if (!emp) return [];
      return base44.entities.Attendance.filter({ employee_id: emp.employee_id }, "-date", 30);
    },
    enabled: employees.length > 0,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["emp-tasks", employeeId],
    queryFn: async () => {
      const emp = employees[0];
      if (!emp) return [];
      return base44.entities.Task.filter({ assigned_employee_id: emp.employee_id }, "-created_date", 20);
    },
    enabled: employees.length > 0,
  });

  const emp = employees[0];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Employee not found</p>
        <Link to={createPageUrl("Employees")} className="text-indigo-600 text-sm mt-2 inline-block">Back to Employees</Link>
      </div>
    );
  }

  const statusColor = {
    Active: "bg-emerald-50 text-emerald-700",
    Inactive: "bg-slate-100 text-slate-600",
    "On Leave": "bg-amber-50 text-amber-700",
    Terminated: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="space-y-6">
      <Link to={createPageUrl("Employees")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold">
            {emp.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{emp.full_name}</h1>
              <Badge className={statusColor[emp.status]}>{emp.status}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">{emp.job_title} · {emp.department}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
              {emp.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {emp.email}</span>}
              {emp.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {emp.phone}</span>}
              {emp.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {emp.address}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <Card className="lg:col-span-1 rounded-2xl border-slate-200/60">
          <CardHeader><CardTitle className="text-sm">Employee Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Employee ID</span><span className="font-medium">{emp.employee_id}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium">{emp.employment_type}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Gender</span><span className="font-medium">{emp.gender || "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date Hired</span><span className="font-medium">{emp.date_employed ? format(new Date(emp.date_employed), "MMM d, yyyy") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Salary</span><span className="font-medium">${emp.salary?.toLocaleString() || "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">National ID</span><span className="font-medium">{emp.national_id || "—"}</span></div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="lg:col-span-1 rounded-2xl border-slate-200/60">
          <CardHeader><CardTitle className="text-sm">Recent Attendance</CardTitle></CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No attendance records</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {attendance.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-600">{a.date}</span>
                    <Badge variant="outline" className={a.status === "Present" ? "text-emerald-600" : a.status === "Late" ? "text-amber-600" : "text-rose-600"}>
                      {a.status}
                    </Badge>
                    <span className="text-slate-400 text-xs">{a.total_hours ? `${a.total_hours}h` : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="lg:col-span-1 rounded-2xl border-slate-200/60">
          <CardHeader><CardTitle className="text-sm">Assigned Tasks</CardTitle></CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No tasks assigned</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {tasks.map((t) => (
                  <div key={t.id} className="p-2 rounded-lg bg-slate-50">
                    <p className="text-sm font-medium text-slate-800">{t.task_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{t.status}</Badge>
                      <span className="text-xs text-slate-400">{t.project_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}