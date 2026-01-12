import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Server, Copy, Eye, EyeOff, ExternalLink, ChevronLeft, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusColor } from '../../lib/utils';
import { toast } from 'sonner';

const UserServerDetails = () => {
  const { serverId } = useParams();
  const { api } = useAuth();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchServer = async () => {
      try {
        const response = await api.get(`/servers/${serverId}`);
        setServer(response.data);
      } catch (error) {
        console.error('Failed to fetch server:', error);
        toast.error('Failed to load server details');
      } finally {
        setLoading(false);
      }
    };
    fetchServer();
  }, [api, serverId]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!server) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-text-muted">Server not found</p>
          <Link to="/dashboard/services" className="text-primary hover:text-primary-hover mt-2 inline-block">
            Back to services
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard/services" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-text-primary" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="server-hostname">
                {server.hostname}
              </h1>
              <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(server.status)}`}>
                {server.status}
              </span>
            </div>
            <p className="text-text-secondary mt-1">{server.plan_name}</p>
          </div>
        </div>

        {/* Server Info Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Connection Details */}
          <div className="glass-card p-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-6">Connection Details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">IP Address</p>
                  <p className="text-text-primary font-mono text-lg" data-testid="server-ip">{server.ip_address}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(server.ip_address, 'IP Address')}
                  data-testid="copy-ip"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Username</p>
                  <p className="text-text-primary font-mono text-lg" data-testid="server-username">{server.username}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(server.username, 'Username')}
                  data-testid="copy-username"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <p className="text-text-muted text-xs uppercase tracking-wider">Password</p>
                  <p className="text-text-primary font-mono text-lg" data-testid="server-password">
                    {showPassword ? server.password : '••••••••••••'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(server.password, 'Password')}
                    data-testid="copy-password"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">SSH Port</p>
                  <p className="text-text-primary font-mono text-lg">{server.ssh_port}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(server.ssh_port.toString(), 'SSH Port')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* SSH Command */}
            <div className="mt-6 p-4 bg-black/30 rounded-lg">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-2">SSH Command</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-accent-cyan font-mono text-sm break-all">
                  ssh {server.username}@{server.ip_address} -p {server.ssh_port}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`ssh ${server.username}@${server.ip_address} -p ${server.ssh_port}`, 'SSH Command')}
                  data-testid="copy-ssh"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Server Info */}
          <div className="glass-card p-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-6">Server Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                <span className="text-text-muted">Operating System</span>
                <span className="text-text-primary font-medium">{server.os}</span>
              </div>

              {server.control_panel && (
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                  <span className="text-text-muted">Control Panel</span>
                  <span className="text-text-primary font-medium">{server.control_panel}</span>
                </div>
              )}

              {server.panel_url && (
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                  <span className="text-text-muted">Panel URL</span>
                  <a
                    href={server.panel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-hover flex items-center gap-1"
                  >
                    Access Panel <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                <span className="text-text-muted">Created</span>
                <span className="text-text-primary">{formatDate(server.created_at)}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                <span className="text-text-muted">Renewal Date</span>
                <span className="text-text-primary">{formatDate(server.renewal_date)}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="flex gap-3">
                <Link to="/dashboard/tickets" className="flex-1">
                  <Button className="w-full btn-secondary">
                    Get Support
                  </Button>
                </Link>
                <Link to="/dashboard/billing" className="flex-1">
                  <Button className="w-full btn-secondary">
                    View Billing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserServerDetails;
