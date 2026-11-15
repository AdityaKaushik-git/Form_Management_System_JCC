import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service.js';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const schema = z
  .object({
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

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    if (!token) {
      setServerError('Missing reset token. Please use the link provided in your email.');
      return;
    }

    try {
      setServerError('');
      await authService.resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Password reset failed. Token may be expired.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-content-primary">Choose New Password</h2>
        <p className="text-xs text-content-muted mt-1">
          Create a strong password for your JCC account
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-900">Password Reset Successful</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Your password has been changed. You can now log in with your new password.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button size="sm" className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="At least 8 chars"
            icon={Lock}
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter password"
            icon={Lock}
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
            Reset Password
          </Button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
