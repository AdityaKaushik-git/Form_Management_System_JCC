import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service.js';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { User, Mail, Phone, Lock, Hash, AlertCircle, CheckCircle2 } from 'lucide-react';

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    enrollmentNumber: z
      .string()
      .trim()
      .min(3, 'Enrollment number is required')
      .regex(/^[A-Za-z0-9]+$/, 'Alphanumeric enrollment number required'),
    email: z.string().trim().email('Valid email address is required'),
    mobile: z.string().trim().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must have at least one uppercase letter')
      .regex(/[a-z]/, 'Must have at least one lowercase letter')
      .regex(/[0-9]/, 'Must have at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must have at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const StudentRegister = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      setServerError('');
      const res = await authService.studentRegister(data);
      setSuccessMessage(res.message || 'Registration successful! Please check your email to verify your account.');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-content-primary">Student Registration</h2>
        <p className="text-xs text-content-muted mt-1">
          Open signup for JCC reappear examinations
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-900">Registration Complete</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">{successMessage}</p>
          <div className="pt-2">
            <Link to="/login">
              <Button size="sm" className="w-full">
                Proceed to Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <Input
            label="Full Name"
            placeholder="Student's official name"
            icon={User}
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Enrollment Number"
            placeholder="Official college enrollment number"
            icon={Hash}
            required
            error={errors.enrollmentNumber?.message}
            {...register('enrollmentNumber')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            icon={Mail}
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Mobile Number (10 digits)"
            type="tel"
            placeholder="9876543210"
            icon={Phone}
            required
            error={errors.mobile?.message}
            {...register('mobile')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 chars, uppercase, lowercase, number, symbol"
            icon={Lock}
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            icon={Lock}
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={isSubmitting}
          >
            Create Student Account
          </Button>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-content-muted">
        Already registered?{' '}
        <Link to="/login" className="text-primary-600 font-semibold hover:underline">
          Sign in here
        </Link>
      </div>
    </div>
  );
};

export default StudentRegister;
