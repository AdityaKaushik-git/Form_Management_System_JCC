import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import DataTable from '../../components/common/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { formatDateTime } from '../../utils/helpers.js';
import {
  Plus,
  Edit2,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  FileCheck2,
  Trash2,
} from 'lucide-react';

const FormsList = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
        <Link to="/admin/forms/create">
          <Button icon={Plus} size="sm">
            Create Examination Form
          </Button>
        </Link>
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
    </div>
  );
};

export default FormsList;
