import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service.js';
import DataTable from '../../components/common/DataTable.jsx';
import Badge from '../../components/common/Badge.jsx';
import { formatDateTime } from '../../utils/helpers.js';
import { ShieldAlert } from 'lucide-react';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs({ page, limit: 20 });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-content-muted">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      header: 'Admin User',
      accessor: 'user',
      render: (row) => (
        <span className="text-xs font-semibold text-content-primary">
          {row.user?.fullName || 'System'}
        </span>
      ),
    },
    {
      header: 'Action Performed',
      accessor: 'action',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
          {row.action}
        </span>
      ),
    },
    {
      header: 'Target Entity',
      accessor: 'entity',
      render: (row) => (
        <span className="text-xs text-content-secondary">
          {row.entity} {row.entityId ? `#${row.entityId.slice(0, 8)}...` : ''}
        </span>
      ),
    },
    {
      header: 'IP Address',
      accessor: 'ipAddress',
      render: (row) => (
        <span className="font-mono text-[11px] text-content-muted">
          {row.ipAddress || '127.0.0.1'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-content-primary">Security Audit Logs</h2>
          <p className="text-xs text-content-muted">
            Immutable tracking of administrative actions and examination form state transitions
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        emptyMessage="No audit log events recorded yet."
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          pageSize: 20,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />
    </div>
  );
};

export default AuditLogsPage;
