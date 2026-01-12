import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      // Don't reveal if email exists or not for security
      setSent(true);
      toast.success('If this email is registered, you will receive a password reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="w-full max-w-md px-6">
          {sent ? (
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-success/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-accent-success" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-4">
                Check Your Email
              </h1>
              <p className="text-text-secondary mb-6">
                If an account exists for <span className="text-primary">{email}</span>, you will receive a password reset link shortly.
              </p>
              <p className="text-text-muted text-sm mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSent(false)}
                  className="w-full"
                >
                  Try Another Email
                </Button>
                <Link to="/login" className="text-primary hover:underline text-sm">
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8">
              <Link to="/login" className="inline-flex items-center gap-2 text-text-muted hover:text-primary mb-6">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">
                  Forgot Password?
                </h1>
                <p className="text-text-secondary">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    data-testid="forgot-email"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={loading}
                  data-testid="send-reset-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>

              <p className="text-center text-text-muted text-sm mt-6">
                Remember your password?{' '}
                <Link to="/login" className="text-primary hover:text-primary-hover">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
