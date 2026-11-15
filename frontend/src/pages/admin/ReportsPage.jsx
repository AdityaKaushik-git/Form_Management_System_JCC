import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service.js';
import DataTable from '../../components/common/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Badge from '../../components/common/Badge.jsx';
import { downloadBlob, formatDate } from '../../utils/helpers.js';
import { FileSpreadsheet, FileDown, Filter, Calendar } from 'lucide-react';

const ReportsPage = () => {
  const [reportsData, setReportsData] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [formId, setFormId] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await adminService.getReports({
        formId: formId || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setReportsData(res.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
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
        console.error('Failed to load forms:', err);
      }
    };
    fetchForms();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [formId, status]);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const blob = await adminService.exportReportExcel({
        formId: formId || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      downloadBlob(blob, `JCC-Reappear-Report-${Date.now()}.xlsx`);
    } catch (err) {
      console.error('Excel export failed:', err);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const blob = await adminService.exportReportCsv({
        formId: formId || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      downloadBlob(blob, `JCC-Reappear-Report-${Date.now()}.csv`);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExportingCsv(false);
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
      header: 'Enrollment No',
      accessor: 'enrollmentNumber',
      render: (row) => <span className="font-mono text-xs font-semibold">{row.enrollmentNumber}</span>,
    },
    {
      header: 'Student Name',
      accessor: 'studentName',
      render: (row) => <span className="font-semibold text-xs text-content-primary">{row.studentName}</span>,
    },
    {
      header: 'Course & Term',
      accessor: 'course',
      render: (row) => (
        <div className="text-xs">
          <span>{row.course}</span>
          <span className="text-content-muted block text-[11px]">{row.semester}</span>
        </div>
      ),
    },
    {
      header: 'Reappear Subjects',
      accessor: 'subjects',
      render: (row) => (
        <span className="text-xs text-content-secondary line-clamp-1">{row.subjects || 'None'}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Submitted Date',
      accessor: 'submittedAt',
      render: (row) => <span className="text-xs text-content-muted">{row.submittedAt}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary">Examination Reports & Exports</h2>
          <p className="text-xs text-content-muted mt-0.5">
            Filter student reappear records and export to Excel (.xlsx) and CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={FileDown}
            onClick={handleExportCsv}
            isLoading={exportingCsv}
          >
            Export CSV
          </Button>

          <Button
            size="sm"
            icon={FileSpreadsheet}
            onClick={handleExportExcel}
            isLoading={exportingExcel}
          >
            Export Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-content-primary">
          <Filter className="w-3.5 h-3.5 text-primary-500" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <Select
            label="Examination Form"
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
            options={[
              { value: '', label: 'All Examination Forms' },
              ...forms.map((f) => ({ value: f.id, label: f.title })),
            ]}
          />

          <Select
            label="Application Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'correction_required', label: 'Correction Required' },
            ]}
          />

          <Input
            label="From Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            label="To Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button size="sm" onClick={fetchReports}>
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Reports Table */}
      <DataTable
        columns={columns}
        data={reportsData}
        isLoading={loading}
        emptyMessage="No applications match the selected report criteria."
      />
    </div>
  );
};

export default ReportsPage;
