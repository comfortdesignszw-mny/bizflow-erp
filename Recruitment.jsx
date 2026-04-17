import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Search, Star, Upload, Loader2, Sparkles, MessageSquare, Users } from "lucide-react";
import InterviewQuestionsModal from "../components/recruitment/InterviewQuestionsModal";
import ShortlistModal from "../components/recruitment/ShortlistModal";

const stageColors = {
  Applied: "bg-sky-50 text-sky-700 border-sky-200",
  Shortlisted: "bg-violet-50 text-violet-700 border-violet-200",
  Interview: "bg-amber-50 text-amber-700 border-amber-200",
  Hired: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function Recruitment() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const [interviewApp, setInterviewApp] = useState(null);
  const [showShortlist, setShowShortlist] = useState(false);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => base44.entities.Application.list("-match_score", 500),
  });

  const { data: vacancies = [] } = useQuery({
    queryKey: ["vacancies-open"],
    queryFn: () => base44.entities.Vacancy.filter({ status: "Open" }, "-created_date", 100),
  });

  const [form, setForm] = useState({
    vacancy_id: "", candidate_name: "", email: "", phone: "",
    cv_file: "", cover_letter: "", skills: "", experience_years: "",
    education: "", previous_companies: "",
  });

  const filtered = applications.filter((a) =>
    !search || a.candidate_name?.toLowerCase().includes(search.toLowerCase()) || a.vacancy_title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, cv_file: file_url }));
  };

  const handleSave = async () => {
    const vacancy = vacancies.find(v => v.id === form.vacancy_id);
    const appData = {
      ...form,
      vacancy_title: vacancy?.job_title || "",
      experience_years: Number(form.experience_years) || 0,
      pipeline_stage: "Applied",
    };

    // AI CV analysis
    if (form.cv_file && vacancy) {
      setScanning(true);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this CV for the position of ${vacancy.job_title} in ${vacancy.department}. 
Required skills: ${vacancy.skills_required || "not specified"}.
Required experience: ${vacancy.experience_required || "not specified"}.
Extract: candidate skills, education, experience years, previous companies.
Calculate a match score percentage (0-100) based on how well the candidate matches the job requirements.`,
        file_urls: [form.cv_file],
        response_json_schema: {
          type: "object",
          properties: {
            skills: { type: "string" },
            education: { type: "string" },
            experience_years: { type: "number" },
            previous_companies: { type: "string" },
            match_score: { type: "number" },
          },
        },
      });
      appData.skills = result.skills || appData.skills;
      appData.education = result.education || appData.education;
      appData.experience_years = result.experience_years || appData.experience_years;
      appData.previous_companies = result.previous_companies || appData.previous_companies;
      appData.match_score = result.match_score || 0;
      setScanning(false);
    }

    await base44.entities.Application.create(appData);
    queryClient.invalidateQueries({ queryKey: ["applications"] });
    setShowForm(false);
    setForm({ vacancy_id: "", candidate_name: "", email: "", phone: "", cv_file: "", cover_letter: "", skills: "", experience_years: "", education: "", previous_companies: "" });
  };

  const updateStage = async (id, stage) => {
    await base44.entities.Application.update(id, { pipeline_stage: stage });
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recruitment</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage applications & AI CV scanning</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowShortlist(true)} variant="outline" className="rounded-xl gap-2">
            <Users className="w-4 h-4" /> AI Shortlist
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Application
          </Button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {["Applied", "Shortlisted", "Interview", "Hired", "Rejected"].map(stage => (
          <Card key={stage} className="rounded-xl border-slate-200/60">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-slate-900">{applications.filter(a => a.pipeline_stage === stage).length}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stage}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search applications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9 rounded-lg text-sm" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-medium">Candidate</TableHead>
                <TableHead className="text-xs font-medium">Position</TableHead>
                <TableHead className="text-xs font-medium">Match Score</TableHead>
                <TableHead className="text-xs font-medium">Experience</TableHead>
                <TableHead className="text-xs font-medium">Stage</TableHead>
                <TableHead className="text-xs font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>)}</TableRow>)
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400 text-sm">No applications</TableCell></TableRow>
              ) : (
                filtered.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{app.candidate_name}</p>
                        <p className="text-xs text-slate-400">{app.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{app.vacancy_title}</TableCell>
                    <TableCell>
                      {app.match_score != null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${app.match_score}%`, backgroundColor: app.match_score >= 70 ? "#10b981" : app.match_score >= 40 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                          <span className="text-xs font-medium text-slate-700">{app.match_score}%</span>
                        </div>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{app.experience_years ? `${app.experience_years} yrs` : "—"}</TableCell>
                    <TableCell>
                      <Select value={app.pipeline_stage} onValueChange={(v) => updateStage(app.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-28 border-0 p-0">
                          <Badge variant="outline" className={stageColors[app.pipeline_stage]}>{app.pipeline_stage}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {["Applied", "Shortlisted", "Interview", "Hired", "Rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {app.cv_file && <a href={app.cv_file} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-xs hover:underline">View CV</a>}
                        <button
                          onClick={() => setInterviewApp(app)}
                          className="text-violet-600 text-xs hover:underline flex items-center gap-0.5"
                        >
                          <MessageSquare className="w-3 h-3" /> Interview Qs
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* AI Modals */}
      <InterviewQuestionsModal
        application={interviewApp}
        vacancy={vacancies.find(v => v.id === interviewApp?.vacancy_id || v.job_title === interviewApp?.vacancy_title)}
        open={!!interviewApp}
        onClose={() => setInterviewApp(null)}
      />
      <ShortlistModal
        applications={applications}
        vacancies={vacancies}
        open={showShortlist}
        onClose={() => setShowShortlist(false)}
      />

      {/* Add Application Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Application</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Vacancy *</Label>
              <Select value={form.vacancy_id} onValueChange={(v) => setForm(prev => ({ ...prev, vacancy_id: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select vacancy" /></SelectTrigger>
                <SelectContent>{vacancies.map(v => <SelectItem key={v.id} value={v.id}>{v.job_title} - {v.department}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Candidate Name *</Label><Input value={form.candidate_name} onChange={(e) => setForm(prev => ({ ...prev, candidate_name: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} className="h-9 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Experience (years)</Label><Input type="number" value={form.experience_years} onChange={(e) => setForm(prev => ({ ...prev, experience_years: e.target.value }))} className="h-9 text-sm" /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Upload CV (PDF/Image)</Label>
              <Input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="text-sm" />
              {form.cv_file && <p className="text-xs text-emerald-600">✓ CV uploaded</p>}
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Cover Letter</Label><Textarea value={form.cover_letter} onChange={(e) => setForm(prev => ({ ...prev, cover_letter: e.target.value }))} className="text-sm h-20" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Skills</Label><Input value={form.skills} onChange={(e) => setForm(prev => ({ ...prev, skills: e.target.value }))} placeholder="e.g. React, Python, SQL" className="h-9 text-sm" /></div>
            <Button onClick={handleSave} disabled={!form.candidate_name || !form.vacancy_id || scanning} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing CV...</> : "Submit Application"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}