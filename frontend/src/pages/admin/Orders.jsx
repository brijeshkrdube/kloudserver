import { useState, useEffect } from 'react';
import { Package, Check, X, Loader2, Server, User, Eye, Wallet, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { toast } from 'sonner';

const AdminOrders = () => {
  const { api } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [serverData, setServerData] = useState({
    ip_address: '',
    hostname: '',
    username: 'root',
    password: '',
    ssh_port: '22',
    panel_url: '',
    panel_username: '',
    panel_password: '',
    additional_notes: '',
    send_email: true,
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/admin/orders', { params });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      await api.put(`/admin/orders/${orderId}`, updates);
      toast.success('Order updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const handleProvisionServer = async () => {
    if (!serverData.ip_address || !serverData.hostname || !serverData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/servers', {
        order_id: selectedOrder.id,
        ip_address: serverData.ip_address,
        hostname: serverData.hostname,
        username: serverData.username,
        password: serverData.password,
        ssh_port: parseInt(serverData.ssh_port),
        panel_url: serverData.panel_url || null,
        panel_username: serverData.panel_username || null,
        panel_password: serverData.panel_password || null,
        additional_notes: serverData.additional_notes || null,
        send_email: serverData.send_email,
      });
      toast.success('Server provisioned and credentials sent to customer!');
      setProvisionOpen(false);
      setSelectedOrder(null);
      resetServerData();
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to provision server');
    } finally {
      setSubmitting(false);
    }
  };

  const resetServerData = () => {
    setServerData({
      ip_address: '',
      hostname: '',
      username: 'root',
      password: '',
      ssh_port: '22',
      panel_url: '',
      panel_username: '',
      panel_password: '',
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
    setServerData({ ...serverData, password });
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
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="admin-orders-title">
              Order Management
            </h1>
            <p className="text-text-secondary mt-1">Manage and process customer orders</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 input-field" data-testid="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Package className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Orders Found</h2>
            <p className="text-text-secondary">No orders match your filter criteria.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5" data-testid={`admin-order-${order.id}`}>
                      <td className="px-6 py-4 font-mono text-sm text-text-primary">{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-text-primary text-sm font-medium">{order.user_name || 'Unknown'}</p>
                            <p className="text-text-muted text-xs">{order.user_email || 'No email'}</p>
                            {order.user_company && (
                              <p className="text-text-muted text-xs">{order.user_company}</p>
                            )}
                          </div>
                          <Link 
                            to={`/admin/users/${order.user_id}`}
                            className="ml-1 p-1 rounded hover:bg-white/10 transition-colors"
                            title="View user details"
                          >
                            <Eye className="w-3 h-3 text-primary" />
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-text-primary">{order.plan_name}</p>
                          <p className="text-text-muted text-xs">{order.os}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-text-primary">{formatCurrency(order.amount)}</td>
                      <td className="px-6 py-4">
                        <Select
                          value={order.payment_status}
                          onValueChange={(value) => handleUpdateOrder(order.id, { payment_status: value })}
                        >
                          <SelectTrigger className={`w-28 h-8 text-xs ${getStatusColor(order.payment_status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="pending_verification">Verifying</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={order.order_status}
                          onValueChange={(value) => handleUpdateOrder(order.id, { order_status: value })}
                        >
                          <SelectTrigger className={`w-28 h-8 text-xs ${getStatusColor(order.order_status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 text-text-muted text-sm">{formatDate(order.created_at)}</td>
                      <td className="px-6 py-4">
                        {order.payment_status === 'paid' && order.order_status === 'pending' && (
                          <Button
                            size="sm"
                            className="btn-primary text-xs"
                            onClick={() => {
                              setSelectedOrder(order);
                              setProvisionOpen(true);
                            }}
                            data-testid={`provision-${order.id}`}
                          >
                            <Server className="w-4 h-4 mr-1" />
                            Provision
                          </Button>
                        )}
                        {order.payment_proof_url && (
                          <a 
                            href={order.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-xs hover:underline ml-2"
                          >
                            View Proof
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Provision Server Dialog - Enhanced */}
        <Dialog open={provisionOpen} onOpenChange={(open) => {
          setProvisionOpen(open);
          if (!open) resetServerData();
        }}>
          <DialogContent className="bg-background-paper border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Provision Server for Order</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6 mt-4">
                {/* Order Summary */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted">Order ID</p>
                      <p className="text-text-primary font-mono">{selectedOrder.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Customer</p>
                      <p className="text-text-primary">{selectedOrder.user_name}</p>
                      <p className="text-text-muted text-xs">{selectedOrder.user_email}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Plan</p>
                      <p className="text-text-primary">{selectedOrder.plan_name}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">OS</p>
                      <p className="text-text-primary">{selectedOrder.os}</p>
                    </div>
                    {selectedOrder.data_center_name && (
                      <div>
                        <p className="text-text-muted">Data Center</p>
                        <p className="text-text-primary">{selectedOrder.data_center_name}</p>
                      </div>
                    )}
                    {selectedOrder.control_panel && (
                      <div>
                        <p className="text-text-muted">Control Panel</p>
                        <p className="text-text-primary capitalize">{selectedOrder.control_panel}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-text-muted">Amount</p>
                      <p className="text-primary font-bold">{formatCurrency(selectedOrder.amount)}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Payment</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedOrder.payment_status)}`}>
                        {selectedOrder.payment_status === 'paid' ? '✓ Paid' : selectedOrder.payment_status}
                      </span>
                    </div>
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
                      <Label>IP Address *</Label>
                      <Input
                        placeholder="192.168.1.1"
                        value={serverData.ip_address}
                        onChange={(e) => setServerData({ ...serverData, ip_address: e.target.value })}
                        className="input-field font-mono"
                        data-testid="server-ip"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hostname *</Label>
                      <Input
                        placeholder="server1.kloudnests.com"
                        value={serverData.hostname}
                        onChange={(e) => setServerData({ ...serverData, hostname: e.target.value })}
                        className="input-field"
                        data-testid="server-hostname"
                      />
                    </div>
                  </div>
                </div>

                {/* SSH Credentials */}
                <div className="p-4 bg-white/5 rounded-lg space-y-4">
                  <h3 className="font-semibold text-text-primary">SSH / Root Credentials</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Username *</Label>
                      <Input
                        placeholder="root"
                        value={serverData.username}
                        onChange={(e) => setServerData({ ...serverData, username: e.target.value })}
                        className="input-field font-mono"
                        data-testid="server-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Secure password"
                          value={serverData.password}
                          onChange={(e) => setServerData({ ...serverData, password: e.target.value })}
                          className="input-field font-mono"
                          data-testid="server-password"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={generatePassword} title="Generate password">
                          Gen
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>SSH Port</Label>
                      <Input
                        placeholder="22"
                        value={serverData.ssh_port}
                        onChange={(e) => setServerData({ ...serverData, ssh_port: e.target.value })}
                        className="input-field font-mono"
                        data-testid="server-port"
                      />
                    </div>
                  </div>
                </div>

                {/* Control Panel Credentials */}
                {selectedOrder.control_panel && selectedOrder.control_panel !== 'none' && (
                  <div className="p-4 bg-white/5 rounded-lg space-y-4">
                    <h3 className="font-semibold text-text-primary">Control Panel ({selectedOrder.control_panel})</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Panel URL</Label>
                        <Input
                          placeholder={`https://${serverData.ip_address || 'server'}:2087`}
                          value={serverData.panel_url}
                          onChange={(e) => setServerData({ ...serverData, panel_url: e.target.value })}
                          className="input-field"
                          data-testid="server-panel"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          placeholder="admin"
                          value={serverData.panel_username}
                          onChange={(e) => setServerData({ ...serverData, panel_username: e.target.value })}
                          className="input-field font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          placeholder="Panel password"
                          value={serverData.panel_password}
                          onChange={(e) => setServerData({ ...serverData, panel_password: e.target.value })}
                          className="input-field font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label>Additional Notes (included in email)</Label>
                  <Textarea
                    value={serverData.additional_notes}
                    onChange={(e) => setServerData({ ...serverData, additional_notes: e.target.value })}
                    placeholder="Any special instructions for the user..."
                    className="input-field min-h-[80px]"
                  />
                </div>

                {/* Send Email Toggle */}
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                  <input
                    type="checkbox"
                    id="send_email"
                    checked={serverData.send_email}
                    onChange={(e) => setServerData({ ...serverData, send_email: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                  />
                  <label htmlFor="send_email" className="text-text-primary cursor-pointer">
                    Send credentials email to customer automatically
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setProvisionOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 btn-primary"
                    onClick={handleProvisionServer}
                    disabled={submitting}
                    data-testid="submit-provision"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Provisioning...
                      </>
                    ) : (
                      <>
                        <Server className="w-5 h-5 mr-2" />
                        Provision Server
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrders;
