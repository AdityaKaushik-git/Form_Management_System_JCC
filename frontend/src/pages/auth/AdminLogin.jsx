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
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8">
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
            className="absolute right-3 top-[34px] text-content-muted hover:text-content-primary"
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
