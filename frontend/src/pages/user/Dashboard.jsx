import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Server, CreditCard, Wallet, MessageSquare, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';

const UserDashboard = () => {
  const { api, user } = useAuth();
  const [stats, setStats] = useState({
    servers: [],
    orders: [],
    invoices: [],
    tickets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [serversRes, ordersRes, invoicesRes, ticketsRes] = await Promise.all([
          api.get('/servers/'),
          api.get('/orders/'),
          api.get('/invoices/'),
          api.get('/tickets/'),
        ]);
        setStats({
          servers: serversRes.data,
          orders: ordersRes.data,
          invoices: invoicesRes.data,
          tickets: ticketsRes.data,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api]);

  const activeServers = stats.servers.filter(s => s.status === 'active').length;
  const pendingOrders = stats.orders.filter(o => o.order_status === 'pending').length;
  const unpaidInvoices = stats.invoices.filter(i => i.status === 'unpaid').length;
  const openTickets = stats.tickets.filter(t => t.status === 'open').length;

  const quickStats = [
    { icon: Server, label: 'Active Servers', value: activeServers, href: '/dashboard/services', color: 'text-accent-success' },
    { icon: Clock, label: 'Pending Orders', value: pendingOrders, href: '/dashboard/billing', color: 'text-accent-warning' },
    { icon: CreditCard, label: 'Unpaid Invoices', value: unpaidInvoices, href: '/dashboard/billing', color: 'text-accent-error' },
    { icon: Wallet, label: 'Wallet Balance', value: formatCurrency(user?.wallet_balance || 0), href: '/dashboard/wallet', color: 'text-primary' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-2" data-testid="dashboard-title">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-text-secondary">Here's an overview of your account</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Link
              key={index}
              to={stat.href}
              className="glass-card p-6 group hover:border-primary/30 transition-all"
              data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
              </div>
              <p className="text-text-muted text-sm">{stat.label}</p>
              <p className="font-mono text-2xl font-bold text-text-primary">{stat.value}</p>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Servers */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-semibold text-text-primary">Active Services</h2>
              <Link to="/dashboard/services" className="text-primary text-sm hover:text-primary-hover">
                View All
              </Link>
            </div>
            {stats.servers.length === 0 ? (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No active services</p>
                <Link to="/dashboard/order" className="text-primary text-sm hover:text-primary-hover mt-2 inline-block">
                  Order your first server
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.servers.slice(0, 3).map((server) => (
                  <Link
                    key={server.id}
                    to={`/dashboard/servers/${server.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    data-testid={`server-${server.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Server className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-medium truncate">{server.hostname}</p>
                      <p className="text-text-muted text-sm font-mono">{server.ip_address}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(server.status)}`}>
                      {server.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-semibold text-text-primary">Recent Invoices</h2>
              <Link to="/dashboard/billing" className="text-primary text-sm hover:text-primary-hover">
                View All
              </Link>
            </div>
            {stats.invoices.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.invoices.slice(0, 4).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                    data-testid={`invoice-${invoice.id}`}
                  >
                    <div>
                      <p className="text-text-primary font-mono text-sm">{invoice.invoice_number}</p>
                      <p className="text-text-muted text-xs">{formatDate(invoice.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-primary font-mono font-medium">{formatCurrency(invoice.amount)}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Support Tickets */}
        {openTickets > 0 && (
          <div className="glass-card p-6 border-accent-warning/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent-warning/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-accent-warning" />
              </div>
              <div className="flex-1">
                <p className="text-text-primary font-medium">You have {openTickets} open support ticket(s)</p>
                <p className="text-text-muted text-sm">Check for updates or responses from our team</p>
              </div>
              <Link to="/dashboard/tickets" className="btn-secondary px-4 py-2 rounded-lg text-sm">
                View Tickets
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
