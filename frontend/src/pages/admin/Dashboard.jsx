import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Server, Package, CreditCard, MessageSquare, TrendingUp, ChevronRight, DollarSign } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';

const AdminDashboard = () => {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [api]);

  const quickStats = stats ? [
    { icon: Users, label: 'Total Users', value: stats.total_users, href: '/admin/users', color: 'text-primary' },
    { icon: Package, label: 'Total Orders', value: stats.total_orders, href: '/admin/orders', color: 'text-accent-cyan' },
    { icon: Server, label: 'Active Servers', value: stats.active_servers, href: '/admin/servers', color: 'text-accent-success' },
    { icon: DollarSign, label: 'Total Revenue', value: formatCurrency(stats.total_revenue), href: '/admin/billing', color: 'text-accent-warning' },
  ] : [];

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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="admin-dashboard-title">
            Admin Dashboard
          </h1>
          <p className="text-text-secondary mt-1">Overview of your platform</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Link
              key={index}
              to={stat.href}
              className="glass-card p-6 group hover:border-primary/30 transition-all"
              data-testid={`admin-stat-${stat.label.toLowerCase().replace(' ', '-')}`}
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

        {/* Pending Items Alert */}
        {stats?.pending_orders > 0 && (
          <div className="glass-card p-6 border-accent-warning/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent-warning/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-accent-warning" />
              </div>
              <div className="flex-1">
                <p className="text-text-primary font-medium">{stats.pending_orders} pending order(s) require attention</p>
                <p className="text-text-muted text-sm">Review and process new orders</p>
              </div>
              <Link to="/admin/orders" className="btn-primary px-4 py-2 rounded-lg text-sm">
                View Orders
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/admin/orders" className="glass-card p-6 hover:border-primary/30 transition-all group">
            <Package className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-heading text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
              Manage Orders
            </h3>
            <p className="text-text-muted text-sm">View, approve, and manage customer orders</p>
          </Link>
          <Link to="/admin/servers" className="glass-card p-6 hover:border-primary/30 transition-all group">
            <Server className="w-8 h-8 text-accent-success mb-4" />
            <h3 className="font-heading text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
              Server Management
            </h3>
            <p className="text-text-muted text-sm">Create and manage server credentials</p>
          </Link>
          <Link to="/admin/tickets" className="glass-card p-6 hover:border-primary/30 transition-all group">
            <MessageSquare className="w-8 h-8 text-accent-cyan mb-4" />
            <h3 className="font-heading text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
              Support Tickets
            </h3>
            <p className="text-text-muted text-sm">Respond to customer support requests</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
