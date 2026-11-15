import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/student.service.js';
import DataTable from '../../components/common/DataTable.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { downloadBlob, formatDate } from '../../utils/helpers.js';
import { FileDown, Eye, FileText } from 'lucide-react';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await studentService.getMyApplications();
        setApplications(res.data || []);
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleDownload = async (id, refNum) => {
    try {
      const blob = await studentService.downloadReceipt(id);
      downloadBlob(blob, `JCC-Receipt-${refNum}.pdf`);
    } catch (err) {
      console.error('Failed to download receipt:', err);
    }
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
      header: 'Examination Form',
      accessor: 'formTitle',
      render: (row) => (
        <div>
          <span className="font-semibold text-content-primary block text-xs">
            {row.form?.title || 'Examination Form'}
          </span>
          <span className="text-[11px] text-content-muted">
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
          {(row.applicationSubjects || []).map((s) => s.subject?.code).join(', ') || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Submission Date',
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
        <div className="flex items-center justify-end gap-2">
          <Link to={`/student/applications/${row.id}`}>
            <Button variant="ghost" size="sm" icon={Eye}>
              View
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            icon={FileDown}
            onClick={() => handleDownload(row.id, row.referenceNumber)}
          >
            Receipt
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary">My Applications</h2>
          <p className="text-xs text-content-muted mt-1">
            Track and download acknowledgement receipts for your reappear examination forms
          </p>
        </div>
        <Link to="/student/forms">
          <Button size="sm" icon={FileText}>
            Apply for Reappear
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={applications}
        isLoading={loading}
        emptyMessage="You have not submitted any reappear applications yet."
      />
    </div>
  );
};

export default MyApplications;
