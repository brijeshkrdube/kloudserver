import { useState, useEffect } from 'react';
import { CreditCard, Download, FileText } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';

const UserBilling = () => {
  const { api } = useAuth();
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, invoicesRes] = await Promise.all([
          api.get('/orders'),
          api.get('/invoices'),
        ]);
        setOrders(ordersRes.data);
        setInvoices(invoicesRes.data);
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="billing-title">
            Billing & Invoices
          </h1>
          <p className="text-text-secondary mt-1">Manage your orders and invoices</p>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="bg-background-paper border border-white/5 mb-6">
            <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Orders Yet</h2>
                <p className="text-text-secondary">You haven't placed any orders yet.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/5" data-testid={`order-row-${order.id}`}>
                          <td className="px-6 py-4 font-mono text-sm text-text-primary">{order.id.slice(0, 8)}</td>
                          <td className="px-6 py-4 text-text-primary">{order.plan_name}</td>
                          <td className="px-6 py-4 font-mono text-text-primary">{formatCurrency(order.amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.order_status)}`}>
                              {order.order_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-text-muted text-sm">{formatDate(order.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            {invoices.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <CreditCard className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Invoices Yet</h2>
                <p className="text-text-secondary">Your invoices will appear here.</p>
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
                        <tr key={invoice.id} className="hover:bg-white/5" data-testid={`invoice-row-${invoice.id}`}>
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
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Payment Instructions */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Payment Instructions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="font-medium text-text-primary mb-2">Bank Transfer</h3>
              <div className="space-y-1 text-sm text-text-secondary font-mono">
                <p>Bank: International Bank</p>
                <p>Account: CloudNest Inc.</p>
                <p>IBAN: XX00 0000 0000 0000 0000</p>
                <p>SWIFT: XXXX0000</p>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="font-medium text-text-primary mb-2">Cryptocurrency</h3>
              <div className="space-y-1 text-sm text-text-secondary font-mono">
                <p>BTC: bc1q...xxxx</p>
                <p>ETH: 0x...xxxx</p>
                <p>USDT (TRC20): T...xxxx</p>
              </div>
            </div>
          </div>
          <p className="text-text-muted text-sm mt-4">
            Please include your invoice number in the payment reference. Contact support if you need assistance.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserBilling;
