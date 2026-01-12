import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Edit, Save, X, Loader2, Eye } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ wallet_balance: 0 });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditData({ wallet_balance: user.wallet_balance || 0 });
  };

  const handleSave = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}`, null, { 
        params: { wallet_balance: parseFloat(editData.wallet_balance) }
      });
      toast.success('User updated successfully');
      setEditingId(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
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
          <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="admin-users-title">
            User Management
          </h1>
          <p className="text-text-secondary mt-1">View and manage registered users</p>
        </div>

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Users Found</h2>
            <p className="text-text-secondary">No users have registered yet.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Wallet</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">2FA</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5" data-testid={`admin-user-${user.id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-semibold">{user.full_name?.charAt(0) || 'U'}</span>
                          </div>
                          <div>
                            <p className="text-text-primary font-medium">{user.full_name}</p>
                            {user.company && <p className="text-text-muted text-xs">{user.company}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                      <td className="px-6 py-4">
                        {editingId === user.id ? (
                          <Input
                            type="number"
                            value={editData.wallet_balance}
                            onChange={(e) => setEditData({ wallet_balance: e.target.value })}
                            className="input-field w-28 h-8 font-mono"
                            step="0.01"
                          />
                        ) : (
                          <span className="font-mono text-text-primary">{formatCurrency(user.wallet_balance || 0)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.is_active 
                            ? 'bg-accent-success/20 text-accent-success' 
                            : 'bg-accent-error/20 text-accent-error'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.totp_enabled 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-white/5 text-text-muted'
                        }`}>
                          {user.totp_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-muted text-sm">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {editingId === user.id ? (
                            <>
                              <Button size="sm" className="btn-primary text-xs h-8" onClick={() => handleSave(user.id)}>
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Link
                                to={`/admin/users/${user.id}`}
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                                title="View user details"
                                data-testid={`view-user-${user.id}`}
                              >
                                <Eye className="w-4 h-4 text-primary" />
                              </Link>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8"
                                onClick={() => handleEdit(user)}
                                title="Edit wallet balance"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
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

export default AdminUsers;
