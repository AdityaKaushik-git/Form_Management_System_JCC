import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service.js';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatDateTime, downloadBlob } from '../../utils/helpers.js';
import { FileDown, ArrowLeft, Clock, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

const ApplicationDetail = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await studentService.getApplicationById(id);
        setApplication(res.data);
      } catch (err) {
        console.error('Failed to load application:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [id]);

  const handleDownload = async () => {
    if (!application) return;
    try {
      const blob = await studentService.downloadReceipt(application.id);
      downloadBlob(blob, `JCC-Receipt-${application.referenceNumber}.pdf`);
    } catch (err) {
      console.error('Failed to download receipt:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading application details..." />;
  }

  if (!application) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
        <p className="text-sm text-content-muted">Application not found or unauthorized.</p>
        <Link to="/student/applications" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            Back to Applications
          </Button>
        </Link>
      </div>
    );
  }

  const profile = application.student?.studentProfile;
  const subjects = application.applicationSubjects || [];
  const statusHistory = application.statusHistory || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/student/applications"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-content-secondary hover:text-content-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
        <Button onClick={handleDownload} icon={FileDown} size="sm">
          Download PDF Receipt
        </Button>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
          <div>
            <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
              Reference Number
            </span>
            <span className="text-xl font-mono font-bold text-primary-600 block mt-0.5">
              {application.referenceNumber}
            </span>
            <h2 className="text-base font-bold text-content-primary mt-1">
              {application.form?.title || 'Examination Form'}
            </h2>
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-content-muted block mb-1">Current Status</span>
            <Badge variant={application.status} className="text-xs px-3 py-1">
              {application.status?.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Student and Academic Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-surface-secondary rounded-lg">
            <span className="text-content-muted block mb-0.5">Student Name</span>
            <span className="font-semibold text-content-primary">{application.student?.fullName}</span>
          </div>
          <div className="p-3 bg-surface-secondary rounded-lg">
            <span className="text-content-muted block mb-0.5">Enrollment Number</span>
            <span className="font-semibold text-content-primary font-mono">{profile?.enrollmentNumber}</span>
          </div>
          <div className="p-3 bg-surface-secondary rounded-lg">
            <span className="text-content-muted block mb-0.5">Course</span>
            <span className="font-semibold text-content-primary">
              {application.form?.course?.name || profile?.course?.name || 'N/A'}
            </span>
          </div>
          <div className="p-3 bg-surface-secondary rounded-lg">
            <span className="text-content-muted block mb-0.5">Submission Date</span>
            <span className="font-semibold text-content-primary">
              {formatDateTime(application.submittedAt)}
            </span>
          </div>
        </div>

        {/* Reappear Subjects */}
        <div>
          <h3 className="text-sm font-bold text-content-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-500" />
            Selected Reappear Subjects ({subjects.length})
          </h3>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {subjects.map((sub, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white">
                <div>
                  <span className="font-bold text-content-primary block">{sub.subject?.name}</span>
                  <span className="text-content-muted font-mono">{sub.subject?.code}</span>
                </div>
                <span className="text-content-muted">Credits: {sub.subject?.credits || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status History Timeline */}
        {statusHistory.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Application Status History
            </h3>
            <div className="space-y-4">
              {statusHistory.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase text-content-primary">{h.newStatus}</span>
                      <span className="text-content-muted">• {formatDateTime(h.createdAt)}</span>
                    </div>
                    {h.remarks && (
                      <p className="text-content-secondary mt-0.5 bg-gray-50 p-2 rounded-lg">
                        {h.remarks}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetail;
