import { useState, useEffect } from 'react';
import { CreditCard, Check } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { toast } from 'sonner';

const AdminBilling = () => {
  const { api } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/admin/invoices', { params });
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInvoice = async (invoiceId, status) => {
    try {
      await api.put(`/admin/invoices/${invoiceId}`, null, { params: { status } });
      toast.success('Invoice updated successfully');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to update invoice');
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
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="admin-billing-title">
              Billing Management
            </h1>
            <p className="text-text-secondary mt-1">Manage invoices and payments</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 input-field" data-testid="billing-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Invoices</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Table */}
        {invoices.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <CreditCard className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Invoices Found</h2>
            <p className="text-text-secondary">No invoices match your filter criteria.</p>
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
                    <tr key={invoice.id} className="hover:bg-white/5" data-testid={`admin-invoice-${invoice.id}`}>
                      <td className="px-6 py-4 font-mono text-sm text-text-primary">{invoice.invoice_number}</td>
                      <td className="px-6 py-4 text-text-primary">{invoice.description}</td>
                      <td className="px-6 py-4 font-mono text-text-primary">{formatCurrency(invoice.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-muted text-sm">{formatDate(invoice.due_date)}</td>
                      <td className="px-6 py-4">
                        {invoice.status === 'unpaid' && (
                          <Button
                            size="sm"
                            className="btn-primary text-xs"
                            onClick={() => handleUpdateInvoice(invoice.id, 'paid')}
                            data-testid={`mark-paid-${invoice.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminBilling;
