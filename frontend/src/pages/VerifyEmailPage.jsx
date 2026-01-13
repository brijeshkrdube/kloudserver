import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Server, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Verification failed');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
            <Server className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading font-bold text-2xl text-text-primary">KloudNests</span>
        </Link>

        <div className="glass-card p-8">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">
                Verifying Email...
              </h1>
              <p className="text-text-secondary">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-accent-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-accent-success" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">
                Email Verified!
              </h1>
              <p className="text-text-secondary mb-6">{message}</p>
              <Link to="/login">
                <Button className="btn-primary w-full">
                  Continue to Login
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-accent-error/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-accent-error" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">
                Verification Failed
              </h1>
              <p className="text-text-secondary mb-6">{message}</p>
              <div className="space-y-3">
                <Link to="/login">
                  <Button className="btn-primary w-full">
                    Go to Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" className="w-full">
                    Create New Account
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
