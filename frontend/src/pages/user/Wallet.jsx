import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';

const UserWallet = () => {
  const { api, user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupOpen, setTopupOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [topupData, setTopupData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/user/wallet/transactions');
        setTransactions(response.data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [api]);

  const handleTopup = async () => {
    if (!topupData.amount || parseFloat(topupData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/user/wallet/topup', {
        amount: parseFloat(topupData.amount),
        payment_method: topupData.paymentMethod,
      });
      toast.success('Topup request submitted! Please complete the payment.');
      setTopupOpen(false);
      setTopupData({ amount: '', paymentMethod: 'bank_transfer' });
      refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit topup request');
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
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="wallet-title">
              Wallet
            </h1>
            <p className="text-text-secondary mt-1">Manage your account balance</p>
          </div>
          <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="topup-btn">
                <Plus className="w-5 h-5 mr-2" />
                Add Funds
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background-paper border-white/10">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Add Funds to Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label>Amount (USD)</Label>
                  <Input
                    type="number"
                    placeholder="100.00"
                    value={topupData.amount}
                    onChange={(e) => setTopupData({ ...topupData, amount: e.target.value })}
                    className="input-field font-mono"
                    min="1"
                    step="0.01"
                    data-testid="topup-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={topupData.paymentMethod}
                    onValueChange={(value) => setTopupData({ ...topupData, paymentMethod: value })}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bank_transfer" id="bank" />
                      <Label htmlFor="bank" className="cursor-pointer">Bank Transfer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="crypto" id="crypto" />
                      <Label htmlFor="crypto" className="cursor-pointer">Cryptocurrency</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button
                  className="w-full btn-primary"
                  onClick={handleTopup}
                  disabled={submitting}
                  data-testid="submit-topup"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Request Topup'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Balance Card */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <WalletIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-text-muted text-sm">Available Balance</p>
              <p className="font-mono text-4xl font-bold text-text-primary" data-testid="wallet-balance">
                {formatCurrency(user?.wallet_balance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-xl font-semibold text-text-primary mb-6">Transaction History</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <WalletIcon className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-lg"
                  data-testid={`tx-${tx.id}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'credit' ? 'bg-accent-success/10' : 'bg-accent-error/10'
                  }`}>
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-5 h-5 text-accent-success" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-accent-error" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary font-medium">{tx.description}</p>
                    <p className="text-text-muted text-sm">{formatDateTime(tx.created_at)}</p>
                  </div>
                  <p className={`font-mono font-bold ${
                    tx.type === 'credit' ? 'text-accent-success' : 'text-accent-error'
                  }`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserWallet;
