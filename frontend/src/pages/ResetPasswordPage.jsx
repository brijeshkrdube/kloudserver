import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { 
        token, 
        new_password: password 
      });
      setSuccess(true);
      toast.success('Password reset successful!');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to reset password. The link may have expired.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="glass-card p-8 text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-error/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-accent-error" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-text-primary mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-text-secondary mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="btn-primary">Request New Link</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="w-full max-w-md px-6">
          {success ? (
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-success/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-accent-success" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-4">
                Password Reset Complete
              </h1>
              <p className="text-text-secondary mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Button 
                className="btn-primary w-full"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
          ) : (
            <div className="glass-card p-8">
              <Link to="/login" className="inline-flex items-center gap-2 text-text-muted hover:text-primary mb-6">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">
                  Reset Your Password
                </h1>
                <p className="text-text-secondary">
                  Enter your new password below.
                </p>
              </div>

              {error && (
                <div className="p-4 mb-6 bg-accent-error/10 border border-accent-error/20 rounded-lg">
                  <p className="text-accent-error text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    data-testid="new-password"
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    data-testid="confirm-password"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={loading}
                  data-testid="reset-password-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
