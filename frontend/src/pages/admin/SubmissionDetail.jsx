import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Select from '../../components/common/Select.jsx';
import Textarea from '../../components/common/Textarea.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatDateTime } from '../../utils/helpers.js';
import { ArrowLeft, BookOpen, Clock, CheckCircle2, User, FileText } from 'lucide-react';

const SubmissionDetail = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status update
  const [newStatus, setNewStatus] = useState('approved');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSubmissionById(id);
      setSubmission(res.data);
      setNewStatus(res.data.status);
      setRemarks(res.data.remarks || '');
    } catch (err) {
      console.error('Failed to load submission:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      setUpdateMsg('');
      const res = await adminService.updateSubmissionStatus(id, {
        status: newStatus,
        remarks,
      });
      setSubmission(res.data);
      setUpdateMsg('Status updated successfully');
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading application details..." />;
  }

  if (!submission) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
        <p className="text-sm text-content-muted">Submission record not found.</p>
        <Link to="/admin/submissions" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            Back to Submissions
          </Button>
        </Link>
      </div>
    );
  }

  const profile = submission.student?.studentProfile;
  const fieldValues = submission.fieldValues || [];
  const subjects = submission.applicationSubjects || [];
  const statusHistory = submission.statusHistory || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/admin/submissions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-content-secondary hover:text-content-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Submissions
        </Link>
      </div>

      {/* Main Overview Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
          <div>
            <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
              Application Reference Number
            </span>
            <span className="text-xl font-mono font-bold text-primary-600 block mt-0.5">
              {submission.referenceNumber}
            </span>
            <h2 className="text-base font-bold text-content-primary mt-1">
              {submission.form?.title || 'Examination Form'}
            </h2>
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-content-muted block mb-1">Current Status</span>
            <Badge variant={submission.status} className="text-xs px-3 py-1">
              {submission.status?.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Student Details */}
        <div>
          <h3 className="text-sm font-bold text-content-primary mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            Applicant Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-surface-secondary rounded-lg">
              <span className="text-content-muted block mb-0.5">Student Full Name</span>
              <span className="font-semibold text-content-primary">{submission.student?.fullName}</span>
            </div>
            <div className="p-3 bg-surface-secondary rounded-lg">
              <span className="text-content-muted block mb-0.5">Enrollment Number</span>
              <span className="font-semibold text-content-primary font-mono">{profile?.enrollmentNumber}</span>
            </div>
            <div className="p-3 bg-surface-secondary rounded-lg">
              <span className="text-content-muted block mb-0.5">Email Address</span>
              <span className="font-semibold text-content-primary">{submission.student?.email}</span>
            </div>
            <div className="p-3 bg-surface-secondary rounded-lg">
              <span className="text-content-muted block mb-0.5">Mobile Contact</span>
              <span className="font-semibold text-content-primary">{profile?.mobile || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Custom Fields Answers */}
        {fieldValues.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-content-primary mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              Dynamic Examination Field Responses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {fieldValues.map((fv) => (
                <div key={fv.id} className="p-3 bg-surface-secondary rounded-lg">
                  <span className="text-content-muted block mb-0.5 font-medium">{fv.fieldKey}</span>
                  <span className="font-semibold text-content-primary">{fv.value || 'None'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Status Update Panel */}
        <div className="p-5 bg-primary-50/40 border border-primary-200 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-content-primary">Update Application Workflow Status</h3>

          {updateMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{updateMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={[
                { value: 'submitted', label: 'Submitted' },
                { value: 'under_review', label: 'Under Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'correction_required', label: 'Correction Required' },
              ]}
            />
            <Textarea
              label="Administrative Remarks / Student Note"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide comments or instructions..."
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpdateStatus} isLoading={updating} size="sm">
              Apply Status Update
            </Button>
          </div>
        </div>

        {/* Status History Timeline */}
        {statusHistory.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Status History Trail
            </h3>
            <div className="space-y-4">
              {statusHistory.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase text-content-primary">{h.newStatus}</span>
                      <span className="text-content-muted">• {formatDateTime(h.createdAt)}</span>
                      {h.changer && (
                        <span className="text-content-muted">
                          by {h.changer.fullName} ({h.changer.role})
                        </span>
                      )}
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

export default SubmissionDetail;
