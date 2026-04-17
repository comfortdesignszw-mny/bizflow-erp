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
import { Plus, Briefcase, Calendar, Pencil, Trash2, Share2 } from "lucide-react";
import { format } from "date-fns";
import ShareVacancyModal from "../components/vacancies/ShareVacancyModal";

const DEPARTMENTS = ["Engineering", "Marketing", "Sales", "Finance", "HR", "Operations", "IT", "Legal", "Support", "Executive"];

export default function Vacancies() {
  const [showForm, setShowForm] = useState(false);
  const [editVacancy, setEditVacancy] = useState(null);
  const [shareVacancy, setShareVacancy] = useState(null);
  const [form, setForm] = useState({ job_title: "", department: "", description: "", skills_required: "", experience_required: "", salary_range: "", deadline: "", status: "Open" });
  const queryClient = useQueryClient();

  const { data: vacancies = [], isLoading } = useQuery({
    queryKey: ["vacancies-all"],
    queryFn: () => base44.entities.Vacancy.list("-created_date", 100),
  });

  const openForm = (vac = null) => {
    if (vac) {
      setEditVacancy(vac);
      setForm({ ...vac });
    } else {
      setEditVacancy(null);
      setForm({ job_title: "", department: "", description: "", skills_required: "", experience_required: "", salary_range: "", deadline: "", status: "Open" });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editVacancy) {
      await base44.entities.Vacancy.update(editVacancy.id, form);
    } else {
      await base44.entities.Vacancy.create(form);
    }
    queryClient.invalidateQueries({ queryKey: ["vacancies-all"] });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Vacancy.delete(id);
    queryClient.invalidateQueries({ queryKey: ["vacancies-all"] });
  };

  const statusColors = { Open: "bg-emerald-50 text-emerald-700", Closed: "bg-slate-100 text-slate-600", "On Hold": "bg-amber-50 text-amber-700" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vacancies</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage job postings</p>
        </div>
        <Button onClick={() => openForm()} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Post Vacancy
        </Button>
      </div>

      {vacancies.length === 0 && !isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400 mt-3">No vacancies posted yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vacancies.map((vac) => (
            <Card key={vac.id} className="rounded-2xl border-slate-200/60 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{vac.job_title}</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">{vac.department}</p>
                  </div>
                  <Badge className={statusColors[vac.status]}>{vac.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {vac.description && <p className="text-sm text-slate-600 line-clamp-2">{vac.description}</p>}
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {vac.salary_range && <span className="flex items-center gap-1">💰 {vac.salary_range}</span>}
                  {vac.experience_required && <span>📋 {vac.experience_required}</span>}
                  {vac.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(vac.deadline), "MMM d, yyyy")}</span>}
                </div>
                {vac.skills_required && (
                  <div className="flex flex-wrap gap-1">
                    {vac.skills_required.split(",").map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-normal">{s.trim()}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setShareVacancy(vac)}>
                    <Share2 className="w-3 h-3 mr-1" /> Share
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => openForm(vac)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs text-rose-600" onClick={() => handleDelete(vac.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ShareVacancyModal vacancy={shareVacancy} open={!!shareVacancy} onClose={() => setShareVacancy(null)} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editVacancy ? "Edit Vacancy" : "Post New Vacancy"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Job Title *</Label><Input value={form.job_title} onChange={(e) => setForm(prev => ({ ...prev, job_title: e.target.value }))} className="h-9 text-sm" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Department *</Label>
              <Select value={form.department} onValueChange={(v) => setForm(prev => ({ ...prev, department: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} className="text-sm h-20" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Skills (comma-separated)</Label><Input value={form.skills_required} onChange={(e) => setForm(prev => ({ ...prev, skills_required: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Experience Required</Label><Input value={form.experience_required} onChange={(e) => setForm(prev => ({ ...prev, experience_required: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Salary Range</Label><Input value={form.salary_range} onChange={(e) => setForm(prev => ({ ...prev, salary_range: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm(prev => ({ ...prev, deadline: e.target.value }))} className="h-9 text-sm" /></div>
            </div>
            <Button onClick={handleSave} disabled={!form.job_title || !form.department} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editVacancy ? "Update" : "Post Vacancy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}