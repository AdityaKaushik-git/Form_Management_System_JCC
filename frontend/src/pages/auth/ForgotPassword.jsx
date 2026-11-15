import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service.js';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const schema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await authService.forgotPassword(data.email);
      setMessage(res.message || 'If an account exists, a password reset link has been sent to your email.');
      setSubmitted(true);
    } catch {
      setMessage('If an account exists, a password reset link has been sent to your email.');
      setSubmitted(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-content-primary">Reset Password</h2>
        <p className="text-xs text-content-muted mt-1">
          Enter your registered email address to receive reset instructions
        </p>
      </div>

      {submitted ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-900">Check Your Inbox</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">{message}</p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" size="sm" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Registered Email Address"
            type="email"
            placeholder="name@example.com"
            icon={Mail}
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send Password Reset Link
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-content-primary font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
