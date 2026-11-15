import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import DataTable from '../../components/common/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Textarea from '../../components/common/Textarea.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { Plus, Edit2, Trash2, Zap, FileSpreadsheet, CheckCircle2, GraduationCap } from 'lucide-react';

const CoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [quickLoadLoading, setQuickLoadLoading] = useState(false);
  const [quickLoadMessage, setQuickLoadMessage] = useState('');
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCourses();
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    reset({
      name: '',
      shortName: '',
      code: '',
      duration: 3,
      totalSemesters: 6,
      description: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    reset({
      name: course.name,
      shortName: course.shortName,
      code: course.code,
      duration: course.duration,
      totalSemesters: course.totalSemesters,
      description: course.description || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setActionLoading(true);
      setFormError('');
      if (editingCourse) {
        await adminService.updateCourse(editingCourse.id, data);
      } else {
        await adminService.createCourse(data);
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;
    try {
      setActionLoading(true);
      await adminService.deleteCourse(deletingCourse.id);
      setIsConfirmOpen(false);
      setDeletingCourse(null);
      fetchCourses();
    } catch (err) {
      console.error('Failed to deactivate course:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickLoad = async () => {
    try {
      setQuickLoadLoading(true);
      setQuickLoadMessage('');
      await adminService.provisionTestStudent();
      setQuickLoadMessage('Standard JCC Curriculum (BCA & BBA, Batches, Semesters & Subjects) loaded successfully!');
      fetchCourses();
      setTimeout(() => setQuickLoadMessage(''), 5000);
    } catch (err) {
      console.error('Failed to load standard curriculum:', err);
    } finally {
      setQuickLoadLoading(false);
    }
  };

  const columns = [
    {
      header: 'Course Code',
      accessor: 'code',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary-600">{row.code}</span>
      ),
    },
    {
      header: 'Course Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-content-primary block text-xs">{row.name}</span>
          <span className="text-[11px] text-content-muted">{row.shortName}</span>
        </div>
      ),
    },
    {
      header: 'Duration',
      accessor: 'duration',
      render: (row) => <span className="text-xs text-content-secondary">{row.duration} Years</span>,
    },
    {
      header: 'Semesters',
      accessor: 'totalSemesters',
      render: (row) => (
        <span className="text-xs text-content-secondary">{row.totalSemesters} Semesters</span>
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
              setDeletingCourse(row);
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
          <h2 className="text-xl font-bold text-content-primary">Academic Courses</h2>
          <p className="text-xs text-content-muted mt-0.5">
            Configure degree programs and courses offered at JCC (BCA, MCA, B.Tech, etc.)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleQuickLoad}
            variant="outline"
            size="sm"
            icon={GraduationCap}
            isLoading={quickLoadLoading}
            className="border-primary-200 text-primary-700 hover:bg-primary-50 font-medium"
          >
            Load Standard Curriculum
          </Button>
          <Link to="/admin/subjects">
            <Button
              variant="outline"
              size="sm"
              icon={FileSpreadsheet}
              className="border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            >
              Excel Bulk Import
            </Button>
          </Link>
          <Button onClick={openCreateModal} icon={Plus} size="sm">
            Add New Course
          </Button>
        </div>
      </div>

      {quickLoadMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{quickLoadMessage}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={courses}
        isLoading={loading}
        emptyMessage="No academic courses created yet."
      />

      {/* Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Edit Course' : 'Create Academic Course'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {formError}
            </div>
          )}

          <Input
            label="Course Full Name"
            placeholder="e.g. Bachelor of Computer Applications"
            required
            {...register('name', { required: true })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Short Name / Acronym"
              placeholder="e.g. BCA"
              required
              {...register('shortName', { required: true })}
            />
            <Input
              label="Course Code"
              placeholder="e.g. BCA-01"
              required
              {...register('code', { required: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (Years)"
              type="number"
              min="1"
              max="10"
              required
              {...register('duration', { required: true })}
            />
            <Input
              label="Total Semesters"
              type="number"
              min="1"
              max="12"
              required
              {...register('totalSemesters', { required: true })}
            />
          </div>

          <Textarea
            label="Description (Optional)"
            placeholder="Brief overview of course"
            rows={2}
            {...register('description')}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              {editingCourse ? 'Save Changes' : 'Create Course'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate Confirm */}
      {deletingCourse && (
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDelete}
          isLoading={actionLoading}
          title="Deactivate Academic Course"
          message={`Are you sure you want to deactivate "${deletingCourse.name} (${deletingCourse.shortName})"?`}
          confirmText="Deactivate Course"
        />
      )}
    </div>
  );
};

export default CoursesList;
