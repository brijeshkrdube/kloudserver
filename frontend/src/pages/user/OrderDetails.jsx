import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Upload, FileImage, Loader2, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { toast } from 'sonner';

const UserOrderDetails = () => {
  const { orderId } = useParams();
  const { api } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofData, setProofData] = useState({
    proof_url: '',
    payment_reference: ''
  });

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async () => {
    if (!proofData.proof_url) {
      toast.error('Please enter the proof URL');
      return;
    }

    setUploading(true);
    try {
      await api.post(`/orders/${orderId}/payment-proof`, null, {
        params: {
          proof_url: proofData.proof_url,
          payment_reference: proofData.payment_reference || null
        }
      });
      toast.success('Payment proof uploaded successfully! Our team will verify your payment.');
      setUploadOpen(false);
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-accent-success" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-accent-warning" />;
      case 'pending_verification':
        return <Clock className="w-5 h-5 text-accent-info" />;
      default:
        return <AlertCircle className="w-5 h-5 text-accent-error" />;
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

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl text-text-primary">Order not found</h2>
          <Link to="/dashboard" className="text-primary hover:underline mt-2 inline-block">Back to Dashboard</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </Link>
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="order-title">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-text-secondary mt-1">Order details and payment status</p>
          </div>
        </div>

        {/* Order Status Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              {getPaymentStatusIcon(order.payment_status)}
              <div>
                <p className="text-text-muted text-sm">Payment Status</p>
                <p className={`text-lg font-semibold ${
                  order.payment_status === 'paid' ? 'text-accent-success' :
                  order.payment_status === 'pending_verification' ? 'text-accent-info' :
                  'text-accent-warning'
                }`}>
                  {order.payment_status === 'pending_verification' ? 'Pending Verification' : order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <Package className="w-5 h-5 text-primary" />
              <div>
                <p className="text-text-muted text-sm">Order Status</p>
                <p className={`text-lg font-semibold ${getStatusColor(order.order_status)}`}>
                  {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Action */}
        {order.payment_status !== 'paid' && (
          <div className="glass-card p-6 border-l-4 border-accent-warning">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-heading text-lg font-semibold text-text-primary mb-2">Payment Required</h2>
                <p className="text-text-secondary">
                  {order.payment_status === 'pending_verification' ? (
                    'Your payment proof has been submitted and is being reviewed by our team.'
                  ) : (
                    'Please complete your payment and upload proof to proceed with your order.'
                  )}
                </p>
                {order.payment_proof_url && (
                  <a 
                    href={order.payment_proof_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary text-sm mt-2 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View uploaded proof
                  </a>
                )}
              </div>
              {order.payment_status !== 'pending_verification' && (
                <Button
                  onClick={() => setUploadOpen(true)}
                  className="btn-primary"
                  data-testid="upload-proof-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Payment Proof
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Order Details
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-text-muted text-sm">Plan</p>
              <p className="text-text-primary font-medium">{order.plan_name}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Billing Cycle</p>
              <p className="text-text-primary">{order.billing_cycle}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Operating System</p>
              <p className="text-text-primary">{order.os}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Control Panel</p>
              <p className="text-text-primary">{order.control_panel || 'None'}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Amount</p>
              <p className="text-text-primary text-xl font-bold font-mono">{formatCurrency(order.amount)}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Order Date</p>
              <p className="text-text-primary">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">Payment Instructions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-primary font-medium mb-2">Bank Transfer</h3>
              <p className="text-text-secondary text-sm mb-2">
                Contact our support team for bank transfer details.
              </p>
              <p className="text-text-muted text-xs">
                Include order ID <span className="font-mono text-primary">{order.id.slice(0, 8)}</span> as reference.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-primary font-medium mb-2">Cryptocurrency</h3>
              <p className="text-text-secondary text-sm mb-2">
                Contact support for available cryptocurrency payment options.
              </p>
              <p className="text-text-muted text-xs">
                Include order ID as payment memo/reference.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Payment Proof Dialog */}
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent className="bg-background-paper border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <FileImage className="w-5 h-5 text-primary" />
                Upload Payment Proof
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Proof URL (Image/Screenshot Link) *</Label>
                <Input
                  value={proofData.proof_url}
                  onChange={(e) => setProofData({ ...proofData, proof_url: e.target.value })}
                  placeholder="https://imgur.com/your-screenshot.png"
                  className="input-field"
                  data-testid="proof-url-input"
                />
                <p className="text-text-muted text-xs">
                  Upload your payment screenshot to an image hosting service (e.g., Imgur, Google Drive) and paste the link here.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Payment Reference (Optional)</Label>
                <Input
                  value={proofData.payment_reference}
                  onChange={(e) => setProofData({ ...proofData, payment_reference: e.target.value })}
                  placeholder="Transaction ID or Reference Number"
                  className="input-field font-mono"
                  data-testid="payment-ref-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="btn-primary"
                onClick={handleUploadProof}
                disabled={uploading}
                data-testid="submit-proof-btn"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Proof
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

export default UserOrderDetails;
