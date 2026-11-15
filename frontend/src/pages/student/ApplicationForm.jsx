import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Textarea from '../../components/common/Textarea.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { downloadBlob } from '../../utils/helpers.js';
import {
  CheckCircle2,
  AlertCircle,
  FileDown,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react';

const ApplicationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldValues, setFieldValues] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await studentService.getFormDetails(id);
        setForm(res.data);

        // Prepopulate default and verified student profile values
        const initialFields = {};
        const prof = user?.studentProfile || {};
        (res.data?.fields || []).forEach((f) => {
          if (f.defaultValue) initialFields[f.fieldKey] = f.defaultValue;
          if (f.fieldKey === 'fullName' && user?.fullName) initialFields[f.fieldKey] = user.fullName;
          if (f.fieldKey === 'enrollmentNumber' && prof?.enrollmentNumber) initialFields[f.fieldKey] = prof.enrollmentNumber;
          if (f.fieldKey === 'email' && user?.email) initialFields[f.fieldKey] = user.email;
          if ((f.fieldKey === 'mobile' || f.fieldKey === 'phone') && prof?.mobile) initialFields[f.fieldKey] = prof.mobile;
        });
        setFieldValues(initialFields);
      } catch (err) {
        setServerError(err.response?.data?.message || 'Failed to load examination form.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Preparing examination form..." />;
  }

  if (serverError && !form) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl border border-red-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-red-950">Unable to Open Form</h3>
        <p className="text-xs text-red-700">{serverError}</p>
        <Link to="/student/forms">
          <Button variant="outline" size="sm">
            Back to Available Forms
          </Button>
        </Link>
      </div>
    );
  }

  const profile = user?.studentProfile || {};
  const formFields = form?.fields || [];
  const formSubjects = form?.formSubjects?.map((fs) => fs.subject) || [];

  const handleFieldChange = (key, value) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const toggleSubject = (subjectId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((s) => s !== subjectId)
        : [...prev, subjectId]
    );
    if (fieldErrors.subjects) {
      setFieldErrors((prev) => ({ ...prev, subjects: null }));
    }
  };

  const validateDynamicFields = () => {
    const errors = {};
    formFields.forEach((f) => {
      const val = fieldValues[f.fieldKey];
      if (f.isRequired && (val === undefined || val === null || val === '')) {
        errors[f.fieldKey] = `${f.fieldLabel} is required`;
        return;
      }

      if (val !== undefined && val !== null && val !== '') {
        // Indian 10-digit mobile validation
        if (f.fieldType === 'mobile' || f.fieldKey === 'mobile' || f.fieldKey === 'phone') {
          if (!/^[6-9]\d{9}$/.test(String(val).trim())) {
            errors[f.fieldKey] = 'Enter a valid 10-digit mobile number (e.g. 9876543210)';
          }
        }
        // Email validation
        if (f.fieldType === 'email' || f.fieldKey === 'email') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim())) {
            errors[f.fieldKey] = 'Enter a valid email address';
          }
        }
        // Mandatory checkbox declaration
        if (f.fieldType === 'checkbox' && f.isRequired) {
          if (val !== true && val !== 'true') {
            errors[f.fieldKey] = 'You must confirm the official declaration';
          }
        }
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextFromStep2 = () => {
    if (validateDynamicFields()) {
      setCurrentStep(3);
    }
  };

  const handleNextFromStep3 = () => {
    if (selectedSubjects.length === 0) {
      setFieldErrors((prev) => ({
        ...prev,
        subjects: 'Please select at least one reappear subject to proceed',
      }));
      return;
    }
    setCurrentStep(4);
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      setServerError('');

      const res = await studentService.submitApplication({
        formId: form.id,
        fieldValues,
        subjectIds: selectedSubjects,
      });

      setSubmissionResult(res.data);
      setCurrentStep(5); // Success step
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to submit application. Please check your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!submissionResult?.id) return;
    try {
      const blob = await studentService.downloadReceipt(submissionResult.id);
      downloadBlob(blob, `JCC-Receipt-${submissionResult.referenceNumber}.pdf`);
    } catch (err) {
      console.error('Failed to download receipt:', err);
    }
  };

  const steps = [
    { num: 1, title: 'Personal Info' },
    { num: 2, title: 'Form Details' },
    { num: 3, title: 'Subjects' },
    { num: 4, title: 'Review & Confirm' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
          Examination Application
        </span>
        <h2 className="text-xl font-bold text-content-primary mt-1">{form.title}</h2>
        <p className="text-xs text-content-secondary mt-0.5">
          {form.examName} • Session {form.examSession}
        </p>
      </div>

      {/* Step Progress Bar (Hidden on success step 5) */}
      {currentStep <= 4 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === s.num
                        ? 'bg-primary-500 text-white shadow-sm'
                        : currentStep > s.num
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-content-muted'
                    }`}
                  >
                    {currentStep > s.num ? '✓' : s.num}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-medium ${
                      currentStep === s.num
                        ? 'text-primary-600 font-semibold'
                        : 'text-content-muted'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > s.num ? 'bg-emerald-400' : 'bg-gray-100'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {serverError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* STEP 1: Verify Student Details */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Info className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-content-primary">
              Step 1: Verify Your Academic Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-surface-secondary rounded-lg">
              <span className="text-content-muted block mb-0.5">Student Full Name</span>
              <span className="font-semibold text-content-primary text-sm">{user?.fullName}</span>
            </div>
            <div className="p-3 bg-surface-secondary rounded-lg">
              <span className="text-content-muted block mb-0.5">Enrollment Number</span>
              <span className="font-semibold text-content-primary text-sm font-mono">
                {profile?.enrollmentNumber}
              </span>
            </div>
            <div className="p-3 bg-surface-secondary rounded-lg">
              <span className="text-content-muted block mb-0.5">Email Address</span>
              <span className="font-semibold text-content-primary">{user?.email}</span>
            </div>
            <div className="p-3 bg-surface-secondary rounded-lg">
              <span className="text-content-muted block mb-0.5">Mobile Contact</span>
              <span className="font-semibold text-content-primary">{profile?.mobile || 'Not provided'}</span>
            </div>
            <div className="p-3 bg-surface-secondary rounded-lg">
              <span className="text-content-muted block mb-0.5">Course</span>
              <span className="font-semibold text-content-primary">
                {profile?.course?.name || form.course?.name || 'Assigned Course'}
              </span>
            </div>
            <div className="p-3 bg-surface-secondary rounded-lg">
              <span className="text-content-muted block mb-0.5">Semester</span>
              <span className="font-semibold text-content-primary">
                {form.semester?.name || `Semester ${profile?.currentSemester || 'N/A'}`}
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={() => setCurrentStep(2)} className="w-full sm:w-auto">
              Confirm & Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Fill Dynamic Form Fields */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-content-primary">
              Step 2: Examination Specific Details
            </h3>
            <span className="text-xs text-content-muted">
              {formFields.length} configured field(s)
            </span>
          </div>

          {formFields.length === 0 ? (
            <p className="text-xs text-content-muted py-4 text-center">
              No additional custom fields required for this examination.
            </p>
          ) : (
            <div className="space-y-4">
              {formFields.map((field) => {
                const val = fieldValues[field.fieldKey] || '';
                const err = fieldErrors[field.fieldKey];

                if (field.fieldType === 'textarea') {
                  return (
                    <Textarea
                      key={field.fieldKey}
                      label={field.fieldLabel}
                      required={field.isRequired}
                      placeholder={field.placeholder || ''}
                      helperText={field.description}
                      value={val}
                      error={err}
                      onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                    />
                  );
                }

                if (field.fieldType === 'dropdown') {
                  const opts = Array.isArray(field.options) ? field.options : [];
                  return (
                    <Select
                      key={field.fieldKey}
                      label={field.fieldLabel}
                      required={field.isRequired}
                      options={opts}
                      value={val}
                      error={err}
                      onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                    />
                  );
                }

                if (field.fieldType === 'checkbox') {
                  const isChecked = val === true || val === 'true';
                  return (
                    <div key={field.fieldKey} className="space-y-1">
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleFieldChange(field.fieldKey, e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-content-primary block">
                            {field.fieldLabel} {field.isRequired && <span className="text-red-500">*</span>}
                          </span>
                          {field.description && (
                            <span className="text-[11px] text-content-muted block mt-0.5">{field.description}</span>
                          )}
                        </div>
                      </label>
                      {err && <p className="text-[11px] text-red-600 pl-1 font-medium">{err}</p>}
                    </div>
                  );
                }

                const isLockedIdentity = field.fieldKey === 'enrollmentNumber';

                return (
                  <Input
                    key={field.fieldKey}
                    label={field.fieldLabel}
                    required={field.isRequired}
                    disabled={isLockedIdentity}
                    type={field.fieldType === 'number' ? 'number' : field.fieldType === 'email' ? 'email' : 'text'}
                    placeholder={field.placeholder || ''}
                    helperText={isLockedIdentity ? 'Verified Student Record (Locked)' : field.description}
                    value={val}
                    error={err}
                    onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                  />
                );
              })}
            </div>
          )}

          <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={handleNextFromStep2} className="w-full sm:w-auto">
              Continue to Subject Selection
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Reappear Subject Selection */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-bold text-content-primary">
                Step 3: Select Reappear Subjects
              </h3>
            </div>
            <span className="text-xs font-semibold text-primary-600">
              {selectedSubjects.length} subject(s) selected
            </span>
          </div>

          <p className="text-xs text-content-muted">
            Check each subject you are appearing for in this examination cycle.
          </p>

          {fieldErrors.subjects && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {fieldErrors.subjects}
            </div>
          )}

          {formSubjects.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              No subjects have been attached to this examination form yet. Please contact the administrator.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {formSubjects.map((sub) => {
                const isChecked = selectedSubjects.includes(sub.id);
                return (
                  <div
                    key={sub.id}
                    onClick={() => toggleSubject(sub.id)}
                    className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors touch-manipulation select-none active:bg-primary-100/60 ${
                      isChecked ? 'bg-primary-50/70 border-l-4 border-l-primary-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-primary-500 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 shrink-0" />
                      )}
                      <div>
                        <span className="text-sm font-bold text-content-primary block">
                          {sub.name}
                        </span>
                        <span className="text-xs text-content-muted">
                          Code: <span className="font-mono font-medium">{sub.code}</span> • Credits: {sub.credits || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100">
            <Button variant="outline" onClick={() => setCurrentStep(2)} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={handleNextFromStep3} className="w-full sm:w-auto">
              Review Application
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Review and Submit */}
      {currentStep === 4 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-6">
          <div className="pb-2 border-b border-gray-100">
            <h3 className="text-base font-bold text-content-primary">
              Step 4: Review Application Information
            </h3>
            <p className="text-xs text-content-muted mt-0.5">
              Please double check all submitted details. Submitted applications cannot be edited directly.
            </p>
          </div>

          {/* Student Info Summary */}
          <div className="bg-surface-secondary p-4 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-content-primary uppercase text-[11px] tracking-wider mb-2">
              Applicant Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <span className="text-content-muted block">Student Name:</span>
                <span className="font-semibold text-content-primary">{user?.fullName}</span>
              </div>
              <div>
                <span className="text-content-muted block">Enrollment No:</span>
                <span className="font-semibold text-content-primary font-mono">{profile?.enrollmentNumber}</span>
              </div>
              <div>
                <span className="text-content-muted block">Email:</span>
                <span className="font-semibold text-content-primary">{user?.email}</span>
              </div>
              <div>
                <span className="text-content-muted block">Mobile:</span>
                <span className="font-semibold text-content-primary">{fieldValues.mobile || fieldValues.phone || profile?.mobile || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Selected Subjects Summary */}
          <div className="bg-surface-secondary p-4 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-content-primary uppercase text-[11px] tracking-wider mb-2">
              Selected Reappear Subjects ({selectedSubjects.length})
            </h4>
            <ul className="space-y-1.5 divide-y divide-gray-100">
              {formSubjects
                .filter((s) => selectedSubjects.includes(s.id))
                .map((s) => (
                  <li key={s.id} className="pt-1.5 flex items-center justify-between font-medium text-content-primary">
                    <span>{s.name}</span>
                    <span className="font-mono text-xs text-content-muted">{s.code}</span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100">
            <Button variant="outline" onClick={() => setCurrentStep(3)} disabled={isSubmitting} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={handleFinalSubmit} isLoading={isSubmitting} className="w-full sm:w-auto">
              Confirm & Submit Application
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Success & Receipt Download */}
      {currentStep === 5 && submissionResult && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Application Successfully Saved
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-content-primary mt-1">
              Submission Confirmed
            </h2>
            <p className="text-xs text-content-muted mt-1">
              Your application has been registered in the examination database.
            </p>
          </div>

          <div className="p-4 bg-primary-50/50 border border-primary-200 rounded-xl inline-block max-w-sm mx-auto text-center w-full">
            <span className="text-[11px] text-content-muted uppercase tracking-wider block">
              Application Reference Number
            </span>
            <span className="text-lg font-mono font-bold text-primary-600 block mt-0.5 break-all">
              {submissionResult.referenceNumber}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-4">
            <Button onClick={handleDownloadReceipt} icon={FileDown} size="lg" className="w-full sm:w-auto">
              Download Official PDF Receipt
            </Button>
            <Link to="/student/applications" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View My Applications
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationForm;
