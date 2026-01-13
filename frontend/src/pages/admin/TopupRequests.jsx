import { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Eye, Building2, Bitcoin, Loader2, ExternalLink } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminTopupRequests = () => {
  const { api } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRequests = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/admin/topup-requests' 
        : `/admin/topup-requests?status=${statusFilter}`;
      const response = await api.get(url);
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch topup requests:', error);
      toast.error('Failed to fetch topup requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [api, statusFilter]);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setViewDialogOpen(true);
  };

  const handleProcessRequest = async (status) => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      await api.put(`/admin/topup-requests/${selectedRequest.id}?status=${status}${adminNotes ? `&admin_notes=${encodeURIComponent(adminNotes)}` : ''}`);
      toast.success(`Request ${status} successfully`);
      setViewDialogOpen(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${status} request`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium"><Clock className="w-3 h-3" /> Pending</span>;
      case 'approved':
        return <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return status;
    }
  };

  const getMethodIcon = (method) => {
    return method === 'bank_transfer' 
      ? <Building2 className="w-5 h-5 text-blue-500" />
      : <Bitcoin className="w-5 h-5 text-orange-500" />;
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
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="topup-requests-title">
              Topup Requests
            </h1>
            <p className="text-text-secondary mt-1">Manage wallet topup requests from users</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 input-field">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-background-paper border-white/10">
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Pending</p>
                <p className="text-xl font-bold text-text-primary">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Approved</p>
                <p className="text-xl font-bold text-text-primary">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Rejected</p>
                <p className="text-xl font-bold text-text-primary">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Total Value</p>
                <p className="text-xl font-bold text-text-primary">
                  {formatCurrency(requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="glass-card overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No topup requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-text-muted font-medium">User</th>
                    <th className="text-left p-4 text-text-muted font-medium">Amount</th>
                    <th className="text-left p-4 text-text-muted font-medium">Method</th>
                    <th className="text-left p-4 text-text-muted font-medium">Reference</th>
                    <th className="text-left p-4 text-text-muted font-medium">Date</th>
                    <th className="text-left p-4 text-text-muted font-medium">Status</th>
                    <th className="text-right p-4 text-text-muted font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`topup-row-${request.id}`}>
                      <td className="p-4">
                        <p className="text-text-primary font-medium">{request.user_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-mono font-bold text-primary">{formatCurrency(request.amount)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getMethodIcon(request.payment_method)}
                          <span className="text-text-secondary capitalize">
                            {request.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-text-secondary font-mono text-sm truncate max-w-[150px]" title={request.transaction_ref}>
                          {request.transaction_ref || '-'}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-text-secondary text-sm">{formatDateTime(request.created_at)}</p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                          data-testid={`view-request-${request.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View/Process Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-background-paper border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Topup Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6 mt-4">
              {/* Request Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-text-muted">User</span>
                  <span className="text-text-primary font-medium">{selectedRequest.user_email}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-text-muted">Amount</span>
                  <span className="text-primary font-mono font-bold text-lg">{formatCurrency(selectedRequest.amount)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-text-muted">Payment Method</span>
                  <div className="flex items-center gap-2">
                    {getMethodIcon(selectedRequest.payment_method)}
                    <span className="capitalize">{selectedRequest.payment_method.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-text-muted">Transaction Ref</span>
                  <span className="text-text-primary font-mono text-sm">{selectedRequest.transaction_ref || '-'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-text-muted">Date</span>
                  <span className="text-text-secondary">{formatDateTime(selectedRequest.created_at)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-text-muted">Status</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {/* Payment Proof */}
              {selectedRequest.payment_proof && (
                <div className="space-y-2">
                  <Label>Payment Proof</Label>
                  <div className="border border-white/10 rounded-lg p-2">
                    <a 
                      href={`${API_URL}/api/uploads/payment_proofs/${selectedRequest.payment_proof}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Payment Screenshot
                    </a>
                  </div>
                </div>
              )}

              {/* Admin Notes (for pending requests) */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-2">
                  <Label>Admin Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add notes for rejection reason or approval comments..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="input-field min-h-[80px]"
                  />
                </div>
              )}

              {/* Processed Info */}
              {selectedRequest.status !== 'pending' && (
                <div className="p-4 bg-white/5 rounded-lg space-y-2">
                  <p className="text-sm text-text-muted">
                    Processed by: <span className="text-text-primary">{selectedRequest.processed_by || 'System'}</span>
                  </p>
                  <p className="text-sm text-text-muted">
                    Processed at: <span className="text-text-primary">{formatDateTime(selectedRequest.processed_at)}</span>
                  </p>
                  {selectedRequest.admin_notes && (
                    <p className="text-sm text-text-muted">
                      Notes: <span className="text-text-primary">{selectedRequest.admin_notes}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleProcessRequest('rejected')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleProcessRequest('approved')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminTopupRequests;
