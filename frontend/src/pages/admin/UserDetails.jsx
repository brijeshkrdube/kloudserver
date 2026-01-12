import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, ArrowLeft, Server, FileText, Ticket, CreditCard, Mail, Send, Clock, DollarSign, Package, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { toast } from 'sonner';

const AdminUserDetails = () => {
  const { userId } = useParams();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState({
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/admin/users/${userId}/details`);
      setUserData(response.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notification.subject || !notification.message) {
      toast.error('Please enter subject and message');
      return;
    }

    setSending(true);
    try {
      await api.post(`/admin/users/${userId}/notify`, null, {
        params: {
          subject: notification.subject,
          message: notification.message
        }
      });
      toast.success('Notification sent successfully');
      setNotifyOpen(false);
      setNotification({ subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
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

  if (!userData) {
    return (
      <DashboardLayout isAdmin>
        <div className="text-center py-12">
          <h2 className="text-xl text-text-primary">User not found</h2>
          <Link to="/admin/users" className="text-primary hover:underline mt-2 inline-block">Back to Users</Link>
        </div>
      </DashboardLayout>
    );
  }

  const { user, statistics, orders, invoices, servers, tickets, transactions, upcoming_payments } = userData;

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/users" 
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              data-testid="back-to-users"
            >
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </Link>
            <div>
              <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="user-details-title">
                {user.full_name}
              </h1>
              <p className="text-text-secondary">{user.email}</p>
            </div>
          </div>
          <Button 
            onClick={() => setNotifyOpen(true)}
            className="btn-primary"
            data-testid="send-notification-btn"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-success/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-accent-success" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Total Spent</p>
                <p className="text-text-primary text-xl font-bold">{formatCurrency(statistics.total_spent)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Active Services</p>
                <p className="text-text-primary text-xl font-bold">{statistics.active_services}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-info/20 rounded-lg">
                <Package className="w-5 h-5 text-accent-info" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Total Orders</p>
                <p className="text-text-primary text-xl font-bold">{statistics.total_orders}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-warning/20 rounded-lg">
                <Ticket className="w-5 h-5 text-accent-warning" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Open Tickets</p>
                <p className="text-text-primary text-xl font-bold">{statistics.open_tickets}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            User Information
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-text-muted text-sm">Email</p>
              <p className="text-text-primary">{user.email}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Wallet Balance</p>
              <p className="text-text-primary font-mono">{formatCurrency(user.wallet_balance || 0)}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Status</p>
              <span className={`px-2 py-1 rounded text-xs ${user.is_active ? 'bg-accent-success/20 text-accent-success' : 'bg-accent-error/20 text-accent-error'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p className="text-text-muted text-sm">2FA Enabled</p>
              <p className="text-text-primary">{user.totp_enabled ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Registered</p>
              <p className="text-text-primary">{formatDate(user.created_at)}</p>
            </div>
            {user.company && (
              <div>
                <p className="text-text-muted text-sm">Company</p>
                <p className="text-text-primary">{user.company}</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Payments Alert */}
        {upcoming_payments.length > 0 && (
          <div className="glass-card p-4 border-l-4 border-accent-warning">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-accent-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-text-primary font-medium">Upcoming Payments</h3>
                <p className="text-text-secondary text-sm">
                  This user has {upcoming_payments.length} pending invoice(s) totaling{' '}
                  {formatCurrency(upcoming_payments.reduce((sum, inv) => sum + inv.amount, 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for detailed info */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="bg-background-paper border border-white/5 mb-6 flex-wrap h-auto p-1">
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="servers">Servers ({servers.length})</TabsTrigger>
            <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
            <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
            <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="glass-card overflow-hidden">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-text-muted">No orders found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 font-mono text-sm text-text-primary">{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-text-primary">{order.plan_name}</td>
                        <td className="px-6 py-4 font-mono text-text-primary">{formatCurrency(order.amount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.order_status)}`}>
                            {order.order_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-text-muted text-sm">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Servers Tab */}
          <TabsContent value="servers">
            <div className="glass-card overflow-hidden">
              {servers.length === 0 ? (
                <div className="p-8 text-center text-text-muted">No servers found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Hostname</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">OS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Renewal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {servers.map((server) => (
                      <tr key={server.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 text-text-primary">{server.hostname}</td>
                        <td className="px-6 py-4 font-mono text-text-primary">{server.ip_address}</td>
                        <td className="px-6 py-4 text-text-muted">{server.os}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(server.status)}`}>
                            {server.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-text-muted text-sm">{formatDate(server.renewal_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <div className="glass-card overflow-hidden">
              {invoices.length === 0 ? (
                <div className="p-8 text-center text-text-muted">No invoices found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 font-mono text-sm text-text-primary">{invoice.invoice_number}</td>
                        <td className="px-6 py-4 text-text-primary">{invoice.description}</td>
                        <td className="px-6 py-4 font-mono text-text-primary">{formatCurrency(invoice.amount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-text-muted text-sm">{formatDate(invoice.due_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <div className="glass-card overflow-hidden">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-text-muted">No tickets found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Ticket ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 font-mono text-sm text-text-primary">{ticket.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-text-primary">{ticket.subject}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            ticket.priority === 'high' ? 'bg-accent-error/20 text-accent-error' :
                            ticket.priority === 'medium' ? 'bg-accent-warning/20 text-accent-warning' :
                            'bg-accent-info/20 text-accent-info'
                          }`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-text-muted text-sm">{formatDate(ticket.created_at)}</td>
                        <td className="px-6 py-4">
                          <Link to={`/admin/tickets/${ticket.id}`} className="text-primary text-sm hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <div className="glass-card overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-text-muted">No transactions found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/5">
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.type === 'credit' ? 'bg-accent-success/20 text-accent-success' : 'bg-accent-error/20 text-accent-error'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-text-primary">
                          {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4 text-text-muted">{tx.description}</td>
                        <td className="px-6 py-4 text-text-muted text-sm">{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Notification Dialog */}
        <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
          <DialogContent className="bg-background-paper border-white/10 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Send Notification to {user.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={notification.subject}
                  onChange={(e) => setNotification({ ...notification, subject: e.target.value })}
                  placeholder="Payment Reminder"
                  className="input-field"
                  data-testid="notify-subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <textarea
                  value={notification.message}
                  onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                  placeholder="Enter your message..."
                  rows={6}
                  className="input-field w-full rounded-md border px-3 py-2"
                  data-testid="notify-message"
                />
              </div>
              <p className="text-text-muted text-sm">
                This will send an email to {user.email}
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setNotifyOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="btn-primary"
                onClick={handleSendNotification}
                disabled={sending}
                data-testid="send-notify-btn"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
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

export default AdminUserDetails;
