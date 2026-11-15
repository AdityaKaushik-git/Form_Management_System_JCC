import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service.js';
import Button from '../../components/common/Button.jsx';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Email verified successfully! You can now log in.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification token is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 text-center max-w-md mx-auto">
      {status === 'verifying' && (
        <div className="space-y-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto" />
          <h2 className="text-base font-bold text-content-primary">Verifying Email...</h2>
          <p className="text-xs text-content-muted">Please wait while we confirm your email address.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-lg font-bold text-emerald-950">Email Verified!</h2>
          <p className="text-xs text-content-secondary leading-relaxed">{message}</p>
          <div className="pt-2">
            <Link to="/login">
              <Button size="sm" className="w-full">
                Proceed to Login
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-red-950">Verification Failed</h2>
          <p className="text-xs text-red-700 leading-relaxed">{message}</p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" size="sm" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
