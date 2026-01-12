import { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { toast } from 'sonner';

const UserBilling = () => {
  const { api } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices/');
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    setDownloading(invoiceId);
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-accent-success" />;
      case 'pending':
      case 'unpaid':
        return <Clock className="w-4 h-4 text-accent-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-accent-error" />;
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
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="billing-title">
            Billing & Invoices
          </h1>
          <p className="text-text-secondary mt-1">View and download your invoices</p>
        </div>

        {/* Invoices */}
        {invoices.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Invoices Yet</h2>
            <p className="text-text-secondary">Your invoices will appear here after you place an order.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/5" data-testid={`invoice-${invoice.id}`}>
                      <td className="px-6 py-4">
                        <span className="font-mono text-primary">{invoice.invoice_number}</span>
                      </td>
                      <td className="px-6 py-4 text-text-primary">{invoice.description}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-text-primary font-semibold">{formatCurrency(invoice.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invoice.status)}
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted text-sm">{formatDate(invoice.due_date)}</td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                          disabled={downloading === invoice.id}
                          className="border-primary/30 text-primary hover:bg-primary/10"
                          data-testid={`download-invoice-${invoice.id}`}
                        >
                          {downloading === invoice.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-1" />
                              Download PDF
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Payment Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-primary font-medium mb-2">Bank Transfer</h3>
              <p className="text-text-secondary text-sm">
                Contact support for bank transfer details. Include your invoice number as reference.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-primary font-medium mb-2">Cryptocurrency</h3>
              <p className="text-text-secondary text-sm">
                Contact support for cryptocurrency payment options. Include your invoice number.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserBilling;
