import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Users, DollarSign, Briefcase, FolderKanban, Printer, Download, Share2, Loader2 } from "lucide-react";
import CompanyLetterhead from "@/components/brand/CompanyLetterhead";
import { useCompanyProfile } from "@/components/brand/useCompanyProfile";
import { generateReportPDF } from "@/lib/reportPDF";
import html2canvas from "html2canvas";
import { toast } from "sonner";

const COLORS = ["#06b6d4", "#1d4ed8", "#0891b2", "#1e40af", "#67e8f9", "#93c5fd", "#0e7490", "#2563eb"];

const REPORT_OPTIONS = [
  { value: "attendance", label: "Attendance Report" },
  { value: "payroll", label: "Payroll Report" },
  { value: "workforce", label: "Workforce Report" },
  { value: "recruitment", label: "Recruitment Pipeline" },
  { value: "projects", label: "Projects Report" },
];

export default function Reports() {
  const [reportType, setReportType] = useState("attendance");
  const [exporting, setExporting] = useState(false);
  const { company } = useCompanyProfile();
  const chartRef = useRef(null);

  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => base44.entities.Employee.list("-created_date", 500) });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance-all"], queryFn: () => base44.entities.Attendance.list("-date", 500) });
  const { data: payrolls = [] } = useQuery({ queryKey: ["payrolls-all"], queryFn: () => base44.entities.Payroll.list("-created_date", 500) });
  const { data: projects = [] } = useQuery({ queryKey: ["projects-all"], queryFn: () => base44.entities.Project.list("-created_date", 100) });
  const { data: applications = [] } = useQuery({ queryKey: ["applications-all"], queryFn: () => base44.entities.Application.list("-created_date", 500) });

  // Data computations
  const deptData = Object.entries(
    employees.reduce((acc, e) => { acc[e.department || "Unknown"] = (acc[e.department || "Unknown"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const attSummary = Object.entries(
    attendance.reduce((acc, a) => { acc[a.status || "Unknown"] = (acc[a.status || "Unknown"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const payrollByMonth = Object.entries(
    payrolls.reduce((acc, p) => { acc[p.month || "Unknown"] = (acc[p.month || "Unknown"] || 0) + (p.net_salary || 0); return acc; }, {})
  ).map(([month, total]) => ({ month, total })).sort((a, b) => a.month.localeCompare(b.month));

  const projStatus = Object.entries(
    projects.reduce((acc, p) => { acc[p.status || "Unknown"] = (acc[p.status || "Unknown"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const pipelineData = ["Applied", "Shortlisted", "Interview", "Hired", "Rejected"].map(stage => ({
    stage, count: applications.filter(a => a.pipeline_stage === stage).length,
  }));

  // Summary cards per report type
  const totalPayroll = payrolls.reduce((s, p) => s + (p.net_salary || 0), 0);
  const summaryCards = {
    attendance: [
      { label: "Total Records", value: attendance.length },
      { label: "Present", value: attendance.filter(a => a.status === "Present").length },
      { label: "Absent", value: attendance.filter(a => a.status === "Absent").length },
      { label: "Late", value: attendance.filter(a => a.status === "Late").length },
    ],
    payroll: [
      { label: "Total Paid", value: `$${payrolls.filter(p => p.payment_status === "Paid").reduce((s, p) => s + (p.net_salary || 0), 0).toLocaleString()}` },
      { label: "Total Payroll", value: `$${totalPayroll.toLocaleString()}` },
      { label: "Pending", value: payrolls.filter(p => p.payment_status === "Pending").length },
      { label: "Employees", value: employees.length },
    ],
    workforce: [
      { label: "Total Employees", value: employees.length },
      { label: "Active", value: employees.filter(e => e.status === "Active").length },
      { label: "Departments", value: deptData.length },
      { label: "On Leave", value: employees.filter(e => e.status === "On Leave").length },
    ],
    recruitment: [
      { label: "Total Applicants", value: applications.length },
      { label: "Hired", value: applications.filter(a => a.pipeline_stage === "Hired").length },
      { label: "Shortlisted", value: applications.filter(a => a.pipeline_stage === "Shortlisted").length },
      { label: "Rejected", value: applications.filter(a => a.pipeline_stage === "Rejected").length },
    ],
    projects: [
      { label: "Total Projects", value: projects.length },
      { label: "In Progress", value: projects.filter(p => p.status === "In Progress").length },
      { label: "Completed", value: projects.filter(p => p.status === "Completed").length },
      { label: "On Hold", value: projects.filter(p => p.status === "On Hold").length },
    ],
  };

  // Table data per report type
  const tableData = {
    attendance: {
      headers: ["Status", "Count", "Percentage"],
      rows: attSummary.map(r => [r.name, r.value, `${attendance.length ? ((r.value / attendance.length) * 100).toFixed(1) : 0}%`]),
    },
    payroll: {
      headers: ["Month", "Net Salary ($)", "Employees Paid"],
      rows: payrollByMonth.map(r => [r.month, r.total.toLocaleString(), payrolls.filter(p => p.month === r.month && p.payment_status === "Paid").length]),
    },
    workforce: {
      headers: ["Department", "Headcount", "% of Total"],
      rows: deptData.map(r => [r.name, r.value, `${employees.length ? ((r.value / employees.length) * 100).toFixed(1) : 0}%`]),
    },
    recruitment: {
      headers: ["Stage", "Count", "% of Total"],
      rows: pipelineData.map(r => [r.stage, r.count, `${applications.length ? ((r.count / applications.length) * 100).toFixed(1) : 0}%`]),
    },
    projects: {
      headers: ["Status", "Count", "% of Total"],
      rows: projStatus.map(r => [r.name, r.value, `${projects.length ? ((r.value / projects.length) * 100).toFixed(1) : 0}%`]),
    },
  };

  const reportTitle = REPORT_OPTIONS.find(r => r.value === reportType)?.label || "Report";

  const getChartDataUrl = async () => {
    if (!chartRef.current) return null;
    const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    return canvas.toDataURL("image/png");
  };

  const buildPDF = async () => {
    const chartDataUrl = await getChartDataUrl();
    const td = tableData[reportType];
    return generateReportPDF({
      reportTitle,
      company,
      tableHeaders: td.headers,
      tableRows: td.rows,
      summaryCards: summaryCards[reportType],
      chartDataUrl,
    });
  };

  const handleDownload = async () => {
    setExporting(true);
    const doc = await buildPDF();
    const filename = `${reportTitle.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    setExporting(false);
    toast.success("PDF downloaded successfully");
  };

  const handlePrint = async () => {
    setExporting(true);
    const doc = await buildPDF();
    const blobUrl = doc.output("bloburl");
    setExporting(false);
    const win = window.open(blobUrl, "_blank");
    if (win) win.print();
  };

  const handleShare = async () => {
    setExporting(true);
    const doc = await buildPDF();
    const filename = `${reportTitle.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = doc.output("blob");
    const file = new File([blob], filename, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      setExporting(false);
      await navigator.share({ files: [file], title: reportTitle, text: `${reportTitle} from ${company?.company_name || "BizOps ERP"}` });
    } else {
      // Fallback: download
      doc.save(filename);
      setExporting(false);
      toast.info("Share not supported on this browser — PDF downloaded instead");
    }
  };

  return (
    <div className="space-y-6">
      {/* Branded letterhead */}
      <CompanyLetterhead company={company} variant="full" className="rounded-xl overflow-hidden shadow-sm" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Analytics and business insights — export as branded PDF</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-52 h-9 rounded-lg text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REPORT_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" disabled={exporting} onClick={handlePrint} className="h-9 gap-1.5 border-slate-300">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} Print
          </Button>

          <Button variant="outline" size="sm" disabled={exporting} onClick={handleShare} className="h-9 gap-1.5 border-cyan-300 text-cyan-700 hover:bg-cyan-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share
          </Button>

          <Button size="sm" disabled={exporting} onClick={handleDownload} className="h-9 gap-1.5 bg-cyan-600 hover:bg-cyan-700">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards[reportType].map((card, i) => (
          <Card key={i} className="rounded-xl border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-50">
                {i === 0 ? <Users className="w-4 h-4 text-cyan-600" /> :
                 i === 1 ? <DollarSign className="w-4 h-4 text-emerald-600" /> :
                 i === 2 ? <Briefcase className="w-4 h-4 text-amber-600" /> :
                           <FolderKanban className="w-4 h-4 text-violet-600" />}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart (captured for PDF) */}
      <div ref={chartRef} className="bg-white rounded-2xl">
        {reportType === "attendance" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-slate-200/60">
              <CardHeader><CardTitle className="text-sm">Attendance Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={attSummary} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {attSummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-slate-200/60">
              <CardHeader><CardTitle className="text-sm">Attendance by Status</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attSummary} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {reportType === "payroll" && (
          <Card className="rounded-2xl border-slate-200/60">
            <CardHeader><CardTitle className="text-sm">Payroll Expenses by Month</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={payrollByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Line type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#1d4ed8" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === "workforce" && (
          <Card className="rounded-2xl border-slate-200/60">
            <CardHeader><CardTitle className="text-sm">Employees by Department</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === "recruitment" && (
          <Card className="rounded-2xl border-slate-200/60">
            <CardHeader><CardTitle className="text-sm">Recruitment Pipeline</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="stage" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0891b2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === "projects" && (
          <Card className="rounded-2xl border-slate-200/60">
            <CardHeader><CardTitle className="text-sm">Projects by Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projStatus} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {projStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Data table preview */}
      <Card className="rounded-2xl border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-sm text-slate-700">Data Summary — {reportTitle}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cyan-500 text-white">
                {tableData[reportType].headers.map((h, i) => (
                  <th key={i} className={`py-2 px-4 font-semibold text-xs ${i === 0 ? "text-left rounded-tl-lg" : i === tableData[reportType].headers.length - 1 ? "text-right rounded-tr-lg" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData[reportType].rows.length === 0 ? (
                <tr><td colSpan={tableData[reportType].headers.length} className="text-center py-8 text-slate-400 text-xs">No data available</td></tr>
              ) : tableData[reportType].rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`py-2 px-4 text-slate-700 text-xs ${ci === 0 ? "text-left font-medium" : ci === row.length - 1 ? "text-right" : "text-center"}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}