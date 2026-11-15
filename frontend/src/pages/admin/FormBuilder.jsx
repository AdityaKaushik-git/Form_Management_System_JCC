import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Textarea from '../../components/common/Textarea.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { FIELD_TYPES } from '../../utils/constants.js';
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  Save,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Copy,
  Layers,
} from 'lucide-react';

const FormBuilder = () => {
  const { id } = useParams(); // If present, editing existing form
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [examName, setExamName] = useState('');
  const [examSession, setExamSession] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [examType, setExamType] = useState('reappear');

  // Scheduling State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPermanentActive, setIsPermanentActive] = useState(false);

  // Dynamic Fields
  const [fields, setFields] = useState([]);

  // Applicable Subjects
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  // Preview Mode
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch dropdowns and existing form if editing
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [cRes, sRes, subRes] = await Promise.all([
          adminService.getCourses(),
          adminService.getSemesters(),
          adminService.getSubjects({}),
        ]);
        setCourses(cRes.data || []);
        setSemesters(sRes.data || []);
        setSubjects(subRes.data || []);

        if (id) {
          const formRes = await adminService.getFormById(id);
          const f = formRes.data;
          setTitle(f.title || '');
          setExamName(f.examName || '');
          setExamSession(f.examSession || '');
          setDescription(f.description || '');
          setInstructions(f.instructions || '');
          setCourseId(f.courseId || '');
          setSemesterId(f.semesterId || '');
          setExamType(f.examType || 'reappear');
          setStartDate(f.startDate ? f.startDate.slice(0, 16) : '');
          setEndDate(f.endDate ? f.endDate.slice(0, 16) : '');
          setIsPermanentActive(f.isPermanentActive || false);
          setFields(f.fields || []);
          setSelectedSubjectIds((f.formSubjects || []).map((fs) => fs.subjectId || fs.subject?.id));
        } else {
          // Defaults for new form
          const nowStr = new Date().toISOString().slice(0, 16);
          setStartDate(nowStr);
        }
      } catch (err) {
        setErrorMsg('Failed to initialize form builder');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // Filter subjects by selected course/semester if configured
  const filteredSubjects = subjects.filter((s) => {
    if (courseId && s.courseId !== courseId) return false;
    if (semesterId && s.semesterId !== semesterId) return false;
    return true;
  });

  const addField = () => {
    const key = `field_${Date.now().toString(36)}`;
    const newField = {
      fieldLabel: 'New Question / Field',
      fieldKey: key,
      fieldType: 'text',
      placeholder: '',
      description: '',
      isRequired: false,
      defaultValue: '',
      minLength: null,
      maxLength: null,
      minValue: null,
      maxValue: null,
      options: ['Option 1', 'Option 2'],
      displayOrder: fields.length,
      isVisible: true,
      isSyncEligible: true,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    // Auto-update field key if label changes and key was default
    if (key === 'fieldLabel' && updated[index].fieldKey.startsWith('field_')) {
      const sanitized = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 30);
      if (sanitized) updated[index].fieldKey = sanitized;
    }
    setFields(updated);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const moveField = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setFields(updated);
  };

  const duplicateField = (index) => {
    const target = fields[index];
    const dup = {
      ...target,
      id: undefined,
      fieldKey: `${target.fieldKey}_copy_${Date.now().toString(36).slice(0, 4)}`,
      fieldLabel: `${target.fieldLabel} (Copy)`,
    };
    const updated = [...fields];
    updated.splice(index + 1, 0, dup);
    setFields(updated);
  };

  const toggleSubjectSelect = (subId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((i) => i !== subId) : [...prev, subId]
    );
  };

  const handleSave = async (publish = false) => {
    if (!title.trim() || !examName.trim() || !startDate) {
      setErrorMsg('Please fill in required basic fields (Title, Exam Name, Start Date)');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const payload = {
        title,
        examName,
        examSession,
        description,
        instructions,
        courseId: courseId || null,
        semesterId: semesterId || null,
        examType,
        startDate,
        endDate: isPermanentActive ? null : endDate || null,
        isPermanentActive,
        isPublished: publish,
        fields,
        subjectIds: selectedSubjectIds,
      };

      if (id) {
        await adminService.updateForm(id, payload);
        if (publish) await adminService.publishForm(id);
      } else {
        const created = await adminService.createForm(payload);
        if (publish) await adminService.publishForm(created.data.id);
      }

      navigate('/admin/forms');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save examination form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading examination form builder..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary">
            {id ? 'Edit Examination Form' : 'Dynamic Form Builder'}
          </h2>
          <p className="text-xs text-content-muted mt-0.5">
            Configure form metadata, permanent scheduling, custom fields, and assignable subjects
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? 'Back to Editor' : 'Live Preview'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Save}
            isLoading={saving}
            onClick={() => handleSave(false)}
          >
            Save Draft
          </Button>

          <Button
            size="sm"
            icon={CheckCircle2}
            isLoading={saving}
            onClick={() => handleSave(true)}
          >
            Publish Form
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* LIVE PREVIEW MODE */}
      {isPreview ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider block">
              {examType} Examination Preview
            </span>
            <h3 className="text-xl font-bold text-content-primary mt-1">{title || 'Untitled Form'}</h3>
            <p className="text-xs text-content-muted mt-0.5">
              {examName} {examSession ? `• ${examSession}` : ''}
            </p>
            {instructions && (
              <p className="text-xs text-content-secondary mt-2 bg-gray-50 p-3 rounded-lg">
                {instructions}
              </p>
            )}
          </div>

          {/* Render Preview of Fields */}
          <div className="space-y-4">
            {fields.map((f, idx) => (
              <div key={idx} className="space-y-1">
                <label className="block text-xs font-semibold text-content-primary">
                  {f.fieldLabel} {f.isRequired && <span className="text-red-500">*</span>}
                </label>
                {f.fieldType === 'textarea' ? (
                  <textarea
                    rows={2}
                    className="w-full text-xs rounded-lg border border-gray-200 p-2"
                    placeholder={f.placeholder}
                    disabled
                  />
                ) : f.fieldType === 'dropdown' ? (
                  <select className="w-full text-xs rounded-lg border border-gray-200 p-2" disabled>
                    <option>{f.placeholder || 'Select option'}</option>
                  </select>
                ) : (
                  <input
                    type={f.fieldType}
                    className="w-full text-xs rounded-lg border border-gray-200 p-2"
                    placeholder={f.placeholder}
                    disabled
                  />
                )}
                {f.description && <p className="text-[10px] text-content-muted">{f.description}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* BUILDER EDITOR MODE */
        <div className="space-y-6">
          {/* SECTION 1: Form Basic Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-content-primary pb-2 border-b border-gray-100">
              1. Basic Examination Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Examination Form Title"
                placeholder="e.g. December 2026 Reappear Examination"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Exam Name"
                placeholder="e.g. End Term Examination 2026"
                required
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Examination Session"
                placeholder="e.g. Odd Semester 2026"
                value={examSession}
                onChange={(e) => setExamSession(e.target.value)}
              />
              <Select
                label="Applicable Course"
                options={[
                  { value: '', label: 'All Courses' },
                  ...courses.map((c) => ({ value: c.id, label: `${c.shortName} - ${c.name}` })),
                ]}
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              />
              <Select
                label="Applicable Semester"
                options={[
                  { value: '', label: 'All Semesters' },
                  ...semesters.map((s) => ({ value: s.id, label: s.name })),
                ]}
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
              />
            </div>

            <Textarea
              label="Student Instructions / Notice"
              rows={2}
              placeholder="Guidelines for students appearing for this examination..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* SECTION 2: Scheduling & Permanent Active Mode */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-content-primary">
                2. Scheduling & Permanent Active Controls
              </h3>
              <span className="text-[11px] text-content-muted">Timezone: Asia/Kolkata</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Opening Date & Time"
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="Closing Date & Time"
                type="datetime-local"
                disabled={isPermanentActive}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                helperText={isPermanentActive ? 'Disabled because Permanent Active is enabled' : ''}
              />
            </div>

            <div className="p-4 bg-primary-50/50 border border-primary-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-content-primary block">
                  Enable Permanent Active Mode
                </span>
                <span className="text-[11px] text-content-muted block mt-0.5">
                  Form remains active indefinitely past the start date until manually closed by an administrator.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPermanentActive}
                onChange={(e) => setIsPermanentActive(e.target.checked)}
                className="w-5 h-5 accent-primary-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* SECTION 3: Dynamic Form Fields Builder */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-content-primary">3. Dynamic Form Fields</h3>
                <p className="text-[11px] text-content-muted">
                  Add custom fields for this examination (saved in DB, fully synchronizable to Google Sheets)
                </p>
              </div>
              <Button onClick={addField} icon={Plus} size="sm">
                Add Field
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl text-xs text-content-muted">
                No custom fields added yet. Click &quot;Add Field&quot; to customize this examination form.
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-gray-200 bg-surface-secondary space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-white text-content-secondary border text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-content-primary">
                          {field.fieldLabel || 'Untitled Field'}
                        </span>
                        <span className="text-[10px] font-mono text-content-muted bg-white px-1.5 py-0.5 rounded border">
                          {field.fieldKey}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveField(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-content-muted hover:text-content-primary disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(idx, 1)}
                          disabled={idx === fields.length - 1}
                          className="p-1 text-content-muted hover:text-content-primary disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateField(idx)}
                          className="p-1 text-content-muted hover:text-content-primary"
                          title="Duplicate Field"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(idx)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Remove Field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Field Label"
                        value={field.fieldLabel}
                        onChange={(e) => updateField(idx, 'fieldLabel', e.target.value)}
                      />
                      <Input
                        label="Internal Field Key"
                        value={field.fieldKey}
                        onChange={(e) => updateField(idx, 'fieldKey', e.target.value)}
                      />
                      <Select
                        label="Field Type"
                        options={FIELD_TYPES}
                        value={field.fieldType}
                        onChange={(e) => updateField(idx, 'fieldType', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Placeholder Text"
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(idx, 'placeholder', e.target.value)}
                      />
                      <Input
                        label="Help / Description Text"
                        value={field.description || ''}
                        onChange={(e) => updateField(idx, 'description', e.target.value)}
                      />
                    </div>

                    {/* Field Toggles */}
                    <div className="flex items-center gap-6 pt-1 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.isRequired}
                          onChange={(e) => updateField(idx, 'isRequired', e.target.checked)}
                          className="w-4 h-4 accent-primary-500 rounded"
                        />
                        <span className="font-medium text-content-primary">Mandatory / Required</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.isSyncEligible}
                          onChange={(e) => updateField(idx, 'isSyncEligible', e.target.checked)}
                          className="w-4 h-4 accent-primary-500 rounded"
                        />
                        <span className="font-medium text-content-primary">
                          Google Sheets Sync Eligible
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: Applicable Reappear Subjects Selection */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-content-primary">
                  4. Applicable Reappear Subjects ({selectedSubjectIds.length} Selected)
                </h3>
                <p className="text-[11px] text-content-muted">
                  Choose which curriculum subjects students can select when filling this form
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedSubjectIds.length === filteredSubjects.length) {
                    setSelectedSubjectIds([]);
                  } else {
                    setSelectedSubjectIds(filteredSubjects.map((s) => s.id));
                  }
                }}
              >
                {selectedSubjectIds.length === filteredSubjects.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
              {filteredSubjects.map((sub) => {
                const isSelected = selectedSubjectIds.includes(sub.id);
                return (
                  <div
                    key={sub.id}
                    onClick={() => toggleSubjectSelect(sub.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 font-semibold text-primary-900'
                        : 'border-gray-200 hover:bg-gray-50 text-content-secondary'
                    }`}
                  >
                    <div>
                      <span className="block">{sub.name}</span>
                      <span className="text-[10px] text-content-muted font-mono">{sub.code}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="accent-primary-500 rounded"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Save Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => navigate('/admin/forms')}>
              Cancel
            </Button>
            <Button variant="secondary" isLoading={saving} onClick={() => handleSave(false)}>
              Save as Draft
            </Button>
            <Button isLoading={saving} onClick={() => handleSave(true)}>
              Publish Form
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
