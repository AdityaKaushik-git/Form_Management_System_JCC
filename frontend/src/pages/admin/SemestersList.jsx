import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { adminService } from '../../services/admin.service.js';
import DataTable from '../../components/common/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const SemestersList = () => {
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingSem, setEditingSem] = useState(null);
  const [deletingSem, setDeletingSem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, reset } = useForm();

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const [semsRes, coursesRes] = await Promise.all([
        adminService.getSemesters(),
        adminService.getCourses(),
      ]);
      setSemesters(semsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error('Failed to load semesters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const openCreateModal = () => {
    setEditingSem(null);
    reset({
      courseId: courses[0]?.id || '',
      number: 1,
      name: 'Semester 1',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sem) => {
    setEditingSem(sem);
    reset({
      courseId: sem.courseId,
      number: sem.number,
      name: sem.name,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setActionLoading(true);
      setFormError('');
      if (editingSem) {
        await adminService.updateSemester(editingSem.id, data);
      } else {
        await adminService.createSemester(data);
      }
      setIsModalOpen(false);
      fetchSemesters();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save semester');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSem) return;
    try {
      setActionLoading(true);
      await adminService.deleteSemester(deletingSem.id);
      setIsConfirmOpen(false);
      setDeletingSem(null);
      fetchSemesters();
    } catch (err) {
      console.error('Failed to deactivate semester:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Semester',
      accessor: 'name',
      render: (row) => <span className="font-semibold text-content-primary text-xs">{row.name}</span>,
    },
    {
      header: 'Course',
      accessor: 'course',
      render: (row) => (
        <span className="text-xs text-content-secondary">
          {row.course?.name || 'N/A'} ({row.course?.shortName || ''})
        </span>
      ),
    },
    {
      header: 'Number',
      accessor: 'number',
      render: (row) => (
        <span className="text-xs font-mono text-content-muted">Sem #{row.number}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <Badge variant={row.isActive ? 'active' : 'closed'}>
          {row.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            icon={Trash2}
            onClick={() => {
              setDeletingSem(row);
              setIsConfirmOpen(true);
            }}
          >
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary">Semesters</h2>
          <p className="text-xs text-content-muted mt-0.5">
            Configure semesters for courses and assign examination terms
          </p>
        </div>
        <Button onClick={openCreateModal} icon={Plus} size="sm">
          Add New Semester
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={semesters}
        isLoading={loading}
        emptyMessage="No semesters configured yet."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSem ? 'Edit Semester' : 'Create Semester'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {formError}
            </div>
          )}

          <Select
            label="Course"
            required
            options={courses.map((c) => ({ value: c.id, label: `${c.name} (${c.shortName})` }))}
            {...register('courseId', { required: true })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Semester Number"
              type="number"
              min="1"
              max="12"
              required
              {...register('number', { required: true })}
            />
            <Input
              label="Display Name"
              placeholder="e.g. Semester 1"
              required
              {...register('name', { required: true })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              {editingSem ? 'Save Changes' : 'Create Semester'}
            </Button>
          </div>
        </form>
      </Modal>

      {deletingSem && (
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDelete}
          isLoading={actionLoading}
          title="Deactivate Semester"
          message={`Are you sure you want to deactivate "${deletingSem.name}"?`}
          confirmText="Deactivate Semester"
        />
      )}
    </div>
  );
};

export default SemestersList;
