import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service.js';
import { useSocket } from '../../context/SocketContext.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatDateTime } from '../../utils/helpers.js';
import {
  Users,
  FileText,
  FileCheck2,
  FileSpreadsheet,
  Clock,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartsRes, activityRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getDashboardCharts(),
        adminService.getRecentActivity(10),
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
      setActivities(activityRes.data || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time socket event listeners
  useSocket('submission:new', (data) => {
    // Increment submission counter and prepend activity
    setStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        applications: {
          ...prev.applications,
          total: prev.applications.total + 1,
          today: prev.applications.today + 1,
          pending: prev.applications.pending + 1,
        },
      };
    });

    setActivities((prev) => [
      {
        id: `realtime-${Date.now()}`,
        type: 'submission',
        title: 'New Application Submitted',
        description: `New submission received [${data.referenceNumber}]`,
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 9),
    ]);
  });

  useSocket('sheet:synced', () => {
    setStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sheets: {
          ...prev.sheets,
          totalSynced: (prev.sheets?.totalSynced || 0) + 1,
        },
      };
    });
  });

  if (loading) {
    return <LoadingSpinner message="Loading examination dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary">Administrative Dashboard</h2>
          <p className="text-xs text-content-muted mt-0.5">
            Real-time examination overview, student submissions, and Google Sheets synchronization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live System Active
          </span>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.students?.total || 0}
          icon={Users}
          color="blue"
          subtitle="Registered student accounts"
        />
        <StatCard
          title="Active Exam Forms"
          value={stats?.forms?.active || 0}
          icon={FileText}
          color="primary"
          subtitle={`${stats?.forms?.total || 0} total examination forms`}
        />
        <StatCard
          title="Total Submissions"
          value={stats?.applications?.total || 0}
          icon={FileCheck2}
          color="green"
          subtitle={`${stats?.applications?.today || 0} submitted today`}
        />
        <StatCard
          title="Google Sheets Synced"
          value={stats?.sheets?.totalSynced || 0}
          icon={FileSpreadsheet}
          color="purple"
          subtitle={`${stats?.sheets?.totalConnected || 0} connected spreadsheet(s)`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Submissions Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-content-primary">Daily Submission Trends</h3>
              <p className="text-xs text-content-muted">Applications received over the last 14 days</p>
            </div>
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md">
              Daily
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.dailyTrends || []}>
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F47B20" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F47B20" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#777777' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#777777' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  stroke="#F47B20"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubmissions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course-wise Submissions Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-content-primary">Course-wise Distribution</h3>
              <p className="text-xs text-content-muted">Applications grouped by enrolled course</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Courses
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.courseSubmissions || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#777777' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#777777' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="submissions" fill="#F47B20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-Time Live Activity Feed */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-content-primary">Live Activity Stream</h3>
          </div>
          <span className="text-[11px] text-content-muted">Auto-refreshed via Socket.IO</span>
        </div>

        {activities.length === 0 ? (
          <p className="text-xs text-content-muted text-center py-6">No recent activity detected.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {activities.map((item) => (
              <div key={item.id} className="py-3 flex items-start gap-3">
                <div className="mt-1">
                  {item.type === 'sync_success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : item.type === 'sync_failed' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : item.type === 'registration' ? (
                    <Users className="w-4 h-4 text-blue-500" />
                  ) : (
                    <FileCheck2 className="w-4 h-4 text-primary-500" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-content-primary">{item.title}</span>
                    <span className="text-[11px] text-content-muted">
                      {formatDateTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-content-secondary mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
