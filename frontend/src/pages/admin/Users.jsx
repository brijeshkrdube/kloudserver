import { useState, useEffect } from 'react';
import { Users, Edit, Wallet, Check, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [newBalance, setNewBalance] = useState('');

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

  const handleUpdateUser = async (userId, updates) => {
    try {
      await api.put(`/admin/users/${userId}`, null, { params: updates });
      toast.success('User updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleUpdateWallet = async () => {
    if (!newBalance || isNaN(parseFloat(newBalance))) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await api.put(`/admin/users/${selectedUser.id}`, null, {
        params: { wallet_balance: parseFloat(newBalance) }
      });
      toast.success('Wallet balance updated');
      setWalletOpen(false);
      setSelectedUser(null);
      setNewBalance('');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update wallet');
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
          <p className="text-text-secondary mt-1">Manage registered users</p>
        </div>

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Users Yet</h2>
            <p className="text-text-secondary">Users will appear here once they register.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Wallet</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Verified</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">2FA</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5" data-testid={`admin-user-${user.id}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-text-primary font-medium">{user.full_name}</p>
                          <p className="text-text-muted text-sm">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{user.company || '-'}</td>
                      <td className="px-6 py-4 font-mono text-text-primary">{formatCurrency(user.wallet_balance)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleUpdateUser(user.id, { is_verified: !user.is_verified })}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.is_verified ? 'text-accent-success bg-accent-success/10' : 'text-accent-warning bg-accent-warning/10'
                          }`}
                        >
                          {user.is_verified ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.is_2fa_enabled ? 'text-accent-success bg-accent-success/10' : 'text-text-muted bg-text-muted/10'
                        }`}>
                          {user.is_2fa_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-muted text-sm">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewBalance(user.wallet_balance.toString());
                            setWalletOpen(true);
                          }}
                        >
                          <Wallet className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Update Wallet Dialog */}
        <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
          <DialogContent className="bg-background-paper border-white/10">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Update Wallet Balance</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-text-muted text-sm">User: <span className="text-text-primary">{selectedUser.full_name}</span></p>
                  <p className="text-text-muted text-sm">Current Balance: <span className="text-text-primary font-mono">{formatCurrency(selectedUser.wallet_balance)}</span></p>
                </div>
                <div className="space-y-2">
                  <Label>New Balance (USD)</Label>
                  <Input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="input-field font-mono"
                    step="0.01"
                    data-testid="new-balance"
                  />
                </div>
                <Button className="w-full btn-primary" onClick={handleUpdateWallet} data-testid="update-balance">
                  Update Balance
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
