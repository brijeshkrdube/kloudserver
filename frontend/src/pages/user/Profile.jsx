import { useState } from 'react';
import { User, Shield, Loader2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const UserProfile = () => {
  const { api, user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || '',
    company: user?.company || '',
  });

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await api.put('/user/profile', null, {
        params: {
          full_name: profileData.fullName,
          company: profileData.company,
        }
      });
      toast.success('Profile updated successfully');
      refreshUser();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      const response = await api.post('/auth/setup-2fa');
      setQrData(response.data);
      setShow2FASetup(true);
    } catch (error) {
      toast.error('Failed to setup 2FA');
    }
  };

  const handleVerify2FA = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-2fa', { code: totpCode });
      toast.success('2FA enabled successfully!');
      setShow2FASetup(false);
      setTotpCode('');
      refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/disable-2fa', { code: disableCode });
      toast.success('2FA disabled successfully');
      setDisableCode('');
      refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await api.post('/auth/resend-verification');
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="profile-title">
            Profile & Security
          </h1>
          <p className="text-text-secondary mt-1">Manage your account settings</p>
        </div>

        {/* Profile Section */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-text-primary">{user?.full_name}</h2>
              <p className="text-text-muted">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                className="input-field"
                data-testid="profile-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Company (Optional)</Label>
              <Input
                value={profileData.company}
                onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                className="input-field"
                data-testid="profile-company"
              />
            </div>
            <Button
              className="btn-primary"
              onClick={handleUpdateProfile}
              disabled={loading}
              data-testid="save-profile"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </div>

        {/* 2FA Section */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-accent-success/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-success" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-lg font-semibold text-text-primary">Two-Factor Authentication</h2>
              <p className="text-text-muted text-sm">Add an extra layer of security to your account</p>
            </div>
            {!user?.is_2fa_enabled && !show2FASetup && (
              <Button className="btn-secondary" onClick={handleSetup2FA} data-testid="enable-2fa">
                Enable 2FA
              </Button>
            )}
          </div>

          {user?.is_2fa_enabled && (
            <div className="p-4 bg-accent-success/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-accent-success" />
                  <span className="text-accent-success font-medium">2FA is enabled</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-text-muted text-sm mb-3">Enter your 2FA code to disable:</p>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="000000"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    className="input-field font-mono text-center tracking-widest w-32"
                    maxLength={6}
                    data-testid="disable-2fa-code"
                  />
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={loading}
                    data-testid="disable-2fa-btn"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {show2FASetup && qrData && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-text-secondary mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                </p>
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.qr_uri)}`}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-text-muted text-sm mb-2">Or enter this secret manually:</p>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-2 bg-black/30 rounded font-mono text-sm text-accent-cyan">
                        {qrData.secret}
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(qrData.secret)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Enter the 6-digit code from your app:</Label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="input-field font-mono text-center tracking-widest"
                    maxLength={6}
                    data-testid="verify-2fa-code"
                  />
                  <Button className="btn-primary" onClick={handleVerify2FA} disabled={loading} data-testid="verify-2fa-btn">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                  </Button>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setShow2FASetup(false)} className="w-full">
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-text-muted">Email</span>
              <span className="text-text-primary">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-text-muted">Account Type</span>
              <span className="text-text-primary capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-text-muted">Email Verified</span>
              <div className="flex items-center gap-3">
                <span className={user?.is_verified ? 'text-accent-success' : 'text-accent-warning'}>
                  {user?.is_verified ? 'Yes' : 'Pending'}
                </span>
                {!user?.is_verified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={loading}
                    data-testid="resend-verification"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resend'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;
