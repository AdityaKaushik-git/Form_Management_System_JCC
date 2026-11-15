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

const BatchesList = () => {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, reset } = useForm();

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const [batchesRes, coursesRes] = await Promise.all([
        adminService.getBatches(),
        adminService.getCourses(),
      ]);
      setBatches(batchesRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const openCreateModal = () => {
    setEditingBatch(null);
    reset({
      courseId: courses[0]?.id || '',
      name: '',
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 3,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    reset({
      courseId: batch.courseId,
      name: batch.name,
      startYear: batch.startYear,
      endYear: batch.endYear,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setActionLoading(true);
      setFormError('');
      if (editingBatch) {
        await adminService.updateBatch(editingBatch.id, data);
      } else {
        await adminService.createBatch(data);
      }
      setIsModalOpen(false);
      fetchBatches();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save batch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBatch) return;
    try {
      setActionLoading(true);
      await adminService.deleteBatch(deletingBatch.id);
      setIsConfirmOpen(false);
      setDeletingBatch(null);
      fetchBatches();
    } catch (err) {
      console.error('Failed to deactivate batch:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Batch Name',
      accessor: 'name',
      render: (row) => <span className="font-semibold text-content-primary text-xs">{row.name}</span>,
    },
    {
      header: 'Associated Course',
      accessor: 'course',
      render: (row) => (
        <span className="text-xs text-content-secondary">
          {row.course?.name || 'N/A'} ({row.course?.shortName || ''})
        </span>
      ),
    },
    {
      header: 'Academic Years',
      accessor: 'years',
      render: (row) => (
        <span className="text-xs font-mono text-content-primary">
          {row.startYear} – {row.endYear}
        </span>
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
              setDeletingBatch(row);
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
          <h2 className="text-xl font-bold text-content-primary">Academic Batches</h2>
          <p className="text-xs text-content-muted mt-0.5">
            Manage course batches (e.g. BCA 2024–2027, MCA 2025–2027)
          </p>
        </div>
        <Button onClick={openCreateModal} icon={Plus} size="sm">
          Add New Batch
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        isLoading={loading}
        emptyMessage="No batches configured yet."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBatch ? 'Edit Batch' : 'Create Academic Batch'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {formError}
            </div>
          )}

          <Select
            label="Select Course"
            required
            options={courses.map((c) => ({ value: c.id, label: `${c.name} (${c.shortName})` }))}
            {...register('courseId', { required: true })}
          />

          <Input
            label="Batch Name"
            placeholder="e.g. BCA 2024–2027"
            required
            {...register('name', { required: true })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Year"
              type="number"
              min="2000"
              max="2100"
              required
              {...register('startYear', { required: true })}
            />
            <Input
              label="End Year"
              type="number"
              min="2000"
              max="2100"
              required
              {...register('endYear', { required: true })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              {editingBatch ? 'Save Changes' : 'Create Batch'}
            </Button>
          </div>
        </form>
      </Modal>

      {deletingBatch && (
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDelete}
          isLoading={actionLoading}
          title="Deactivate Academic Batch"
          message={`Are you sure you want to deactivate "${deletingBatch.name}"?`}
          confirmText="Deactivate Batch"
        />
      )}
    </div>
  );
};

export default BatchesList;
