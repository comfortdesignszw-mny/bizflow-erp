import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Users, UserCheck, Building, DollarSign, Briefcase, FolderKanban,
  BookOpen, TrendingUp, Wrench, Package, Car, Cpu, AlertTriangle,
  Factory, ShoppingCart, ArrowUpRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatCard from "../components/dashboard/StatCard";
import AttendanceChart from "../components/dashboard/AttendanceChart";
import RecentActivity from "../components/dashboard/RecentActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function SectionHeader({ title, color }) {
  const colors = {
    indigo: "border-l-indigo-500",
    emerald: "border-l-emerald-500",
    amber: "border-l-amber-500",
    blue: "border-l-blue-500",
    violet: "border-l-violet-500",
  };
  return (
    <div className={`border-l-4 pl-3 ${colors[color] || "border-l-slate-300"}`}>
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h2>
    </div>
  );
}

export default function Dashboard() {
  const today = new Date().toISOString().split("T")[0];

  const { data: employees = [], isLoading: empLoading } = useQuery({ queryKey: ["employees"], queryFn: () => base44.entities.Employee.list("-created_date", 500) });
  const { data: attendance = [], isLoading: attLoading } = useQuery({ queryKey: ["attendance-today"], queryFn: () => base44.entities.Attendance.filter({ date: today }, "-created_date", 500) });
  const { data: accessLogs = [] } = useQuery({ queryKey: ["access-logs-recent"], queryFn: () => base44.entities.AccessLog.list("-created_date", 20) });
  const { data: vacancies = [] } = useQuery({ queryKey: ["vacancies"], queryFn: () => base44.entities.Vacancy.filter({ status: "Open" }, "-created_date", 100) });
  const { data: projects = [] } = useQuery({ queryKey: ["projects-active"], queryFn: () => base44.entities.Project.filter({ status: "In Progress" }, "-created_date", 100) });
  const { data: payrolls = [] } = useQuery({ queryKey: ["payrolls-recent"], queryFn: () => base44.entities.Payroll.list("-created_date", 100) });

  // Accounting
  const { data: transactions = [] } = useQuery({ queryKey: ["cash-transactions-dash"], queryFn: () => base44.entities.CashTransaction.list("-transaction_date", 200) });
  const { data: journals = [] } = useQuery({ queryKey: ["journals-dash"], queryFn: () => base44.entities.JournalEntry.list("-entry_date", 100) });

  // Sales
  const { data: clients = [] } = useQuery({ queryKey: ["clients-dash"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: sales = [] } = useQuery({ queryKey: ["sales-dash"], queryFn: () => base44.entities.SalesRecord.list("-sale_date", 200) });

  // Engineering
  const { data: maintenance = [] } = useQuery({ queryKey: ["maintenance-dash"], queryFn: () => base44.entities.MaintenanceRequest.list("-created_date", 100) });
  const { data: fleet = [] } = useQuery({ queryKey: ["fleet-dash"], queryFn: () => base44.entities.FleetVehicle.list("-created_date", 50) });
  const { data: itAssets = [] } = useQuery({ queryKey: ["it-assets-dash"], queryFn: () => base44.entities.ITAsset.list("-created_date", 100) });

  // Operations
  const { data: procurement = [] } = useQuery({ queryKey: ["procurement-dash"], queryFn: () => base44.entities.ProcurementOrder.list("-order_date", 100) });
  const { data: production = [] } = useQuery({ queryKey: ["production-dash"], queryFn: () => base44.entities.ProductionLog.list("-production_date", 50) });

  const activeEmployees = employees.filter(e => e.status === "Active");
  const presentToday = attendance.filter(a => a.status === "Present" || a.status === "Late");
  const checkIns = accessLogs.filter(l => l.scan_type === "IN").length;
  const checkOuts = accessLogs.filter(l => l.scan_type === "OUT").length;
  const currentlyInside = Math.max(0, checkIns - checkOuts);
  const totalPayroll = payrolls.reduce((s, p) => s + (p.net_salary || 0), 0);

  const totalIncome = transactions.filter(t => t.type === "Income" && t.status === "Approved").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === "Expense" && t.status === "Approved").reduce((s, t) => s + (t.amount || 0), 0);
  const postedJournals = journals.filter(j => j.status === "Posted").length;

  const wonDeals = sales.filter(s => s.stage === "Won");
  const totalSalesRevenue = wonDeals.reduce((s, d) => s + (d.amount || 0), 0);
  const pipelineValue = sales.filter(s => !["Won","Lost"].includes(s.stage)).reduce((s, d) => s + (d.amount || 0), 0);
  const activeClients = clients.filter(c => c.status === "Active").length;

  const openMaintenance = maintenance.filter(m => m.status === "Open").length;
  const criticalMaint = maintenance.filter(m => m.priority === "Critical").length;
  const activeFleet = fleet.filter(v => v.status === "Active").length;
  const activeITAssets = itAssets.filter(a => a.status === "Active").length;

  const pendingOrders = procurement.filter(o => o.status === "Pending Approval").length;
  const activeProduction = production.filter(p => p.status === "In Progress").length;
  const procurementValue = procurement.reduce((s, o) => s + (o.total_amount || 0), 0);

  const chartData = [
    { day: "Mon", present: 18, late: 3, absent: 2 },
    { day: "Tue", present: 20, late: 2, absent: 1 },
    { day: "Wed", present: 19, late: 4, absent: 0 },
    { day: "Thu", present: 21, late: 1, absent: 1 },
    { day: "Fri", present: 17, late: 3, absent: 3 },
  ];

  const isLoading = empLoading || attLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ERP Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Unified view across all departments & operations.</p>
      </div>

      {/* HR Section */}
      <div className="space-y-3">
        <SectionHeader title="HR & People" color="indigo" />
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Active Employees" value={activeEmployees.length} icon={Users} color="indigo" subtitle="Staff" />
            <StatCard title="Present Today" value={presentToday.length} icon={UserCheck} color="emerald" subtitle={`of ${activeEmployees.length}`} />
            <StatCard title="In Premises" value={currentlyInside} icon={Building} color="violet" subtitle="Right now" />
            <StatCard title="Payroll" value={`$${totalPayroll.toLocaleString()}`} icon={DollarSign} color="amber" subtitle="Total period" />
          </div>
        )}
      </div>

      {/* Accounting Section */}
      <div className="space-y-3">
        <SectionHeader title="Accounting & Finance" color="emerald" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Income" value={`$${totalIncome.toLocaleString()}`} icon={TrendingUp} color="emerald" subtitle="Approved" />
          <StatCard title="Total Expenses" value={`$${totalExpense.toLocaleString()}`} icon={DollarSign} color="amber" subtitle="Approved" />
          <StatCard title="Posted Journals" value={postedJournals} icon={BookOpen} color="indigo" subtitle="Entries" />
          <StatCard title="Net Balance" value={`$${(totalIncome - totalExpense).toLocaleString()}`} icon={TrendingUp} color={totalIncome >= totalExpense ? "emerald" : "amber"} subtitle="Income - Expenses" />
        </div>
      </div>

      {/* Sales Section */}
      <div className="space-y-3">
        <SectionHeader title="Sales & CRM" color="blue" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Revenue (Won)" value={`$${totalSalesRevenue.toLocaleString()}`} icon={ShoppingCart} color="blue" subtitle="Closed deals" />
          <StatCard title="Pipeline Value" value={`$${pipelineValue.toLocaleString()}`} icon={TrendingUp} color="violet" subtitle="Active deals" />
          <StatCard title="Active Clients" value={activeClients} icon={Users} color="emerald" subtitle="In CRM" />
          <StatCard title="Open Vacancies" value={vacancies.length} icon={Briefcase} color="amber" subtitle="HR Recruiting" />
        </div>
      </div>

      {/* Engineering Section */}
      <div className="space-y-3">
        <SectionHeader title="Engineering" color="amber" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Open Requests" value={openMaintenance} icon={Wrench} color="amber" subtitle="Maintenance" />
          <StatCard title="Critical Issues" value={criticalMaint} icon={AlertTriangle} color="amber" subtitle="Needs action" />
          <StatCard title="Active Fleet" value={activeFleet} icon={Car} color="blue" subtitle="Vehicles" />
          <StatCard title="IT Assets" value={activeITAssets} icon={Cpu} color="violet" subtitle="Registered" />
        </div>
      </div>

      {/* Operations Section */}
      <div className="space-y-3">
        <SectionHeader title="Operations" color="violet" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pending Orders" value={pendingOrders} icon={Package} color="amber" subtitle="Awaiting approval" />
          <StatCard title="Active Production" value={activeProduction} icon={Factory} color="blue" subtitle="In progress" />
          <StatCard title="Procurement Value" value={`$${procurementValue.toLocaleString()}`} icon={DollarSign} color="emerald" subtitle="All orders" />
          <StatCard title="Active Projects" value={projects.length} icon={FolderKanban} color="indigo" subtitle="In progress" />
        </div>
      </div>

      {/* Attendance Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceChart data={chartData} />
        </div>
        <div>
          <RecentActivity accessLogs={accessLogs} />
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Employees", page: "Employees", color: "from-indigo-500 to-indigo-600" },
            { label: "Payroll", page: "Payroll", color: "from-amber-500 to-amber-600" },
            { label: "Accounting", page: "Accounting", color: "from-emerald-500 to-emerald-600" },
            { label: "Sales & CRM", page: "Sales", color: "from-blue-500 to-blue-600" },
            { label: "Engineering", page: "Engineering", color: "from-orange-500 to-orange-600" },
            { label: "Operations", page: "Operations", color: "from-violet-500 to-violet-600" },
          ].map(link => (
            <Link
              key={link.page}
              to={createPageUrl(link.page)}
              className={`bg-gradient-to-r ${link.color} rounded-2xl p-4 text-white flex items-center justify-between hover:shadow-lg transition-shadow`}
            >
              <span className="font-medium text-xs">{link.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}