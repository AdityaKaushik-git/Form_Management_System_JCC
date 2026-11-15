import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

const STANDARD_FIELD_SOURCES = [
  { value: 'referenceNumber', label: 'Application Reference Number' },
  { value: 'enrollmentNumber', label: 'Student Enrollment Number' },
  { value: 'fullName', label: 'Student Full Name' },
  { value: 'email', label: 'Email Address' },
  { value: 'mobile', label: 'Mobile Number' },
  { value: 'courseName', label: 'Course Name' },
  { value: 'courseCode', label: 'Course Code' },
  { value: 'semesterName', label: 'Semester' },
  { value: 'selectedSubjects', label: 'Selected Reappear Subjects' },
  { value: 'status', label: 'Application Workflow Status' },
  { value: 'submittedAt', label: 'Submission Timestamp' },
  { value: 'remarks', label: 'Administrative Remarks' },
  { value: 'fatherName', label: "Father's Name" },
  { value: 'motherName', label: "Mother's Name" },
];

const ColumnMapper = () => {
  const { sheetId } = useParams();
  const navigate = useNavigate();

  const [sheet, setSheet] = useState(null);
  const [form, setForm] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const mapRes = await adminService.getMappings(sheetId);
        const existingMappings = mapRes.data || [];
        setMappings(existingMappings);

        // Fetch sheet details to get formId
        // Also fetch form to include any dynamic form field keys in the source dropdown
      } catch (err) {
        console.error('Failed to load column mappings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sheetId]);

  const addColumn = () => {
    setMappings([
      ...mappings,
      {
        sheetHeader: 'New Column',
        fieldSource: 'fullName',
        displayOrder: mappings.length,
      },
    ]);
  };

  const updateColumn = (index, key, value) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [key]: value };
    setMappings(updated);
  };

  const removeColumn = (index) => {
    setMappings(mappings.filter((_, idx) => idx !== index));
  };

  const moveColumn = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= mappings.length) return;
    const updated = [...mappings];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setMappings(updated);
  };

  const handleSave = async () => {
    if (mappings.length === 0) {
      setErrorMsg('Please configure at least one column mapping');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      setSaveSuccess(false);

      await adminService.updateMappings(sheetId, mappings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save column mappings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading column mappings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-content-muted hover:text-content-primary flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sheets
          </button>
          <h2 className="text-xl font-bold text-content-primary">Spreadsheet Column Mapping</h2>
          <p className="text-xs text-content-muted mt-0.5">
            Configure exactly which application fields map into each spreadsheet header
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={addColumn} variant="outline" size="sm" icon={Plus}>
            Add Column
          </Button>
          <Button onClick={handleSave} isLoading={saving} size="sm" icon={Save}>
            Save Mappings
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Column mappings saved! Future submissions will sync using this schema.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Columns Builder Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-content-primary pb-2 border-b border-gray-100 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Configured Columns ({mappings.length})
        </h3>

        {mappings.length === 0 ? (
          <div className="p-8 text-center text-xs text-content-muted border border-dashed border-gray-200 rounded-xl">
            No columns defined. Click &quot;Add Column&quot; to begin mapping.
          </div>
        ) : (
          <div className="space-y-3">
            {mappings.map((col, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-surface-secondary rounded-xl border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-6 h-6 rounded bg-white text-content-secondary border text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveColumn(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-content-muted hover:text-content-primary disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveColumn(idx, 1)}
                      disabled={idx === mappings.length - 1}
                      className="p-1 text-content-muted hover:text-content-primary disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Sheet Header Title (e.g. Enrollment No)"
                    value={col.sheetHeader}
                    onChange={(e) => updateColumn(idx, 'sheetHeader', e.target.value)}
                  />
                  <Select
                    options={STANDARD_FIELD_SOURCES}
                    value={col.fieldSource}
                    onChange={(e) => updateColumn(idx, 'fieldSource', e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeColumn(idx)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg shrink-0"
                  title="Remove Column"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Preview Strip of Resulting Google Sheet Row */}
      {mappings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-3">
          <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
            Live Header Preview in Google Sheets (Row 1)
          </h4>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-emerald-50 text-emerald-900 border-b border-gray-200 divide-x divide-gray-200">
                  {mappings.map((m, idx) => (
                    <th key={idx} className="p-2.5 font-bold whitespace-nowrap">
                      {m.sheetHeader || `Col ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white divide-x divide-gray-100 text-content-muted">
                  {mappings.map((m, idx) => (
                    <td key={idx} className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                      [{m.fieldSource}]
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnMapper;
