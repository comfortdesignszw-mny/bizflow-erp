import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Shield, LogOut, Building2, Globe, Mail, Phone, MapPin, FileText, Save, Loader2, CheckCheck, Upload } from "lucide-react";
import { useCompanyProfile } from "@/components/brand/useCompanyProfile";
import CompanyLetterhead from "@/components/brand/CompanyLetterhead";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { company, isLoading: profileLoading } = useCompanyProfile();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState({
    company_name: "", motto: "", address: "", email: "", phone: "", website: "", logo_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(me => { setUser(me); setLoading(false); });
  }, []);

  useEffect(() => {
    if (company) {
      setProfile({
        company_name: company.company_name || "",
        motto: company.motto || "",
        address: company.address || "",
        email: company.email || "",
        phone: company.phone || "",
        website: company.website || "",
        logo_url: company.logo_url || "",
      });
    }
  }, [company]);

  const handleSaveProfile = async () => {
    setSaving(true);
    if (company?.id) {
      await base44.entities.CompanyProfile.update(company.id, profile);
    } else {
      await base44.entities.CompanyProfile.create(profile);
    }
    queryClient.invalidateQueries({ queryKey: ["company-profile"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfile(prev => ({ ...prev, logo_url: file_url }));
    setLogoUploading(false);
  };

  const handleLogout = () => base44.auth.logout();

  const f = (field) => (e) => setProfile(prev => ({ ...prev, [field]: e.target.value }));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-slate-400">Loading...</div></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and company profile</p>
      </div>

      {/* ── Company Profile ── */}
      <Card className="rounded-2xl border-cyan-200/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-cyan-700">
            <Building2 className="w-4 h-4" /> Company Profile & Branding
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">This information appears as a branded letterhead on all reports, vacancy posts, employee cards, and company documents.</p>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Live Preview */}
          {profile.company_name && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Brand Preview</p>
              <CompanyLetterhead company={profile} variant="full" className="rounded-xl overflow-hidden shadow" />
            </div>
          )}

          {/* Logo Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Company Logo</Label>
            <div className="flex items-center gap-3">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="h-14 w-14 rounded-xl object-contain border border-cyan-200 bg-white p-1" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl">
                  {profile.company_name?.[0]?.toUpperCase() || "C"}
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button type="button" variant="outline" size="sm" className="gap-2 rounded-lg border-cyan-300 text-cyan-700 hover:bg-cyan-50" disabled={logoUploading} asChild>
                  <span>{logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} {logoUploading ? "Uploading..." : "Upload Logo"}</span>
                </Button>
              </label>
              {profile.logo_url && (
                <Button type="button" variant="ghost" size="sm" className="text-rose-500 text-xs" onClick={() => setProfile(p => ({ ...p, logo_url: "" }))}>Remove</Button>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-600">Company Name <span className="text-rose-500">*</span></Label>
              <Input value={profile.company_name} onChange={f("company_name")} placeholder="e.g. Acme Corporation" className="h-9 text-sm rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><FileText className="w-3 h-3" /> Motto / Description</Label>
              <Input value={profile.motto} onChange={f("motto")} placeholder="e.g. Excellence in every endeavour" className="h-9 text-sm rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> Physical Address</Label>
              <Input value={profile.address} onChange={f("address")} placeholder="e.g. 123 Main Street, Harare, Zimbabwe" className="h-9 text-sm rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Mail className="w-3 h-3" /> Email Address</Label>
              <Input type="email" value={profile.email} onChange={f("email")} placeholder="info@company.com" className="h-9 text-sm rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> Contact Number</Label>
              <Input type="tel" value={profile.phone} onChange={f("phone")} placeholder="+263 77 000 0000" className="h-9 text-sm rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Globe className="w-3 h-3" /> Company Website</Label>
              <Input value={profile.website} onChange={f("website")} placeholder="www.yourcompany.com" className="h-9 text-sm rounded-xl border-slate-200" />
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={saving || !profile.company_name}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Company Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* ── User Profile ── */}
      <Card className="rounded-2xl border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
              {user?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.full_name || "User"}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Full Name</Label>
              <Input value={user?.full_name || ""} disabled className="h-9 text-sm bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Email</Label>
              <Input value={user?.email || ""} disabled className="h-9 text-sm bg-slate-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Role & Access ── */}
      <Card className="rounded-2xl border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Role & Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Current Role</p>
              <p className="text-xs text-slate-500">Your access level in the system</p>
            </div>
            <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200">{user?.role || "Employee"}</Badge>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              {user?.role === "Super Admin" && "Full access to all modules, settings, and user management."}
              {user?.role === "HR Manager" && "Access to HR, attendance, payroll, and recruitment modules."}
              {user?.role === "Finance Manager" && "Access to payroll, reports, and financial modules."}
              {user?.role === "Project Manager" && "Access to projects, tasks, and team management."}
              {(!user?.role || user?.role === "Employee") && "Basic access to view your profile, attendance, and assigned tasks."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleLogout} variant="outline" className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
        <LogOut className="w-4 h-4" /> Sign Out
      </Button>
    </div>
  );
}