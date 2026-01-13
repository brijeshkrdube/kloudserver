import { useState, useEffect } from 'react';
import { Server, Edit, Save, X, Loader2, Mail, Plus, UserPlus } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusColor } from '../../lib/utils';
import { toast } from 'sonner';

const AdminServers = () => {
  const { api } = useAuth();
  const [servers, setServers] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [sendingEmail, setSendingEmail] = useState(null);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allocateData, setAllocateData] = useState({
    user_id: '',
    plan_id: '',
    hostname: '',
    ip_address: '',
    username: 'root',
    password: '',
    port: '22',
    control_panel_url: '',
    control_panel_username: '',
    control_panel_password: '',
    additional_notes: '',
    send_email: true,
    payment_received: true,  // Default: admin received payment externally
    amount: '',
  });
  const [selectedUserBalance, setSelectedUserBalance] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [serversRes, usersRes, plansRes] = await Promise.all([
        api.get('/admin/servers'),
        api.get('/admin/users'),
        api.get('/admin/plans'),
      ]);
      setServers(serversRes.data);
      setUsers(usersRes.data.filter(u => u.role === 'user'));
      setPlans(plansRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (server) => {
    setEditingId(server.id);
    setEditData({
      ip_address: server.ip_address,
      hostname: server.hostname,
      username: server.username,
      password: server.password,
      status: server.status,
    });
  };

  const handleSave = async (serverId) => {
    try {
      await api.put(`/admin/servers/${serverId}`, null, { params: editData });
      toast.success('Server updated successfully');
      setEditingId(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update server');
    }
  };

  const handleSendCredentials = async (serverId) => {
    setSendingEmail(serverId);
    try {
      await api.post(`/admin/servers/${serverId}/send-credentials`);
      toast.success('Credentials email sent to user');
    } catch (error) {
      toast.error('Failed to send credentials email');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleAllocateServer = async () => {
    if (!allocateData.user_id || !allocateData.hostname || !allocateData.ip_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/servers/allocate', allocateData);
      toast.success('Server allocated successfully!' + (allocateData.send_email ? ' Credentials sent to user.' : ''));
      setAllocateOpen(false);
      resetAllocateForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to allocate server');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAllocateForm = () => {
    setAllocateData({
      user_id: '',
      plan_id: '',
      hostname: '',
      ip_address: '',
      username: 'root',
      password: '',
      port: '22',
      control_panel_url: '',
      control_panel_username: '',
      control_panel_password: '',
      additional_notes: '',
      send_email: true,
    });
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAllocateData({ ...allocateData, password });
  };

  if (loading) {
    return (
      <DashboardLayout isAdmin>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="admin-servers-title">
              Server Management
            </h1>
            <p className="text-text-secondary mt-1">Manage provisioned servers and credentials</p>
          </div>
          <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="allocate-server-btn">
                <UserPlus className="w-5 h-5 mr-2" />
                Allocate Server
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background-paper border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Allocate Server to User</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* User Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select User *</Label>
                    <Select
                      value={allocateData.user_id}
                      onValueChange={(value) => setAllocateData({ ...allocateData, user_id: value })}
                    >
                      <SelectTrigger className="input-field">
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent className="bg-background-paper border-white/10 max-h-60">
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Plan (Optional)</Label>
                    <Select
                      value={allocateData.plan_id}
                      onValueChange={(value) => setAllocateData({ ...allocateData, plan_id: value })}
                    >
                      <SelectTrigger className="input-field">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent className="bg-background-paper border-white/10">
                        <SelectItem value="custom">Custom / Manual</SelectItem>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {plan.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Server Details */}
                <div className="p-4 bg-white/5 rounded-lg space-y-4">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Server Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hostname *</Label>
                      <Input
                        value={allocateData.hostname}
                        onChange={(e) => setAllocateData({ ...allocateData, hostname: e.target.value })}
                        placeholder="server1.kloudnests.com"
                        className="input-field"
                        data-testid="allocate-hostname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IP Address *</Label>
                      <Input
                        value={allocateData.ip_address}
                        onChange={(e) => setAllocateData({ ...allocateData, ip_address: e.target.value })}
                        placeholder="192.168.1.1"
                        className="input-field font-mono"
                        data-testid="allocate-ip"
                      />
                    </div>
                  </div>
                </div>

                {/* SSH Credentials */}
                <div className="p-4 bg-white/5 rounded-lg space-y-4">
                  <h3 className="font-semibold text-text-primary">SSH / Root Credentials</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={allocateData.username}
                        onChange={(e) => setAllocateData({ ...allocateData, username: e.target.value })}
                        placeholder="root"
                        className="input-field font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="flex gap-2">
                        <Input
                          value={allocateData.password}
                          onChange={(e) => setAllocateData({ ...allocateData, password: e.target.value })}
                          placeholder="Enter password"
                          className="input-field font-mono"
                          data-testid="allocate-password"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={generatePassword} title="Generate password">
                          Gen
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>SSH Port</Label>
                      <Input
                        value={allocateData.port}
                        onChange={(e) => setAllocateData({ ...allocateData, port: e.target.value })}
                        placeholder="22"
                        className="input-field font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Control Panel Credentials (Optional) */}
                <div className="p-4 bg-white/5 rounded-lg space-y-4">
                  <h3 className="font-semibold text-text-primary">Control Panel (Optional)</h3>
                  <p className="text-text-muted text-sm">cPanel, WHM, Plesk, or any other control panel</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Panel URL</Label>
                      <Input
                        value={allocateData.control_panel_url}
                        onChange={(e) => setAllocateData({ ...allocateData, control_panel_url: e.target.value })}
                        placeholder="https://server:2087"
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={allocateData.control_panel_username}
                        onChange={(e) => setAllocateData({ ...allocateData, control_panel_username: e.target.value })}
                        placeholder="admin"
                        className="input-field font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        value={allocateData.control_panel_password}
                        onChange={(e) => setAllocateData({ ...allocateData, control_panel_password: e.target.value })}
                        placeholder="Password"
                        className="input-field font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label>Additional Notes (included in email)</Label>
                  <Textarea
                    value={allocateData.additional_notes}
                    onChange={(e) => setAllocateData({ ...allocateData, additional_notes: e.target.value })}
                    placeholder="Any special instructions or information for the user..."
                    className="input-field min-h-[80px]"
                  />
                </div>

                {/* Send Email Toggle */}
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                  <input
                    type="checkbox"
                    id="send_email"
                    checked={allocateData.send_email}
                    onChange={(e) => setAllocateData({ ...allocateData, send_email: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                  />
                  <label htmlFor="send_email" className="text-text-primary cursor-pointer">
                    Send credentials email to user automatically
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAllocateOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 btn-primary"
                    onClick={handleAllocateServer}
                    disabled={submitting}
                    data-testid="submit-allocate"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Allocating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        Allocate Server
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Servers Table */}
        {servers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Server className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Servers Yet</h2>
            <p className="text-text-secondary mb-4">Allocate servers to users or provision from Orders page.</p>
            <Button className="btn-primary" onClick={() => setAllocateOpen(true)}>
              <UserPlus className="w-5 h-5 mr-2" />
              Allocate First Server
            </Button>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Server</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">IP Address</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Credentials</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {servers.map((server) => (
                    <tr key={server.id} className="hover:bg-white/5" data-testid={`admin-server-${server.id}`}>
                      <td className="px-6 py-4">
                        {editingId === server.id ? (
                          <Input
                            value={editData.hostname}
                            onChange={(e) => setEditData({ ...editData, hostname: e.target.value })}
                            className="input-field h-8 text-sm"
                          />
                        ) : (
                          <div>
                            <p className="text-text-primary font-medium">{server.hostname}</p>
                            <p className="text-text-muted text-xs">{server.plan_name || 'Custom'}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-text-primary text-sm">{server.user_email || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === server.id ? (
                          <Input
                            value={editData.ip_address}
                            onChange={(e) => setEditData({ ...editData, ip_address: e.target.value })}
                            className="input-field h-8 text-sm font-mono"
                          />
                        ) : (
                          <span className="font-mono text-text-primary">{server.ip_address}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === server.id ? (
                          <div className="space-y-1">
                            <Input
                              value={editData.username}
                              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                              className="input-field h-8 text-sm font-mono"
                              placeholder="Username"
                            />
                            <Input
                              value={editData.password}
                              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                              className="input-field h-8 text-sm font-mono"
                              placeholder="Password"
                            />
                          </div>
                        ) : (
                          <div className="font-mono text-sm">
                            <p className="text-text-primary">{server.username}</p>
                            <p className="text-text-muted">••••••••</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === server.id ? (
                          <Select
                            value={editData.status}
                            onValueChange={(value) => setEditData({ ...editData, status: value })}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background-paper border-white/10">
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="terminated">Terminated</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(server.status)}`}>
                            {server.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-muted text-sm">{formatDate(server.created_at)}</td>
                      <td className="px-6 py-4">
                        {editingId === server.id ? (
                          <div className="flex gap-2">
                            <Button size="sm" className="btn-primary text-xs" onClick={() => handleSave(server.id)}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEdit(server)}
                              title="Edit server"
                              data-testid={`edit-server-${server.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleSendCredentials(server.id)}
                              disabled={sendingEmail === server.id}
                              title="Send credentials to user"
                              data-testid={`send-credentials-${server.id}`}
                            >
                              {sendingEmail === server.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminServers;
