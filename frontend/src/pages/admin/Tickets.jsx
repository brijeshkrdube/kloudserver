import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ChevronRight, User } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusColor, getPriorityColor } from '../../lib/utils';

const AdminTickets = () => {
  const { api } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/admin/tickets', { params });
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="admin-tickets-title">
              Support Tickets
            </h1>
            <p className="text-text-secondary mt-1">Manage customer support requests</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 input-field" data-testid="ticket-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Tickets Found</h2>
            <p className="text-text-secondary">No tickets match your filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/admin/tickets/${ticket.id}`}
                className="glass-card p-6 flex items-center gap-4 group hover:border-primary/30 transition-all"
                data-testid={`admin-ticket-${ticket.id}`}
              >
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                      {ticket.subject}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm">
                    Created {formatDate(ticket.created_at)} • Last updated {formatDate(ticket.updated_at)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminTickets;
