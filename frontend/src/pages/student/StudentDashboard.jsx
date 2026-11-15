import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { studentService } from '../../services/student.service.js';
import StatCard from '../../components/common/StatCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatDate } from '../../utils/helpers.js';
import { FileText, History, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await studentService.getDashboard();
        setDashboardData(res.data);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  const profile = dashboardData?.studentProfile || user?.studentProfile;
  const recentApps = dashboardData?.recentApplications || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold mb-2">
            Student Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.fullName || 'Student'}!
          </h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
            Enrollment No: <span className="font-bold text-white">{profile?.enrollmentNumber || 'N/A'}</span> •{' '}
            {profile?.course?.name ? `${profile.course.name} (${profile.course.shortName})` : 'Course Not Assigned'}
          </p>
        </div>

        <div className="shrink-0">
          <Link to="/student/forms">
            <Button variant="secondary" className="shadow-sm">
              View Available Forms
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Reappear Forms"
          value={dashboardData?.activeFormsCount || 0}
          icon={FileText}
          color="primary"
          subtitle="Open for applications"
        />
        <StatCard
          title="Submitted Applications"
          value={dashboardData?.totalApplications || 0}
          icon={History}
          color="blue"
          subtitle="All time submissions"
        />
        <StatCard
          title="Academic Course"
          value={profile?.course?.shortName || 'Not Set'}
          icon={GraduationCap}
          color="green"
          subtitle={profile?.batch?.name || 'Batch N/A'}
        />
      </div>

      {/* Recent Applications Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-content-primary">Recent Reappear Applications</h3>
            <p className="text-xs text-content-muted">Track your recent submissions and statuses</p>
          </div>
          <Link to="/student/applications" className="text-xs font-semibold text-primary-600 hover:underline">
            View All
          </Link>
        </div>

        {recentApps.length === 0 ? (
          <div className="text-center py-8 text-content-muted text-xs border border-dashed border-gray-200 rounded-xl">
            You haven&apos;t submitted any reappear applications yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-semibold text-content-secondary uppercase">
                  <th className="py-2.5 px-3">Reference No</th>
                  <th className="py-2.5 px-3">Examination Form</th>
                  <th className="py-2.5 px-3">Submitted On</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/70">
                    <td className="py-3 px-3 font-mono text-xs font-bold text-primary-600">
                      {app.referenceNumber}
                    </td>
                    <td className="py-3 px-3 text-xs font-medium text-content-primary">
                      {app.form?.title || 'Examination Form'}
                    </td>
                    <td className="py-3 px-3 text-xs text-content-muted">
                      {formatDate(app.submittedAt)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={app.status}>{app.status?.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link to={`/student/applications/${app.id}`}>
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
