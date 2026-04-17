import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusIcons = {
  "To Do": <Circle className="w-4 h-4 text-slate-400" />,
  "In Progress": <Clock className="w-4 h-4 text-indigo-500" />,
  "Completed": <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
};

const priorityColors = {
  Low: "bg-slate-50 text-slate-600",
  Medium: "bg-sky-50 text-sky-700",
  High: "bg-amber-50 text-amber-700",
  Critical: "bg-rose-50 text-rose-700",
};

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ task_name: "", assigned_employee_id: "", priority: "Medium", deadline: "", status: "To Do" });
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }),
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }, "-created_date", 200),
    enabled: !!projectId,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active"],
    queryFn: () => base44.entities.Employee.filter({ status: "Active" }, "full_name", 500),
  });

  const project = projects[0];

  const handleSaveTask = async () => {
    const emp = employees.find(e => e.employee_id === taskForm.assigned_employee_id);
    await base44.entities.Task.create({
      ...taskForm,
      project_id: projectId,
      project_name: project?.project_name || "",
      assigned_employee_name: emp?.full_name || "",
    });
    queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
    setShowTaskForm(false);
    setTaskForm({ task_name: "", assigned_employee_id: "", priority: "Medium", deadline: "", status: "To Do" });
  };

  const updateTaskStatus = async (taskId, status) => {
    await base44.entities.Task.update(taskId, { status });
    queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
  };

  if (!project) return (
    <div className="text-center py-20">
      <p className="text-slate-400">Project not found</p>
      <Link to={createPageUrl("Projects")} className="text-indigo-600 text-sm mt-2 inline-block">Back to Projects</Link>
    </div>
  );

  const todoTasks = tasks.filter(t => t.status === "To Do");
  const inProgress = tasks.filter(t => t.status === "In Progress");
  const completed = tasks.filter(t => t.status === "Completed");

  const TaskColumn = ({ title, items, icon }) => (
    <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <Badge variant="outline" className="ml-auto text-xs">{items.length}</Badge>
      </div>
      <div className="p-3 space-y-2 flex-1 min-h-[200px]">
        {items.map(task => (
          <div key={task.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-shadow">
            <p className="text-sm font-medium text-slate-800">{task.task_name}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <Badge className={`${priorityColors[task.priority]} text-xs`}>{task.priority}</Badge>
                {task.deadline && <span className="text-xs text-slate-400 flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {task.deadline}</span>}
              </div>
            </div>
            {task.assigned_employee_name && <p className="text-xs text-slate-400 mt-1.5">{task.assigned_employee_name}</p>}
            <div className="flex gap-1 mt-2">
              {task.status !== "To Do" && <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => updateTaskStatus(task.id, "To Do")}>To Do</Button>}
              {task.status !== "In Progress" && <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => updateTaskStatus(task.id, "In Progress")}>In Progress</Button>}
              {task.status !== "Completed" && <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-emerald-600" onClick={() => updateTaskStatus(task.id, "Completed")}>Done</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Link to={createPageUrl("Projects")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.project_name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{project.client_name} · {project.status}</p>
        </div>
        <Button onClick={() => setShowTaskForm(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      {/* Task Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TaskColumn title="To Do" items={todoTasks} icon={<Circle className="w-4 h-4 text-slate-400" />} />
        <TaskColumn title="In Progress" items={inProgress} icon={<Clock className="w-4 h-4 text-indigo-500" />} />
        <TaskColumn title="Completed" items={completed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
      </div>

      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Task Name *</Label><Input value={taskForm.task_name} onChange={(e) => setTaskForm(prev => ({ ...prev, task_name: e.target.value }))} className="h-9 text-sm" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assign Employee</Label>
              <Select value={taskForm.assigned_employee_id} onValueChange={(v) => setTaskForm(prev => ({ ...prev, assigned_employee_id: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.employee_id}>{e.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm(prev => ({ ...prev, priority: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Low", "Medium", "High", "Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Deadline</Label><Input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm(prev => ({ ...prev, deadline: e.target.value }))} className="h-9 text-sm" /></div>
            </div>
            <Button onClick={handleSaveTask} disabled={!taskForm.task_name} className="w-full bg-indigo-600 hover:bg-indigo-700">Add Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}