import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TaskCard from "../components/tasks/TaskCard";
import TaskFormModal from "../components/tasks/TaskFormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Kanban } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { key: "To Do", label: "To Do", color: "border-t-slate-400", badge: "bg-slate-100 text-slate-600" },
  { key: "In Progress", label: "In Progress", color: "border-t-blue-500", badge: "bg-blue-100 text-blue-700" },
  { key: "Review", label: "Review", color: "border-t-amber-500", badge: "bg-amber-100 text-amber-700" },
  { key: "Done", label: "Done", color: "border-t-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
];

const DEPARTMENTS = [
  "All", "Accounting", "Engineering", "Finance", "HR", "IT", "Legal",
  "Marketing", "Operations", "Procurement", "Sales", "Support", "Executive",
];

export default function Tasks() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Read dept from URL
  const urlDept = new URLSearchParams(window.location.search).get("dept");
  useEffect(() => { if (urlDept) setDeptFilter(urlDept); }, [urlDept]);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks-board"],
    queryFn: () => base44.entities.Task.list("-created_date", 500),
  });

  const createTask = useMutation({
    mutationFn: d => base44.entities.Task.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks-board"] }); qc.invalidateQueries({ queryKey: ["tasks-dept"] }); setModalOpen(false); toast.success("Task created"); },
  });
  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks-board"] }); qc.invalidateQueries({ queryKey: ["tasks-dept"] }); setModalOpen(false); toast.success("Task updated"); },
  });
  const deleteTask = useMutation({
    mutationFn: id => base44.entities.Task.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks-board"] }); qc.invalidateQueries({ queryKey: ["tasks-dept"] }); setModalOpen(false); setSelectedTask(null); toast.success("Task deleted"); },
  });

  const filtered = useMemo(() => tasks.filter(t => {
    const matchSearch = !search || t.task_name?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || t.department === deptFilter;
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchSearch && matchDept && matchPriority;
  }), [tasks, search, deptFilter, priorityFilter]);

  const handleSave = (form) => {
    const data = { ...form };
    if (data.project_id === "none") { data.project_id = ""; data.project_name = ""; }
    if (data.assigned_employee_id === "unassigned") { data.assigned_employee_id = ""; data.assigned_employee_name = ""; }
    if (selectedTask?.id) updateTask.mutate({ id: selectedTask.id, data });
    else createTask.mutate(data);
  };

  const openCreate = () => { setSelectedTask(null); setModalOpen(true); };
  const openEdit = (task) => { setSelectedTask(task); setModalOpen(true); };

  return (
    <div className="space-y-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Kanban className="w-6 h-6 text-indigo-600" /> Task Board
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Create, assign and track tasks across all departments</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" /> New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d === "All" ? "All Departments" : d}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Low", "Medium", "High", "Critical"].map(p => <SelectItem key={p} value={p}>{p === "All" ? "All Priorities" : p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs text-slate-500">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</Badge>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pb-6">
        {COLUMNS.map(col => (
          <div key={col.key} className="flex flex-col">
            {/* Column header */}
            <div className={cn("bg-white rounded-t-xl border border-b-0 border-slate-200 border-t-4 px-3 py-2.5 flex items-center justify-between", col.color)}>
              <span className="text-sm font-semibold text-slate-700">{col.label}</span>
              <Badge className={cn("text-xs", col.badge)}>{filtered.filter(t => t.status === col.key).length}</Badge>
            </div>

            {/* Column body */}
            <div className="bg-slate-50/70 border border-t-0 border-slate-200 rounded-b-xl p-2.5 flex-1 min-h-[200px] space-y-2.5">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
                </div>
              ) : filtered.filter(t => t.status === col.key).length === 0 ? (
                <div className="flex items-center justify-center h-24 text-slate-300 text-xs">No tasks</div>
              ) : (
                filtered.filter(t => t.status === col.key).map(task => (
                  <TaskCard key={task.id} task={task} onClick={openEdit} />
                ))
              )}

              {/* Add task shortcut */}
              <button
                onClick={openCreate}
                className="w-full text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg py-1.5 transition-colors border border-dashed border-slate-200 hover:border-indigo-300"
              >
                + Add task
              </button>
            </div>
          </div>
        ))}
      </div>

      <TaskFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedTask(null); }}
        onSave={handleSave}
        onDelete={(id) => deleteTask.mutate(id)}
        initialTask={selectedTask}
      />
    </div>
  );
}