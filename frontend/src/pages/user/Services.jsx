import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Server, Plus, ExternalLink } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusColor } from '../../lib/utils';

const UserServices = () => {
  const { api } = useAuth();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await api.get('/servers/');
        setServers(response.data);
      } catch (error) {
        console.error('Failed to fetch servers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
  }, [api]);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="services-title">
              My Services
            </h1>
            <p className="text-text-secondary mt-1">Manage your active servers and services</p>
          </div>
          <Link to="/dashboard/order">
            <Button className="btn-primary" data-testid="order-new-btn">
              <Plus className="w-5 h-5 mr-2" />
              Order New Server
            </Button>
          </Link>
        </div>

        {/* Servers List */}
        {servers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Server className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Active Services</h2>
            <p className="text-text-secondary mb-6">You don't have any active servers yet.</p>
            <Link to="/dashboard/order">
              <Button className="btn-primary">Order Your First Server</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {servers.map((server) => (
              <Link
                key={server.id}
                to={`/dashboard/servers/${server.id}`}
                className="glass-card p-6 group hover:border-primary/30 transition-all"
                data-testid={`service-${server.id}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Server className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {server.hostname}
                      </h3>
                      <p className="text-text-secondary text-sm">{server.plan_name}</p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wider">IP Address</p>
                      <p className="text-text-primary font-mono">{server.ip_address}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wider">OS</p>
                      <p className="text-text-primary">{server.os}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wider">Renewal</p>
                      <p className="text-text-primary">{formatDate(server.renewal_date)}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wider">Status</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(server.status)}`}>
                        {server.status}
                      </span>
                    </div>
                  </div>

                  <ExternalLink className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors hidden lg:block" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserServices;
