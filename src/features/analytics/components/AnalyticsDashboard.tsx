'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface KPIProps {
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  newPatientsCount: number;
  activeDoctorsCount: number;
  cancellationRate: string;
  noShowRate: string;
  completionRate: string;
}

interface ChartDataProps {
  appointmentsByDay: { date: string; count: number }[];
  appointmentsByDepartment: { name: string; count: number }[];
  appointmentsByDoctor: { name: string; count: number }[];
  appointmentsByStatus: { name: string; value: number }[];
}

interface AnalyticsDashboardProps {
  kpis: KPIProps;
  charts: ChartDataProps;
}

const STATUS_COLORS: Record<string, string> = {
  BOOKED: '#3b82f6', // blue
  CONFIRMED: '#10b981', // emerald
  COMPLETED: '#059669', // green
  CANCELLED: '#ef4444', // red
  NO_SHOW: '#f59e0b', // amber
};

export default function AnalyticsDashboard({ kpis, charts }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Hospital Analytics
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Key performance indicators and operational metrics (Last 30 Days)
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <KPICard title="Today's Appts" value={kpis.todayCount} />
        <KPICard title="Upcoming Appts" value={kpis.upcomingCount} />
        <KPICard title="Completed (All-Time)" value={kpis.completedCount} />
        <KPICard title="Cancelled (All-Time)" value={kpis.cancelledCount} />
        <KPICard title="No-Shows (All-Time)" value={kpis.noShowCount} />
        
        <KPICard title="New Patients" value={kpis.newPatientsCount} trend="Last 30d" />
        <KPICard title="Active Doctors" value={kpis.activeDoctorsCount} />
        <KPICard title="Completion Rate" value={`${kpis.completionRate}%`} />
        <KPICard title="Cancel Rate" value={`${kpis.cancellationRate}%`} />
        <KPICard title="No-Show Rate" value={`${kpis.noShowRate}%`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appointments by Day Line Chart */}
        <div className="card-surface p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-ink">Appointments by Day</h3>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.appointmentsByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments by Status Pie Chart */}
        <div className="card-surface p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-ink">Appointments by Status</h3>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.appointmentsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {charts.appointmentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments by Department Bar Chart */}
        <div className="card-surface p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-ink">Appointments by Department</h3>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.appointmentsByDepartment} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Doctors by Appointment Volume */}
        <div className="card-surface p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-ink">Top 10 Doctors by Volume</h3>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.appointmentsByDoctor} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend }: { title: string; value: string | number; trend?: string }) {
  return (
    <div className="flex flex-col justify-between rounded-card border border-[#dde5e9] bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold text-ink-muted">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="font-display text-2xl font-bold text-ink">{value}</h3>
        {trend && <span className="text-[10px] font-medium text-brand-600">{trend}</span>}
      </div>
    </div>
  );
}
