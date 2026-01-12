import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Send, Loader2, User, Shield } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, getStatusColor, getPriorityColor } from '../../lib/utils';
import { toast } from 'sonner';

const AdminTicketDetails = () => {
  const { ticketId } = useParams();
  const { api } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ticketUser, setTicketUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/admin/tickets/${ticketId}`);
      setTicket(response.data.ticket);
      setMessages(response.data.messages);
      setTicketUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await api.post(`/admin/tickets/${ticketId}/messages`, {
        message: newMessage,
      });
      setMessages([...messages, {
        id: Date.now().toString(),
        message: newMessage,
        is_staff: true,
        created_at: new Date().toISOString(),
      }]);
      setNewMessage('');
      toast.success('Reply sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await api.put(`/admin/tickets/${ticketId}/status`, null, { params: { status } });
      setTicket({ ...ticket, status });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
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

  if (!ticket) {
    return (
      <DashboardLayout isAdmin>
        <div className="text-center py-12">
          <p className="text-text-muted">Ticket not found</p>
          <Link to="/admin/tickets" className="text-primary hover:text-primary-hover mt-2 inline-block">
            Back to tickets
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin/tickets" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-text-primary" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-heading text-2xl font-bold text-text-primary" data-testid="admin-ticket-subject">
                {ticket.subject}
              </h1>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
            <p className="text-text-muted text-sm">Created {formatDateTime(ticket.created_at)}</p>
          </div>
          <Select value={ticket.status} onValueChange={handleUpdateStatus}>
            <SelectTrigger className={`w-32 ${getStatusColor(ticket.status)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Messages */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="space-y-6 mb-6 max-h-[500px] overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.is_staff ? 'flex-row-reverse' : ''}`}
                  data-testid={`admin-message-${msg.id}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.is_staff ? 'bg-accent-purple/10' : 'bg-primary/10'
                  }`}>
                    {msg.is_staff ? (
                      <Shield className="w-5 h-5 text-accent-purple" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${msg.is_staff ? 'text-right' : ''}`}>
                    <div className={`inline-block p-4 rounded-lg ${
                      msg.is_staff ? 'bg-accent-purple/10' : 'bg-white/5'
                    }`}>
                      <p className="text-text-primary whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <p className="text-text-muted text-xs mt-1">
                      {msg.is_staff ? 'You' : 'Customer'} • {formatDateTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            {ticket.status !== 'closed' && (
              <div className="border-t border-white/5 pt-6">
                <div className="flex gap-4">
                  <Textarea
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="input-field flex-1"
                    rows={3}
                    data-testid="admin-reply-input"
                  />
                  <Button
                    className="btn-primary self-end"
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    data-testid="admin-send-reply"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="glass-card p-6 h-fit">
            <h3 className="font-heading text-lg font-semibold text-text-primary mb-4">Customer Info</h3>
            {ticketUser && (
              <div className="space-y-3">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Name</p>
                  <p className="text-text-primary">{ticketUser.full_name}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Email</p>
                  <p className="text-text-primary">{ticketUser.email}</p>
                </div>
                {ticketUser.company && (
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider">Company</p>
                    <p className="text-text-primary">{ticketUser.company}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTicketDetails;
