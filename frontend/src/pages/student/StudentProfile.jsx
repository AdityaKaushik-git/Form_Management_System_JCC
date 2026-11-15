import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { studentService } from '../../services/student.service.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Input from '../../components/common/Input.jsx';
import Textarea from '../../components/common/Textarea.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { User, Phone, Mail, Hash, Calendar, Home, CheckCircle2, AlertCircle } from 'lucide-react';

const StudentProfile = () => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentService.getProfile();
        const user = res.data;
        const profile = user.studentProfile || {};

        reset({
          fullName: user.fullName || '',
          email: user.email || '',
          enrollmentNumber: profile.enrollmentNumber || '',
          mobile: profile.mobile || '',
          fatherName: profile.fatherName || '',
          motherName: profile.motherName || '',
          dateOfBirth: profile.dateOfBirth || '',
          address: profile.address || '',
          courseName: profile.course?.name || 'Not assigned',
          batchName: profile.batch?.name || 'Not assigned',
          currentSemester: profile.currentSemester ? `Semester ${profile.currentSemester}` : 'Not set',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await studentService.updateProfile({
        fullName: data.fullName,
        mobile: data.mobile,
        fatherName: data.fatherName,
        motherName: data.motherName,
        dateOfBirth: data.dateOfBirth || null,
        address: data.address,
      });
      updateUser(res.data);
      setSuccessMsg('Your profile has been updated successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading profile details..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content-primary">Student Profile</h2>
        <p className="text-xs text-content-muted mt-1">
          Review and update your personal and contact details
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Read-Only Academic Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-content-primary pb-2 border-b border-gray-100">
            Academic Information (Read-Only)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Enrollment Number"
              disabled
              icon={Hash}
              {...register('enrollmentNumber')}
            />
            <Input
              label="Course"
              disabled
              {...register('courseName')}
            />
            <Input
              label="Batch"
              disabled
              {...register('batchName')}
            />
          </div>
        </div>

        {/* Editable Personal & Contact Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-content-primary pb-2 border-b border-gray-100">
            Personal & Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              icon={User}
              {...register('fullName')}
            />
            <Input
              label="Email Address"
              disabled
              icon={Mail}
              helperText="Contact admin to change registered email"
              {...register('email')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mobile Number"
              icon={Phone}
              placeholder="10-digit mobile"
              {...register('mobile')}
            />
            <Input
              label="Date of Birth"
              type="date"
              icon={Calendar}
              {...register('dateOfBirth')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Father's Name"
              placeholder="Father's full name"
              {...register('fatherName')}
            />
            <Input
              label="Mother's Name"
              placeholder="Mother's full name"
              {...register('motherName')}
            />
          </div>

          <Textarea
            label="Residential Address"
            rows={3}
            placeholder="Complete postal address"
            {...register('address')}
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>
              Save Profile Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StudentProfile;
