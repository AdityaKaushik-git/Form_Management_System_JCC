import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { Eye, EyeOff, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

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
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 sm:p-8">
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
      <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary-500" />
            Demonstration Student Account
          </span>
          <button
            type="button"
            onClick={() => {
              setValue('enrollmentNumber', '00115502024');
              setValue('password', 'Student@12345!');
            }}
            className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs hover:bg-primary-50 transition-colors touch-manipulation"
          >
            Auto-fill
          </button>
        </div>
        <div className="text-[11px] text-slate-700 space-y-0.5 font-mono">
          <div>Enrollment: <strong className="font-bold text-slate-900">00115502024</strong></div>
          <div>Password: <strong className="font-bold text-slate-900">Student@12345!</strong></div>
        </div>
        <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
          Rahul Sharma • BCA (2024–2027) • Sem 3 • Odd Sem Eligible (1, 3, 5)
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
            className="absolute right-1 top-[28px] p-2 text-content-muted hover:text-content-primary touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label="Toggle password visibility"
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
