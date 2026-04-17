import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Briefcase, CheckCircle2, Loader2, Upload } from "lucide-react";
import { format } from "date-fns";

export default function Apply() {
  const urlParams = new URLSearchParams(window.location.search);
  const vacancyId = urlParams.get("vacancy");

  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    candidate_name: "", email: "", phone: "",
    cover_letter: "", skills: "", experience_years: "",
    education: "", previous_companies: "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [cvUrl, setCvUrl] = useState("");
  const [uploadingCv, setUploadingCv] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!vacancyId) { setLoading(false); return; }
      const results = await base44.entities.Vacancy.filter({ id: vacancyId });
      setVacancy(results[0] || null);
      setLoading(false);
    };
    load();
  }, [vacancyId]);

  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCvFile(file);
    setUploadingCv(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setCvUrl(file_url);
    setUploadingCv(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const appData = {
      ...form,
      vacancy_id: vacancyId,
      vacancy_title: vacancy?.job_title || "",
      experience_years: Number(form.experience_years) || 0,
      cv_file: cvUrl,
      pipeline_stage: "Applied",
      match_score: null,
    };

    // AI CV scan if CV uploaded
    if (cvUrl && vacancy) {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this CV for the position of ${vacancy.job_title} in ${vacancy.department}.
Required skills: ${vacancy.skills_required || "not specified"}.
Required experience: ${vacancy.experience_required || "not specified"}.
Extract skills, education, experience years, previous companies.
Calculate a match score percentage (0-100) based on how well the candidate matches the job requirements.`,
        file_urls: [cvUrl],
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
    }

    await base44.entities.Application.create(appData);
    setSaving(false);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-700 mt-4">Vacancy Not Found</h2>
          <p className="text-sm text-slate-400 mt-2">This job posting may have been removed or closed.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-4">Application Submitted!</h2>
          <p className="text-sm text-slate-500 mt-2">Thank you for applying for <strong>{vacancy.job_title}</strong>. Our HR team will review your application and get back to you soon.</p>
          <Badge className="mt-4 bg-indigo-50 text-indigo-700">Application under review</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Job Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-indigo-600">BizOps ERP</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{vacancy.job_title}</h1>
              <p className="text-sm text-slate-500 mt-1">{vacancy.department}</p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 flex-shrink-0">Open</Badge>
          </div>

          {vacancy.description && (
            <p className="text-sm text-slate-600 mt-4 leading-relaxed">{vacancy.description}</p>
          )}

          <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-500">
            {vacancy.salary_range && <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">💰 {vacancy.salary_range}</span>}
            {vacancy.experience_required && <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">📋 {vacancy.experience_required}</span>}
            {vacancy.deadline && (
              <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                <Calendar className="w-3 h-3" /> Deadline: {format(new Date(vacancy.deadline), "MMM d, yyyy")}
              </span>
            )}
          </div>

          {vacancy.skills_required && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {vacancy.skills_required.split(",").map((s, i) => (
                <Badge key={i} variant="outline" className="text-xs">{s.trim()}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Your Application</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Full Name *</Label>
                <Input value={form.candidate_name} onChange={(e) => setForm(p => ({ ...p, candidate_name: e.target.value }))} className="h-10 text-sm rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="h-10 text-sm rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Phone</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="h-10 text-sm rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Years of Experience</Label>
                <Input type="number" value={form.experience_years} onChange={(e) => setForm(p => ({ ...p, experience_years: e.target.value }))} className="h-10 text-sm rounded-xl" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Education</Label>
                <Input value={form.education} onChange={(e) => setForm(p => ({ ...p, education: e.target.value }))} placeholder="e.g. BSc Computer Science" className="h-10 text-sm rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Previous Companies</Label>
                <Input value={form.previous_companies} onChange={(e) => setForm(p => ({ ...p, previous_companies: e.target.value }))} placeholder="e.g. Google, Meta" className="h-10 text-sm rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Skills</Label>
              <Input value={form.skills} onChange={(e) => setForm(p => ({ ...p, skills: e.target.value }))} placeholder="e.g. React, Python, SQL (comma-separated)" className="h-10 text-sm rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Cover Letter</Label>
              <Textarea value={form.cover_letter} onChange={(e) => setForm(p => ({ ...p, cover_letter: e.target.value }))} placeholder="Tell us why you're a great fit..." className="text-sm rounded-xl h-28 resize-none" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Upload CV / Resume</Label>
              <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                <Upload className="w-5 h-5 text-slate-400" />
                <div>
                  {cvFile ? (
                    <p className="text-sm font-medium text-emerald-600">✓ {cvFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600">Click to upload CV</p>
                      <p className="text-xs text-slate-400">PDF, DOC, DOCX, PNG, JPG</p>
                    </>
                  )}
                </div>
                {uploadingCv && <Loader2 className="w-4 h-4 animate-spin text-indigo-500 ml-auto" />}
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleCvUpload} />
              </label>
            </div>

            <Button
              type="submit"
              disabled={saving || uploadingCv || !form.candidate_name || !form.email}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-medium"
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Application"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400">Powered by BizOps ERP · Your application is securely stored</p>
      </div>
    </div>
  );
}