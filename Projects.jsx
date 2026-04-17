import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FolderKanban, Calendar, DollarSign, Pencil, Trash2, ListTodo } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  Planning: "bg-sky-50 text-sky-700",
  "In Progress": "bg-indigo-50 text-indigo-700",
  Completed: "bg-emerald-50 text-emerald-700",
  "On Hold": "bg-amber-50 text-amber-700",
};

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ project_name: "", client_name: "", description: "", start_date: "", end_date: "", budget: "", status: "Planning" });
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date", 100),
  });

  const openForm = (proj = null) => {
    if (proj) { setEditProject(proj); setForm({ ...proj, budget: proj.budget || "" }); }
    else { setEditProject(null); setForm({ project_name: "", client_name: "", description: "", start_date: "", end_date: "", budget: "", status: "Planning" }); }
    setShowForm(true);
  };

  const handleSave = async () => {
    const data = { ...form, budget: Number(form.budget) || 0 };
    if (editProject) await base44.entities.Project.update(editProject.id, data);
    else await base44.entities.Project.create(data);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Project.delete(id);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage projects and track progress</p>
        </div>
        <Button onClick={() => openForm()} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {/* Project Cards */}
      {projects.length === 0 && !isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400 mt-3">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <Card key={proj.id} className="rounded-2xl border-slate-200/60 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{proj.project_name}</CardTitle>
                    {proj.client_name && <p className="text-xs text-slate-500 mt-1">{proj.client_name}</p>}
                  </div>
                  <Badge className={statusColors[proj.status]}>{proj.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {proj.description && <p className="text-sm text-slate-600 line-clamp-2">{proj.description}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {proj.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(proj.start_date), "MMM d")} – {proj.end_date ? format(new Date(proj.end_date), "MMM d, yyyy") : "Ongoing"}</span>}
                  {proj.budget > 0 && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${proj.budget.toLocaleString()}</span>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Link to={createPageUrl(`ProjectDetail?id=${proj.id}`)} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs"><ListTodo className="w-3 h-3 mr-1" /> Tasks</Button>
                  </Link>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => openForm(proj)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs text-rose-600" onClick={() => handleDelete(proj.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editProject ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Project Name *</Label><Input value={form.project_name} onChange={(e) => setForm(prev => ({ ...prev, project_name: e.target.value }))} className="h-9 text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Client Name</Label><Input value={form.client_name} onChange={(e) => setForm(prev => ({ ...prev, client_name: e.target.value }))} className="h-9 text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} className="text-sm h-20" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Budget</Label><Input type="number" value={form.budget} onChange={(e) => setForm(prev => ({ ...prev, budget: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Planning", "In Progress", "Completed", "On Hold"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} disabled={!form.project_name} className="w-full bg-indigo-600 hover:bg-indigo-700">{editProject ? "Update" : "Create Project"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}