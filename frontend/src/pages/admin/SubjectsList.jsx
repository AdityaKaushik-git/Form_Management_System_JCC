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
import { downloadBlob } from '../../utils/helpers.js';
import {
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const SubjectsList = () => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deletingSubject, setDeletingSubject] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Bulk Import Excel state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');

  // Course & Semester filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');

  const { register, handleSubmit, reset, watch } = useForm();
  const selectedCourseInForm = watch('courseId');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSubjects({
        courseId: selectedCourseFilter || undefined,
      });
      setSubjects(res.data || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          adminService.getCourses(),
          adminService.getSemesters(),
        ]);
        setCourses(cRes.data || []);
        setSemesters(sRes.data || []);
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [selectedCourseFilter]);

  const openCreateModal = () => {
    setEditingSubject(null);
    reset({
      courseId: courses[0]?.id || '',
      semesterId: semesters[0]?.id || '',
      name: '',
      code: '',
      credits: 4,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setEditingSubject(sub);
    reset({
      courseId: sub.courseId,
      semesterId: sub.semesterId,
      name: sub.name,
      code: sub.code,
      credits: sub.credits,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setActionLoading(true);
      setFormError('');
      if (editingSubject) {
        await adminService.updateSubject(editingSubject.id, data);
      } else {
        await adminService.createSubject(data);
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save subject');
    } finally {
      setActionLoading(false);
    }
  };

  const openImportModal = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError('');
    setIsImportModalOpen(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      setTemplateLoading(true);
      const blob = await adminService.downloadCurriculumTemplate();
      downloadBlob(blob, 'JCC_Curriculum_Syllabus_Template.xlsx');
    } catch (err) {
      console.error('Failed to download template:', err);
      setImportError('Failed to download syllabus template. Please try again.');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setImportError('Please select a valid Excel file (.xlsx or .xls) to upload.');
      return;
    }

    try {
      setImportLoading(true);
      setImportError('');
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', importFile);

      const res = await adminService.importCurriculum(formData);
      setImportResult(res.data);

      // Refresh metadata and subjects
      const [cRes, sRes] = await Promise.all([
        adminService.getCourses(),
        adminService.getSemesters(),
      ]);
      setCourses(cRes.data || []);
      setSemesters(sRes.data || []);
      fetchSubjects();
    } catch (err) {
      setImportError(err.response?.data?.message || 'Failed to import curriculum Excel file.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSubject) return;
    try {
      setActionLoading(true);
      await adminService.deleteSubject(deletingSubject.id);
      setIsConfirmOpen(false);
      setDeletingSubject(null);
      fetchSubjects();
    } catch (err) {
      console.error('Failed to deactivate subject:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter semesters for the selected course in modal
  const filteredSemestersForModal = selectedCourseInForm
    ? semesters.filter((s) => s.courseId === selectedCourseInForm)
    : semesters;

  const columns = [
    {
      header: 'Subject Code',
      accessor: 'code',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary-600">{row.code}</span>
      ),
    },
    {
      header: 'Subject Name',
      accessor: 'name',
      render: (row) => <span className="font-semibold text-content-primary text-xs">{row.name}</span>,
    },
    {
      header: 'Course',
      accessor: 'course',
      render: (row) => (
        <span className="text-xs text-content-secondary">{row.course?.shortName || 'N/A'}</span>
      ),
    },
    {
      header: 'Semester',
      accessor: 'semester',
      render: (row) => (
        <span className="text-xs text-content-muted">{row.semester?.name || 'N/A'}</span>
      ),
    },
    {
      header: 'Credits',
      accessor: 'credits',
      render: (row) => <span className="text-xs text-content-secondary">{row.credits}</span>,
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
              setDeletingSubject(row);
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
          <h2 className="text-xl font-bold text-content-primary">Academic Subjects</h2>
          <p className="text-xs text-content-muted mt-0.5">
            Manage course curriculum subjects, codes, credits, and semester assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={openImportModal}
            variant="outline"
            size="sm"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            icon={FileSpreadsheet}
          >
            Import Syllabus Excel
          </Button>
          <Button onClick={openCreateModal} icon={Plus} size="sm">
            Add New Subject
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-content-muted font-medium">Filter by Course:</span>
          <select
            className="rounded-lg border border-gray-200 py-1.5 px-3 bg-white text-content-primary focus:outline-none focus:border-primary-500 text-xs"
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName} - {c.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-content-muted">{subjects.length} subject(s)</span>
      </div>

      <DataTable
        columns={columns}
        data={subjects}
        isLoading={loading}
        emptyMessage="No academic subjects configured."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Course"
              required
              options={courses.map((c) => ({ value: c.id, label: `${c.shortName} - ${c.name}` }))}
              {...register('courseId', { required: true })}
            />
            <Select
              label="Semester"
              required
              options={filteredSemestersForModal.map((s) => ({ value: s.id, label: s.name }))}
              {...register('semesterId', { required: true })}
            />
          </div>

          <Input
            label="Subject Full Name"
            placeholder="e.g. Data Structures and Algorithms"
            required
            {...register('name', { required: true })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject Code"
              placeholder="e.g. BCA-201"
              required
              {...register('code', { required: true })}
            />
            <Input
              label="Credits"
              type="number"
              min="0"
              max="20"
              required
              {...register('credits', { required: true })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Modal>

      {deletingSubject && (
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDelete}
          isLoading={actionLoading}
          title="Deactivate Subject"
          message={`Are you sure you want to deactivate "${deletingSubject.name} (${deletingSubject.code})"?`}
          confirmText="Deactivate Subject"
        />
      )}

      {/* Excel Bulk Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Curriculum & Syllabus via Excel"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              Automated Curriculum & Subject Ingestion
            </p>
            <p className="text-blue-700">
              Upload your syllabus Excel file to instantly generate courses, batches (e.g. 2024–2027),
              semesters (1–8), and subjects with credits and codes.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <div>
              <p className="text-xs font-bold text-content-primary">Curriculum Excel Template</p>
              <p className="text-[11px] text-content-muted">Pre-formatted with sample BCA and BBA syllabus rows</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              isLoading={templateLoading}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          </div>

          {importError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}

          {importResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Curriculum Imported Successfully!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-gray-500 block">Total Rows Processed:</span>
                  <span className="font-bold text-sm text-content-primary">{importResult.totalRows}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-gray-500 block">Courses Created:</span>
                  <span className="font-bold text-sm text-content-primary">{importResult.coursesCreated}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-gray-500 block">Batches Created:</span>
                  <span className="font-bold text-sm text-content-primary">{importResult.batchesCreated}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-gray-500 block">Semesters Created:</span>
                  <span className="font-bold text-sm text-content-primary">{importResult.semestersCreated}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-gray-500 block">Subjects Created:</span>
                  <span className="font-bold text-sm text-content-primary">{importResult.subjectsCreated}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-gray-500 block">Subjects Updated:</span>
                  <span className="font-bold text-sm text-content-primary">{importResult.subjectsUpdated}</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleImportSubmit} className="space-y-4 pt-1">
            <div className="border-2 border-dashed border-gray-200 hover:border-primary-400 rounded-xl p-5 text-center transition-colors">
              <Upload className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <label className="cursor-pointer block">
                <span className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                  Click to choose file
                </span>{' '}
                <span className="text-xs text-content-muted">or drag & drop</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImportFile(file);
                      setImportError('');
                    }
                  }}
                />
              </label>
              <p className="text-[11px] text-content-muted mt-1">Accepts standard Excel .xlsx / .xls files</p>
              {importFile && (
                <div className="mt-3 p-2 bg-primary-50 rounded-lg text-xs font-medium text-primary-800 flex items-center justify-between">
                  <span className="truncate max-w-xs">{importFile.name}</span>
                  <span className="text-[10px] text-primary-600">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                disabled={importLoading}
              >
                Close
              </Button>
              <Button
                type="submit"
                isLoading={importLoading}
                disabled={!importFile}
                icon={Upload}
              >
                Upload & Ingest Curriculum
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default SubjectsList;
