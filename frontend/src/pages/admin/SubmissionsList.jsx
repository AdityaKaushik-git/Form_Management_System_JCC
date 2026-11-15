import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import DataTable from '../../components/common/DataTable.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Modal from '../../components/common/Modal.jsx';
import Textarea from '../../components/common/Textarea.jsx';
import { formatDate } from '../../utils/helpers.js';
import { Search, Eye, Edit3, FileDown, CheckCircle2 } from 'lucide-react';

const SubmissionsList = () => {
  const [searchParams] = useSearchParams();
  const initialFormId = searchParams.get('formId') || '';

  const [submissions, setSubmissions] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [formFilter, setFormFilter] = useState(initialFormId);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Status Update Modal State
  const [selectedSub, setSelectedSub] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('approved');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSubmissions({
        page,
        limit: 15,
        search,
        formId: formFilter || undefined,
        status: statusFilter || undefined,
      });

      setSubmissions(res.data.applications || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await adminService.getForms();
        setForms(res.data || []);
      } catch (err) {
        console.error('Failed to load forms list:', err);
      }
    };
    fetchForms();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [page, formFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSubmissions();
  };

  const handleStatusUpdate = async () => {
    if (!selectedSub) return;
    try {
      setUpdating(true);
      await adminService.updateSubmissionStatus(selectedSub.id, {
        status: newStatus,
        remarks,
      });
      setIsStatusModalOpen(false);
      setSelectedSub(null);
      fetchSubmissions();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const openStatusModal = (sub) => {
    setSelectedSub(sub);
    setNewStatus(sub.status);
    setRemarks(sub.remarks || '');
    setIsStatusModalOpen(true);
  };

  const columns = [
    {
      header: 'Reference No',
      accessor: 'referenceNumber',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary-600">
          {row.referenceNumber}
        </span>
      ),
    },
    {
      header: 'Student Name & Enrollment',
      accessor: 'student',
      render: (row) => (
        <div>
          <span className="font-semibold text-content-primary block text-xs">
            {row.student?.fullName || 'N/A'}
          </span>
          <span className="text-[11px] font-mono text-content-muted">
            {row.student?.studentProfile?.enrollmentNumber || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Examination Form',
      accessor: 'form',
      render: (row) => (
        <div className="text-xs">
          <span className="text-content-primary font-medium block">
            {row.form?.title || 'Examination Form'}
          </span>
          <span className="text-content-muted text-[11px]">
            {row.form?.course?.name ? `${row.form.course.name}` : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Reappear Subjects',
      accessor: 'subjects',
      render: (row) => (
        <span className="text-xs text-content-secondary line-clamp-1">
          {(row.applicationSubjects || []).map((s) => s.subject?.code).join(', ') || 'None'}
        </span>
      ),
    },
    {
      header: 'Submitted At',
      accessor: 'submittedAt',
      render: (row) => (
        <span className="text-xs text-content-muted">{formatDate(row.submittedAt)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge variant={row.status}>{row.status?.toUpperCase()}</Badge>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/admin/submissions/${row.id}`}>
            <Button variant="ghost" size="sm" icon={Eye}>
              Review
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            icon={Edit3}
            onClick={() => openStatusModal(row)}
            title="Update Status"
          >
            Status
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary">Student Submissions</h2>
          <p className="text-xs text-content-muted mt-0.5">
            Review submitted examination applications, update workflow statuses, and verify records
          </p>
        </div>
        <Link to="/admin/reports">
          <Button variant="outline" size="sm" icon={FileDown}>
            Export to Excel
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
          <Input
            placeholder="Search by student name, enrollment no, or reference no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            className="text-xs rounded-lg border border-gray-200 py-2 px-3 bg-white text-content-primary focus:outline-none focus:border-primary-500 max-w-xs"
            value={formFilter}
            onChange={(e) => {
              setFormFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Examination Forms</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>

          <select
            className="text-xs rounded-lg border border-gray-200 py-2 px-3 bg-white text-content-primary focus:outline-none focus:border-primary-500"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="correction_required">Correction Required</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={submissions}
        isLoading={loading}
        emptyMessage="No applications found matching your criteria."
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          pageSize: 15,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Update Status Modal */}
      {selectedSub && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedSub(null);
          }}
          title="Update Application Status"
        >
          <div className="space-y-4">
            <div className="p-3 bg-surface-secondary rounded-lg text-xs">
              <span className="text-content-muted block">Student & Reference:</span>
              <span className="font-bold text-content-primary block mt-0.5">
                {selectedSub.student?.fullName} ({selectedSub.referenceNumber})
              </span>
            </div>

            <Select
              label="New Application Status"
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
              label="Administrative Remarks / Notes"
              placeholder="Reason for approval/rejection or instructions for correction..."
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsStatusModalOpen(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} isLoading={updating}>
                Update Status
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SubmissionsList;
