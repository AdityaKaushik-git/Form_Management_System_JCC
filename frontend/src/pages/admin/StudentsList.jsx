import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service.js';
import DataTable from '../../components/common/DataTable.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { formatDate } from '../../utils/helpers.js';
import { Search, Eye, UserCheck, UserX, User } from 'lucide-react';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selected student for modal / status toggle
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await adminService.getStudents({
        page,
        limit: 15,
        search,
        courseId: courseFilter || undefined,
        isActive: statusFilter !== '' ? statusFilter : undefined,
      });

      setStudents(res.data.students || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await adminService.getCourses();
        setCourses(res.data || []);
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, courseFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleToggleStatus = async () => {
    if (!selectedStudent) return;
    try {
      setActionLoading(true);
      await adminService.updateStudentStatus(selectedStudent.id, !selectedStudent.isActive);
      setIsConfirmOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      console.error('Failed to update student status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Enrollment No',
      accessor: 'enrollmentNumber',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary-600">
          {row.studentProfile?.enrollmentNumber || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Student Name',
      accessor: 'fullName',
      render: (row) => (
        <div>
          <span className="font-semibold text-content-primary block text-xs">{row.fullName}</span>
          <span className="text-[11px] text-content-muted">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Course & Batch',
      accessor: 'course',
      render: (row) => (
        <div className="text-xs">
          <span className="text-content-primary block font-medium">
            {row.studentProfile?.course?.shortName || row.studentProfile?.course?.name || 'Not set'}
          </span>
          <span className="text-content-muted text-[11px]">
            {row.studentProfile?.batch?.name || ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'mobile',
      render: (row) => (
        <span className="text-xs text-content-secondary">
          {row.studentProfile?.mobile || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Registered On',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-content-muted">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      header: 'Account Status',
      accessor: 'isActive',
      render: (row) => (
        <Badge variant={row.isActive ? 'active' : 'closed'}>
          {row.isActive ? 'ACTIVE' : 'DEACTIVATED'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedStudent(row);
              setIsViewModalOpen(true);
            }}
          >
            View
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={row.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}
            onClick={() => {
              setSelectedStudent(row);
              setIsConfirmOpen(true);
            }}
          >
            {row.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content-primary">Student Management</h2>
        <p className="text-xs text-content-muted mt-0.5">
          Review registered students, view academic profiles, and manage account statuses
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
          <Input
            placeholder="Search by student name, enrollment no, or email..."
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
            className="text-xs rounded-lg border border-gray-200 py-2 px-3 bg-white text-content-primary focus:outline-none focus:border-primary-500"
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName} - {c.name}
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
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <DataTable
        columns={columns}
        data={students}
        isLoading={loading}
        emptyMessage="No students found matching your criteria."
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          pageSize: 15,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* View Student Profile Modal */}
      {selectedStudent && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedStudent(null);
          }}
          title="Student Academic Profile"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-content-primary">{selectedStudent.fullName}</h4>
                <p className="text-content-muted font-mono">{selectedStudent.studentProfile?.enrollmentNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <span className="text-content-muted block text-[11px]">Email</span>
                <span className="font-semibold text-content-primary">{selectedStudent.email}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <span className="text-content-muted block text-[11px]">Mobile</span>
                <span className="font-semibold text-content-primary">
                  {selectedStudent.studentProfile?.mobile || 'N/A'}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <span className="text-content-muted block text-[11px]">Course</span>
                <span className="font-semibold text-content-primary">
                  {selectedStudent.studentProfile?.course?.name || 'N/A'}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <span className="text-content-muted block text-[11px]">Batch</span>
                <span className="font-semibold text-content-primary">
                  {selectedStudent.studentProfile?.batch?.name || 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-gray-50 rounded-lg">
              <span className="text-content-muted block text-[11px]">Address</span>
              <span className="font-semibold text-content-primary">
                {selectedStudent.studentProfile?.address || 'Not specified'}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Activation/Deactivation */}
      {selectedStudent && (
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => {
            setIsConfirmOpen(false);
            setSelectedStudent(null);
          }}
          onConfirm={handleToggleStatus}
          isLoading={actionLoading}
          title={selectedStudent.isActive ? 'Deactivate Student Account' : 'Activate Student Account'}
          message={`Are you sure you want to ${
            selectedStudent.isActive ? 'deactivate' : 'activate'
          } ${selectedStudent.fullName} (${selectedStudent.studentProfile?.enrollmentNumber})?`}
          variant={selectedStudent.isActive ? 'danger' : 'primary'}
          confirmText={selectedStudent.isActive ? 'Deactivate Account' : 'Activate Account'}
        />
      )}
    </div>
  );
};

export default StudentsList;
