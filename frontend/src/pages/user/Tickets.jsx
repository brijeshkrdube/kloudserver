import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, ChevronRight, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusColor, getPriorityColor } from '../../lib/utils';
import { toast } from 'sonner';

const UserTickets = () => {
  const { api } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    orderId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, ordersRes] = await Promise.all([
          api.get('/tickets'),
          api.get('/orders'),
        ]);
        setTickets(ticketsRes.data);
        setOrders(ordersRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api]);

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/tickets', {
        subject: newTicket.subject,
        message: newTicket.message,
        priority: newTicket.priority,
        order_id: newTicket.orderId || null,
      });
      setTickets([response.data, ...tickets]);
      toast.success('Ticket created successfully!');
      setCreateOpen(false);
      setNewTicket({ subject: '', message: '', priority: 'medium', orderId: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="tickets-title">
              Support Tickets
            </h1>
            <p className="text-text-secondary mt-1">Get help from our support team</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="create-ticket-btn">
                <Plus className="w-5 h-5 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background-paper border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Create Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="input-field"
                    data-testid="ticket-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    placeholder="Describe your issue in detail..."
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    className="input-field min-h-[120px]"
                    data-testid="ticket-message"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                    >
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Related Order (Optional)</Label>
                    <Select
                      value={newTicket.orderId}
                      onValueChange={(value) => setNewTicket({ ...newTicket, orderId: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger className="input-field">
                        <SelectValue placeholder="Select order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {orders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.plan_name} - {order.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="w-full btn-primary"
                  onClick={handleCreateTicket}
                  disabled={submitting}
                  data-testid="submit-ticket"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Ticket'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Support Tickets</h2>
            <p className="text-text-secondary mb-6">Need help? Create a support ticket and we'll assist you.</p>
            <Button className="btn-primary" onClick={() => setCreateOpen(true)}>
              Create Your First Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/dashboard/tickets/${ticket.id}`}
                className="glass-card p-6 flex items-center gap-4 group hover:border-primary/30 transition-all"
                data-testid={`ticket-${ticket.id}`}
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

export default UserTickets;
