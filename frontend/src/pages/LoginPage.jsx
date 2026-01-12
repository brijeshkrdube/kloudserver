import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Server, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password, needs2FA ? totpCode : null);
      toast.success('Welcome back!');
      
      if (user.role === 'user') {
        navigate('/dashboard');
      } else {
        navigate('/admin');
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      if (message === '2FA code required') {
        setNeeds2FA(true);
        toast.info('Please enter your 2FA code');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
              <Server className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl text-text-primary">CloudNest</span>
          </Link>

          <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">Welcome Back</h1>
          <p className="text-text-secondary mb-8">Sign in to manage your servers and services</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                disabled={needs2FA}
                data-testid="login-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  required
                  disabled={needs2FA}
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {needs2FA && (
              <div className="space-y-2">
                <Label htmlFor="totpCode">2FA Code</Label>
                <Input
                  id="totpCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="input-field font-mono text-center tracking-widest"
                  maxLength={6}
                  required
                  data-testid="login-2fa"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary" />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-hover">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full btn-primary py-6" disabled={loading} data-testid="login-submit">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary-hover font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1564846018012-2dd82cc7a9a3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHw0fHxmdXR1cmlzdGljJTIwc2VydmVyJTIwcm9vbSUyMGJsdWUlMjBuZW9ufGVufDB8fHx8MTc2ODE0NTQwNnww&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md">
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-4">
              Deploy with Confidence
            </h2>
            <p className="text-text-secondary">
              Access your dashboard to manage servers, view billing, and get support 
              from our expert team 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
