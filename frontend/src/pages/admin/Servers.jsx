import { useState, useEffect } from 'react';
import { Server, Edit, Save, X, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusColor } from '../../lib/utils';
import { toast } from 'sonner';

const AdminServers = () => {
  const { api } = useAuth();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await api.get('/admin/servers');
      setServers(response.data);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
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
      fetchServers();
    } catch (error) {
      toast.error('Failed to update server');
    }
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
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="admin-servers-title">
            Server Management
          </h1>
          <p className="text-text-secondary mt-1">Manage provisioned servers and credentials</p>
        </div>

        {/* Servers Table */}
        {servers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Server className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Servers Yet</h2>
            <p className="text-text-secondary">Provision servers from the Orders page.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Server</th>
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
                            <p className="text-text-muted text-xs">{server.plan_name}</p>
                          </div>
                        )}
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
                            <SelectContent>
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
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(server)}>
                            <Edit className="w-4 h-4" />
                          </Button>
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
