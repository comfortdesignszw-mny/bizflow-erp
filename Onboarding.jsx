import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, BookOpen, CalendarDays, Monitor, Search, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const TASK_META = {
  welcome_email:   { label: "Welcome Email",    icon: Mail,         color: "text-cyan-600",   bg: "bg-cyan-50",   border: "border-cyan-200" },
  training_modules:{ label: "Training Modules", icon: BookOpen,     color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
  welcome_meeting: { label: "Welcome Meeting",  icon: CalendarDays, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  it_equipment:    { label: "IT Equipment",     icon: Monitor,      color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const TASK_ORDER = ["welcome_email", "training_modules", "welcome_meeting", "it_equipment"];

export default function Onboarding() {
  const [search, setSearch] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["onboarding-tasks"],
    queryFn: () => base44.entities.OnboardingTask.list("-created_date", 500),
  });

  // Group by employee
  const byEmployee = tasks.reduce((acc, task) => {
    const key = task.employee_id;
    if (!acc[key]) acc[key] = { employee_id: key, employee_name: task.employee_name, employee_job_title: task.employee_job_title, employee_department: task.employee_department, tasks: {} };
    acc[key].tasks[task.task_type] = task;
    return acc;
  }, {});

  const employees = Object.values(byEmployee).filter(e =>
    !search || e.employee_name?.toLowerCase().includes(search.toLowerCase()) || e.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  const completedCount = (emp) => TASK_ORDER.filter(k => emp.tasks[k]?.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employee Onboarding</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track onboarding progress for all new employees</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {TASK_ORDER.map(key => {
          const meta = TASK_META[key];
          const Icon = meta.icon;
          const count = tasks.filter(t => t.task_type === key && t.status === "completed").length;
          return (
            <div key={key} className={`${meta.bg} ${meta.border} border rounded-2xl p-4`}>
              <Icon className={`w-5 h-5 ${meta.color} mb-2`} />
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{meta.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search employee..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 rounded-xl text-sm border-slate-200"
        />
      </div>

      {/* Employee cards */}
      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No onboarding records yet</p>
          <p className="text-sm mt-1">Records appear automatically when you add a new employee</p>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map(emp => {
            const done = completedCount(emp);
            const pct = Math.round((done / 4) * 100);
            return (
              <Card key={emp.employee_id} className="rounded-2xl border-slate-200/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                        {emp.employee_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{emp.employee_name}</p>
                        <p className="text-xs text-slate-500">{emp.employee_job_title} · {emp.employee_department}</p>
                        <p className="text-xs text-slate-400 font-mono">{emp.employee_id}</p>
                      </div>
                    </div>
                    <Badge className={pct === 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                      {pct === 100 ? "Complete" : `${done}/4 done`}
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TASK_ORDER.map(key => {
                      const meta = TASK_META[key];
                      const Icon = meta.icon;
                      const task = emp.tasks[key];
                      const status = task?.status || "pending";
                      return (
                        <div
                          key={key}
                          className={`rounded-xl p-2.5 border text-center ${status === "completed" ? `${meta.bg} ${meta.border}` : status === "failed" ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}
                        >
                          <div className="flex justify-center mb-1">
                            {status === "completed" ? <CheckCircle2 className={`w-4 h-4 ${meta.color}`} /> : status === "failed" ? <XCircle className="w-4 h-4 text-rose-500" /> : <Clock className="w-4 h-4 text-slate-300" />}
                          </div>
                          <p className={`text-xs font-medium ${status === "completed" ? meta.color : status === "failed" ? "text-rose-600" : "text-slate-400"}`}>{meta.label}</p>
                          {task?.created_date && (
                            <p className="text-xs text-slate-400 mt-0.5">{format(new Date(task.created_date), "MMM d")}</p>
                          )}
                          {task?.notes && (
                            <details className="mt-1 text-left">
                              <summary className={`text-xs cursor-pointer ${meta.color}`}>Notes</summary>
                              <pre className="mt-1 text-xs text-slate-500 whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">{task.notes}</pre>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}