import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Server, Copy, ArrowLeft, Terminal, ExternalLink, RefreshCw, HardDrive, AlertTriangle, Loader2, Check } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusColor } from '../../lib/utils';
import { toast } from 'sonner';

const UserServerDetails = () => {
  const { serverId } = useParams();
  const { api } = useAuth();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  
  // Control action states
  const [controlOpen, setControlOpen] = useState(false);
  const [controlAction, setControlAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServer();
  }, [serverId]);

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

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleControlAction = async () => {
    setSubmitting(true);
    try {
      const response = await api.post(`/servers/${serverId}/control`, {
        action: controlAction,
        confirm: true
      });
      toast.success(response.data.message);
      setControlOpen(false);
      setControlAction(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const openControlDialog = (action) => {
    setControlAction(action);
    setControlOpen(true);
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
          <h2 className="text-xl text-text-primary">Server not found</h2>
          <Link to="/dashboard/services" className="text-primary hover:underline mt-2 inline-block">
            Back to My Services
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const CopyButton = ({ text, field }) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => copyToClipboard(text, field)}
      className="h-8 px-2 text-text-muted hover:text-primary"
      data-testid={`copy-${field}`}
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-accent-success" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard/services" 
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            data-testid="back-to-services"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="server-hostname">
                {server.hostname}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(server.status)}`}>
                {server.status}
              </span>
            </div>
            <p className="text-text-secondary mt-1">{server.os}</p>
          </div>
        </div>

        {/* Server Control Actions */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Server Control
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => openControlDialog('reboot')}
              className="border-accent-warning/30 text-accent-warning hover:bg-accent-warning/10"
              data-testid="reboot-btn"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Request Reboot
            </Button>
            <Button
              variant="outline"
              onClick={() => openControlDialog('reinstall')}
              className="border-accent-error/30 text-accent-error hover:bg-accent-error/10"
              data-testid="reinstall-btn"
            >
              <HardDrive className="w-4 h-4 mr-2" />
              Request OS Reinstall
            </Button>
          </div>
          <p className="text-text-muted text-sm mt-3">
            Control actions will create a support ticket and our team will process your request.
          </p>
        </div>

        {/* Server Credentials */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Server Credentials
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-text-muted text-xs uppercase mb-1">IP Address</p>
                  <p className="font-mono text-text-primary" data-testid="server-ip">{server.ip_address}</p>
                </div>
                <CopyButton text={server.ip_address} field="ip" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-text-muted text-xs uppercase mb-1">SSH Port</p>
                  <p className="font-mono text-text-primary">{server.ssh_port}</p>
                </div>
                <CopyButton text={server.ssh_port?.toString()} field="port" />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-text-muted text-xs uppercase mb-1">Username</p>
                  <p className="font-mono text-text-primary" data-testid="server-username">{server.username}</p>
                </div>
                <CopyButton text={server.username} field="username" />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-text-muted text-xs uppercase mb-1">Password</p>
                  <p className="font-mono text-text-primary" data-testid="server-password">{server.password}</p>
                </div>
                <CopyButton text={server.password} field="password" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-text-muted text-xs uppercase mb-2">SSH Command</p>
                <div className="flex items-center justify-between">
                  <code className="font-mono text-sm text-primary break-all" data-testid="ssh-command">
                    ssh {server.username}@{server.ip_address} -p {server.ssh_port}
                  </code>
                  <CopyButton 
                    text={`ssh ${server.username}@${server.ip_address} -p ${server.ssh_port}`} 
                    field="ssh" 
                  />
                </div>
              </div>

              {server.panel_url && (
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-text-muted text-xs uppercase mb-2">Control Panel</p>
                  <a 
                    href={server.panel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Control Panel
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Server Info */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Server Information
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-text-muted text-sm">Operating System</p>
              <p className="text-text-primary font-medium">{server.os}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Specs</p>
              <p className="text-text-primary">{server.specs?.cpu} CPU, {server.specs?.ram} RAM</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Storage</p>
              <p className="text-text-primary">{server.specs?.storage}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Bandwidth</p>
              <p className="text-text-primary">{server.specs?.bandwidth}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Created</p>
              <p className="text-text-primary">{formatDate(server.created_at)}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Renewal Date</p>
              <p className="text-text-primary">{formatDate(server.renewal_date)}</p>
            </div>
          </div>
        </div>

        {/* Control Action Confirmation Dialog */}
        <Dialog open={controlOpen} onOpenChange={setControlOpen}>
          <DialogContent className="bg-background-paper border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                {controlAction === 'reboot' ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-accent-warning" />
                    Confirm Server Reboot
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-accent-error" />
                    Confirm OS Reinstall
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                {controlAction === 'reboot' ? (
                  'This will submit a reboot request. Your server may be temporarily unavailable during the reboot process.'
                ) : (
                  'WARNING: This will submit a request to reinstall the operating system. ALL DATA on the server will be permanently lost!'
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-text-muted text-sm">Server: <span className="text-text-primary font-medium">{server.hostname}</span></p>
                <p className="text-text-muted text-sm">IP: <span className="text-text-primary font-mono">{server.ip_address}</span></p>
              </div>
              
              {controlAction === 'reinstall' && (
                <div className="mt-4 p-4 bg-accent-error/10 border border-accent-error/20 rounded-lg">
                  <p className="text-accent-error text-sm font-medium">
                    This action is irreversible. Make sure you have backed up all important data.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setControlOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleControlAction}
                disabled={submitting}
                className={controlAction === 'reboot' ? 'bg-accent-warning hover:bg-accent-warning/80' : 'bg-accent-error hover:bg-accent-error/80'}
                data-testid="confirm-control-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {controlAction === 'reboot' ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Submit Reboot Request
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-4 h-4 mr-2" />
                        Submit Reinstall Request
                      </>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UserServerDetails;
