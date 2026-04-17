import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EmployeeForm from "../components/employees/EmployeeForm";
import EmployeeQRCode from "../components/employees/EmployeeQRCode";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-slate-50 text-slate-600 border-slate-200",
  "On Leave": "bg-amber-50 text-amber-700 border-amber-200",
  Terminated: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function Employees() {
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [qrEmployee, setQrEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list("-created_date", 500),
  });

  const filtered = employees.filter(
    (e) =>
      e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    await base44.entities.Employee.delete(id);
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-0.5">{employees.length} total employees</p>
        </div>
        <Button onClick={() => { setEditEmployee(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-medium">Employee</TableHead>
                <TableHead className="text-xs font-medium">ID</TableHead>
                <TableHead className="text-xs font-medium">Department</TableHead>
                <TableHead className="text-xs font-medium">Job Title</TableHead>
                <TableHead className="text-xs font-medium">Type</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(7).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-indigo-600">
                            {emp.full_name?.[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{emp.full_name}</p>
                          <p className="text-xs text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{emp.employee_id}</TableCell>
                    <TableCell className="text-sm text-slate-600">{emp.department}</TableCell>
                    <TableCell className="text-sm text-slate-600">{emp.job_title}</TableCell>
                    <TableCell className="text-sm text-slate-600">{emp.employment_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[emp.status] || statusColors.Active}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`EmployeeProfile?id=${emp.id}`)}>
                              <Eye className="w-4 h-4 mr-2" /> View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditEmployee(emp); setShowForm(true); }}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setQrEmployee(emp)}>
                            <QrCode className="w-4 h-4 mr-2" /> Download QR Card
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(emp.id)} className="text-rose-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {showForm && (
        <EmployeeForm
          open={showForm}
          onClose={() => setShowForm(false)}
          employee={editEmployee}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["employees"] })}
        />
      )}
      <EmployeeQRCode
        employee={qrEmployee}
        open={!!qrEmployee}
        onClose={() => setQrEmployee(null)}
      />
    </div>
  );
}