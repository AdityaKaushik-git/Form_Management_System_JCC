import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import DataTable from '../../components/common/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { formatDateTime } from '../../utils/helpers.js';
import {
  Plus,
  Edit2,
  FileSpreadsheet,
  CheckCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  FileCheck2,
  Trash2,
  Zap,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const FormsList = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Auto-Generate Forms Modal state
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [autoSessionType, setAutoSessionType] = useState('odd');
  const [autoAcademicYear, setAutoAcademicYear] = useState('2026-2027');
  const [autoExamSession, setAutoExamSession] = useState('');
  const [autoCourseId, setAutoCourseId] = useState('');
  const [autoBatchId, setAutoBatchId] = useState('');
  const [autoPermanentActive, setAutoPermanentActive] = useState(true);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoError, setAutoError] = useState('');
  const [autoSuccessResult, setAutoSuccessResult] = useState(null);

  // Modal actions
  const [activeAction, setActiveAction] = useState(null); // { type: 'publish' | 'close' | 'reopen' | 'delete', form: object }

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await adminService.getForms();
      let data = res.data || [];
      if (statusFilter) {
        data = data.filter((f) => f.effectiveStatus === statusFilter);
      }
      setForms(data);
    } catch (err) {
      console.error('Failed to load forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [statusFilter]);

  const handleActionConfirm = async () => {
    if (!activeAction) return;
    const { type, form } = activeAction;

    try {
      setActionLoading(true);
      if (type === 'publish') await adminService.publishForm(form.id);
      else if (type === 'close') await adminService.closeForm(form.id);
      else if (type === 'reopen') await adminService.reopenForm(form.id);
      else if (type === 'delete') await adminService.deleteForm(form.id);

      setActiveAction(null);
      fetchForms();
    } catch (err) {
      console.error(`Failed to ${type} form:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const openAutoGenerateModal = async () => {
    setAutoError('');
    setAutoSuccessResult(null);
    setIsAutoModalOpen(true);
    try {
      const [cRes, bRes] = await Promise.all([
        adminService.getCourses(),
        adminService.getBatches(),
      ]);
      setCourses(cRes.data || []);
      setBatches(bRes.data || []);
    } catch (err) {
      console.error('Failed to load metadata for auto-generate:', err);
    }
  };

  const handleAutoGenerateSubmit = async (e) => {
    e.preventDefault();
    try {
      setAutoGenerating(true);
      setAutoError('');
      setAutoSuccessResult(null);

      const res = await adminService.autoGenerateForms({
        sessionType: autoSessionType,
        academicYear: autoAcademicYear,
        examSession: autoExamSession || undefined,
        courseId: autoCourseId || undefined,
        batchId: autoBatchId || undefined,
        isPermanentActive: autoPermanentActive,
      });

      setAutoSuccessResult(res.data);
      fetchForms();
    } catch (err) {
      setAutoError(err.response?.data?.message || 'Failed to auto-generate examination forms.');
    } finally {
      setAutoGenerating(false);
    }
  };

  const columns = [
    {
      header: 'Form Title & Session',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-semibold text-content-primary block text-xs">{row.title}</span>
          <span className="text-[11px] text-content-muted">
            {row.examName} • {row.examSession || 'Session N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Course & Term',
      accessor: 'course',
      render: (row) => (
        <div className="text-xs">
          <span className="text-content-primary font-medium block">
            {row.course?.name || 'All Eligible Courses'}
          </span>
          <span className="text-content-muted text-[11px]">
            {row.semester?.name ? `${row.semester.name}` : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Scheduled Window',
      accessor: 'dates',
      render: (row) => (
        <div className="text-xs">
          <span className="text-content-primary block">
            From: {formatDateTime(row.startDate, 'DD MMM, hh:mm A')}
          </span>
          <span className="text-content-muted">
            To:{' '}
            {row.isPermanentActive ? (
              <span className="text-emerald-600 font-semibold">Permanent Active</span>
            ) : row.endDate ? (
              formatDateTime(row.endDate, 'DD MMM, hh:mm A')
            ) : (
              'Open'
            )}
          </span>
        </div>
      ),
    },
    {
      header: 'Effective Status',
      accessor: 'effectiveStatus',
      render: (row) => (
        <Badge variant={row.effectiveStatus}>{row.effectiveStatus?.toUpperCase()}</Badge>
      ),
    },
    {
      header: 'Submissions',
      accessor: 'totalSubmissions',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-content-primary">
          {row.totalSubmissions || 0}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Submissions link */}
          <Link to={`/admin/submissions?formId=${row.id}`}>
            <Button variant="ghost" size="sm" title="View Submissions">
              <FileCheck2 className="w-3.5 h-3.5" />
            </Button>
          </Link>

          {/* Connected Sheets link */}
          <Link to={`/admin/forms/${row.id}/sheets`}>
            <Button variant="ghost" size="sm" title="Connected Google Sheets">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            </Button>
          </Link>

          {/* Edit builder */}
          <Link to={`/admin/forms/${row.id}/edit`}>
            <Button variant="ghost" size="sm" title="Edit Form">
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </Link>

          {/* State Controls: Publish / Close / Reopen */}
          {!row.isPublished ? (
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs px-2 py-1"
              onClick={() => setActiveAction({ type: 'publish', form: row })}
            >
              Publish
            </Button>
          ) : row.isManuallyClosed ? (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-700 border-amber-200 hover:bg-amber-50 text-xs px-2 py-1"
              onClick={() => setActiveAction({ type: 'reopen', form: row })}
            >
              Reopen
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-red-700 border-red-200 hover:bg-red-50 text-xs px-2 py-1"
              onClick={() => setActiveAction({ type: 'close', form: row })}
            >
              Close
            </Button>
          )}

          {!row.isPublished && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => setActiveAction({ type: 'delete', form: row })}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary">Examination Forms</h2>
          <p className="text-xs text-content-muted mt-0.5">
            Manage dynamic examination forms, publication status, and scheduling windows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={openAutoGenerateModal}
            variant="outline"
            size="sm"
            className="border-primary-200 text-primary-700 hover:bg-primary-50 font-semibold"
            icon={Zap}
          >
            ⚡ Auto-Generate Forms
          </Button>
          <Link to="/admin/forms/create">
            <Button icon={Plus} size="sm">
              Create Examination Form
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Filter Tab Pills */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto text-xs">
        {['', 'active', 'upcoming', 'closed', 'draft'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-content-secondary hover:bg-gray-100'
            }`}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All Forms'}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={forms}
        isLoading={loading}
        emptyMessage="No examination forms found."
      />

      {/* Confirmation Dialogs */}
      {activeAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setActiveAction(null)}
          onConfirm={handleActionConfirm}
          isLoading={actionLoading}
          title={
            activeAction.type === 'publish'
              ? 'Publish Examination Form'
              : activeAction.type === 'close'
              ? 'Manually Close Form'
              : activeAction.type === 'reopen'
              ? 'Reopen Examination Form'
              : 'Delete Draft Form'
          }
          message={
            activeAction.type === 'publish'
              ? `Publish "${activeAction.form.title}"? Students will immediately be able to view and apply once scheduled.`
              : activeAction.type === 'close'
              ? `Manually close "${activeAction.form.title}"? This overrides Permanent Active mode and immediately halts all student submissions.`
              : activeAction.type === 'reopen'
              ? `Reopen "${activeAction.form.title}" for submissions?`
              : `Permanently delete draft "${activeAction.form.title}"?`
          }
          variant={activeAction.type === 'close' || activeAction.type === 'delete' ? 'danger' : 'primary'}
          confirmText={
            activeAction.type === 'publish'
              ? 'Publish Now'
              : activeAction.type === 'close'
              ? 'Close Form'
              : activeAction.type === 'reopen'
              ? 'Reopen Form'
              : 'Delete Draft'
          }
        />
      )}

      {/* Automated Form Generator Modal */}
      <Modal
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
        title="⚡ Automated Examination Form Generator"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>JCC Automatic Semester Progression & Eligibility Rules</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              • <strong>Odd Semester Sessions:</strong> Students (e.g. Batch 2024–2027) are strictly eligible for <strong>Semesters 1, 3, 5, 7</strong> reappear subjects.<br />
              • <strong>Even Semester Sessions:</strong> Students are strictly eligible for <strong>Semesters 2, 4, 6, 8</strong> reappear subjects.<br />
              Forms, eligible subjects, and default dynamic fields will be generated and published automatically.
            </p>
          </div>

          {autoError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{autoError}</span>
            </div>
          )}

          {autoSuccessResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Generated {autoSuccessResult.formsCreated} Examination Form(s) Successfully!</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800 max-h-36 overflow-y-auto pl-1">
                {(autoSuccessResult.forms || []).map((f) => (
                  <li key={f.id} className="truncate">
                    <strong>{f.title}</strong> ({f.course?.shortName || 'Course'} - {f.batch?.name || 'All Batches'})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleAutoGenerateSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Session Type & Semester Eligibility *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    autoSessionType === 'odd'
                      ? 'border-primary-500 bg-primary-50/50 text-primary-900 font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-content-secondary'
                  }`}
                >
                  <input
                    type="radio"
                    name="sessionType"
                    value="odd"
                    checked={autoSessionType === 'odd'}
                    onChange={() => setAutoSessionType('odd')}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span>Odd Semesters (1, 3, 5, 7)</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    autoSessionType === 'even'
                      ? 'border-primary-500 bg-primary-50/50 text-primary-900 font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-content-secondary'
                  }`}
                >
                  <input
                    type="radio"
                    name="sessionType"
                    value="even"
                    checked={autoSessionType === 'even'}
                    onChange={() => setAutoSessionType('even')}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span>Even Semesters (2, 4, 6, 8)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-content-primary mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  required
                  value={autoAcademicYear}
                  onChange={(e) => setAutoAcademicYear(e.target.value)}
                  placeholder="e.g. 2026-2027"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-content-primary mb-1">
                  Target Course
                </label>
                <select
                  value={autoCourseId}
                  onChange={(e) => setAutoCourseId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 focus:border-primary-500 focus:outline-none bg-white"
                >
                  <option value="">All Active Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-content-primary mb-1">
                  Target Batch
                </label>
                <select
                  value={autoBatchId}
                  onChange={(e) => setAutoBatchId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 focus:border-primary-500 focus:outline-none bg-white"
                >
                  <option value="">All Active Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.course?.shortName || 'Course'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-content-primary mb-1">
                  Custom Session Name (Optional)
                </label>
                <input
                  type="text"
                  value={autoExamSession}
                  onChange={(e) => setAutoExamSession(e.target.value)}
                  placeholder="e.g. Odd Sem Reappear 2026"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPermanentActive}
                  onChange={(e) => setAutoPermanentActive(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <span className="font-medium text-content-primary">
                  Permanent Active Mode (Form remains open indefinitely until manually closed)
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsAutoModalOpen(false)}
                disabled={autoGenerating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={autoGenerating}
                icon={Zap}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Auto-Generate & Publish Forms
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default FormsList;
