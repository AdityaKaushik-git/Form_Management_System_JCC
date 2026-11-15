import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  enrollmentNumber: z.string().trim().min(1, 'Enrollment number is required'),
  password: z.string().min(1, 'Password is required'),
});

const StudentLogin = () => {
  const { loginStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setServerError('');
      await loginStudent(data);
      const destination = location.state?.from?.pathname || '/student/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid enrollment number or password';
      setServerError(msg);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-content-primary">Student Login</h2>
        <p className="text-xs text-content-muted mt-1">
          Access your JCC reappear examination applications
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Test Student Credentials Box */}
      <div className="mb-5 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-blue-900 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Test Student Credentials
          </span>
          <button
            type="button"
            onClick={() => {
              setValue('enrollmentNumber', '00115502024');
              setValue('password', 'Student@12345!');
            }}
            className="text-[11px] font-bold text-primary-600 hover:text-primary-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-xs hover:bg-primary-50 transition-colors"
          >
            Auto-fill
          </button>
        </div>
        <div className="text-[11px] text-blue-800 space-y-0.5 font-mono">
          <div>Enrollment: <strong className="font-bold text-blue-950">00115502024</strong></div>
          <div>Password: <strong className="font-bold text-blue-950">Student@12345!</strong></div>
        </div>
        <p className="text-[10px] text-blue-700 pt-0.5 border-t border-blue-100">
          Rahul Sharma • BCA (Batch 2024–2027) • Sem 3 • Odd Sem Eligible (Sem 1, 3, 5)
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Enrollment Number"
          placeholder="e.g. 0123456789"
          icon={User}
          required
          autoComplete="username"
          error={errors.enrollmentNumber?.message}
          {...register('enrollmentNumber')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={Lock}
            required
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-content-muted hover:text-content-primary"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-end text-xs">
          <Link
            to="/forgot-password"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isSubmitting}
        >
          Sign In to Student Portal
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-content-muted">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-primary-600 font-semibold hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
};

export default StudentLogin;
