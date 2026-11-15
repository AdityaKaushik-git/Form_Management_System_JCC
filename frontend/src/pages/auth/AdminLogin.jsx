import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const adminLoginSchema = z.object({
  email: z.string().trim().email('Valid administrative email required'),
  password: z.string().min(1, 'Password is required'),
});

const AdminLogin = () => {
  const { loginAdmin } = useAuth();
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
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setServerError('');
      await loginAdmin(data);
      const destination = location.state?.from?.pathname || '/admin/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid administrator credentials');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 sm:p-8">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500 mx-auto mb-3 shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-content-primary">Administrator Sign In</h2>
        <p className="text-xs text-content-muted mt-1">
          Authorized examination branch personnel only
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Demo Admin Credentials Box */}
      <div className="mb-5 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-amber-900 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
            Demo Administrator Credentials
          </span>
          <button
            type="button"
            onClick={() => {
              setValue('email', 'admin@jcc.edu.in');
              setValue('password', 'Admin@12345!');
            }}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-white px-2 py-0.5 rounded-md border border-amber-200 shadow-xs hover:bg-amber-50 transition-colors"
          >
            Auto-fill
          </button>
        </div>
        <div className="text-[11px] text-amber-800 space-y-0.5 font-mono">
          <div>Email: <strong className="font-bold text-amber-950">admin@jcc.edu.in</strong></div>
          <div>Password: <strong className="font-bold text-amber-950">Admin@12345!</strong></div>
        </div>
        <p className="text-[10px] text-amber-700 pt-0.5 border-t border-amber-100">
          Authorized Examination Branch • Rohini Sector 3
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Administrative Email"
          type="email"
          placeholder="admin@jcc.edu.in"
          icon={Mail}
          required
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
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

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isSubmitting}
        >
          Secure Admin Login
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-content-muted">
        Are you a student?{' '}
        <Link to="/login" className="text-primary-600 font-semibold hover:underline">
          Go to Student Portal
        </Link>
      </div>
    </div>
  );
};

export default AdminLogin;
