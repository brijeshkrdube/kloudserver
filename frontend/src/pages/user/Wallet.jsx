import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Loader2, Upload, Copy, Check, Building2, Bitcoin, Clock, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const UserWallet = () => {
  const { api, user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [topupRequests, setTopupRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupOpen, setTopupOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [copied, setCopied] = useState('');
  const [step, setStep] = useState(1); // 1: amount & method, 2: payment details, 3: upload proof
  const [topupData, setTopupData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    transactionRef: '',
    paymentProof: null,
    proofPreview: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txResponse, settingsResponse, topupResponse] = await Promise.all([
          api.get('/user/wallet/transactions'),
          axios.get(`${API_URL}/settings/public`),
          api.get('/user/wallet/topup-requests')
        ]);
        setTransactions(txResponse.data);
        setSettings(settingsResponse.data);
        setTopupRequests(topupResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api]);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setTopupData({ 
        ...topupData, 
        paymentProof: file,
        proofPreview: URL.createObjectURL(file)
      });
    }
  };

  const handleTopup = async () => {
    if (!topupData.amount || parseFloat(topupData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    // Step 3: Submit with proof
    if (!topupData.transactionRef.trim()) {
      toast.error('Please enter transaction reference/hash');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', parseFloat(topupData.amount));
      formData.append('payment_method', topupData.paymentMethod);
      formData.append('transaction_ref', topupData.transactionRef);
      if (topupData.paymentProof) {
        formData.append('payment_proof', topupData.paymentProof);
      }

      await api.post('/user/wallet/topup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Topup request submitted successfully! We will verify your payment shortly.');
      setTopupOpen(false);
      resetForm();
      refreshUser();
      
      // Refresh topup requests
      const response = await api.get('/user/wallet/topup-requests');
      setTopupRequests(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit topup request');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTopupData({
      amount: '',
      paymentMethod: 'bank_transfer',
      transactionRef: '',
      paymentProof: null,
      proofPreview: null,
    });
    setStep(1);
  };

  const handleDialogClose = (open) => {
    if (!open) {
      resetForm();
    }
    setTopupOpen(open);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-500"><Clock className="w-4 h-4" /> Pending</span>;
      case 'approved':
        return <span className="flex items-center gap-1 text-green-500"><CheckCircle className="w-4 h-4" /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" /> Rejected</span>;
      default:
        return status;
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
          <Dialog open={topupOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="topup-btn">
                <Plus className="w-5 h-5 mr-2" />
                Add Funds
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background-paper border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">
                  {step === 1 && 'Add Funds to Wallet'}
                  {step === 2 && 'Payment Details'}
                  {step === 3 && 'Upload Payment Proof'}
                </DialogTitle>
              </DialogHeader>

              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 my-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      s <= step ? 'bg-primary text-white' : 'bg-white/10 text-text-muted'
                    }`}>
                      {s}
                    </div>
                    {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-primary' : 'bg-white/10'}`} />}
                  </div>
                ))}
              </div>

              <div className="space-y-6 mt-4">
                {/* Step 1: Amount & Method */}
                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label>Amount (USD)</Label>
                      <Input
                        type="number"
                        placeholder="100.00"
                        value={topupData.amount}
                        onChange={(e) => setTopupData({ ...topupData, amount: e.target.value })}
                        className="input-field font-mono text-lg"
                        min="1"
                        step="0.01"
                        data-testid="topup-amount"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Payment Method</Label>
                      <RadioGroup
                        value={topupData.paymentMethod}
                        onValueChange={(value) => setTopupData({ ...topupData, paymentMethod: value })}
                        className="space-y-3"
                      >
                        <div className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          topupData.paymentMethod === 'bank_transfer' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        onClick={() => setTopupData({ ...topupData, paymentMethod: 'bank_transfer' })}
                        >
                          <RadioGroupItem value="bank_transfer" id="bank" />
                          <Building2 className="w-5 h-5 text-primary" />
                          <div>
                            <Label htmlFor="bank" className="cursor-pointer font-medium">Bank Transfer</Label>
                            <p className="text-sm text-text-muted">Transfer via bank account</p>
                          </div>
                        </div>
                        <div className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          topupData.paymentMethod === 'crypto' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        onClick={() => setTopupData({ ...topupData, paymentMethod: 'crypto' })}
                        >
                          <RadioGroupItem value="crypto" id="crypto" />
                          <Bitcoin className="w-5 h-5 text-orange-500" />
                          <div>
                            <Label htmlFor="crypto" className="cursor-pointer font-medium">Cryptocurrency</Label>
                            <p className="text-sm text-text-muted">Pay with Bitcoin, USDT, etc.</p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}

                {/* Step 2: Payment Details */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm text-text-muted mb-1">Amount to Pay</p>
                      <p className="text-2xl font-mono font-bold text-primary">{formatCurrency(parseFloat(topupData.amount) || 0)}</p>
                    </div>

                    {topupData.paymentMethod === 'bank_transfer' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary mb-2">
                          <Building2 className="w-5 h-5" />
                          <h3 className="font-semibold">Bank Transfer Details</h3>
                        </div>
                        {settings?.bank_transfer_details ? (
                          <div className="bg-white/5 rounded-lg p-4 space-y-3">
                            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
                              {settings.bank_transfer_details}
                            </pre>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(settings.bank_transfer_details, 'bank')}
                              className="w-full"
                            >
                              {copied === 'bank' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                              {copied === 'bank' ? 'Copied!' : 'Copy Details'}
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-text-muted">
                            <p>Bank transfer details not configured.</p>
                            <p className="text-sm">Please contact support.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-orange-500 mb-2">
                          <Bitcoin className="w-5 h-5" />
                          <h3 className="font-semibold">Cryptocurrency Addresses</h3>
                        </div>
                        {settings?.crypto_addresses ? (
                          <div className="bg-white/5 rounded-lg p-4 space-y-3">
                            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
                              {settings.crypto_addresses}
                            </pre>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(settings.crypto_addresses, 'crypto')}
                              className="w-full"
                            >
                              {copied === 'crypto' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                              {copied === 'crypto' ? 'Copied!' : 'Copy Addresses'}
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-text-muted">
                            <p>Crypto addresses not configured.</p>
                            <p className="text-sm">Please contact support.</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm text-yellow-500">
                        ⚠️ Please make the exact payment of <strong>{formatCurrency(parseFloat(topupData.amount) || 0)}</strong> to avoid delays in verification.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Upload Proof */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Transaction Reference / Hash *</Label>
                      <Input
                        type="text"
                        placeholder={topupData.paymentMethod === 'crypto' ? 'Enter transaction hash' : 'Enter bank reference number'}
                        value={topupData.transactionRef}
                        onChange={(e) => setTopupData({ ...topupData, transactionRef: e.target.value })}
                        className="input-field font-mono"
                        data-testid="transaction-ref"
                      />
                      <p className="text-xs text-text-muted">
                        {topupData.paymentMethod === 'crypto' 
                          ? 'Enter the blockchain transaction hash'
                          : 'Enter bank transaction/reference number'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Screenshot (Optional)</Label>
                      <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        {topupData.proofPreview ? (
                          <div className="space-y-3">
                            <img 
                              src={topupData.proofPreview} 
                              alt="Payment proof" 
                              className="max-h-40 mx-auto rounded-lg"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTopupData({ ...topupData, paymentProof: null, proofPreview: null })}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <Upload className="w-10 h-10 text-text-muted mx-auto mb-2" />
                            <p className="text-text-secondary">Click to upload payment screenshot</p>
                            <p className="text-xs text-text-muted mt-1">PNG, JPG up to 5MB</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                              data-testid="payment-proof-input"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Amount:</span>
                        <span className="font-mono">{formatCurrency(parseFloat(topupData.amount) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Method:</span>
                        <span>{topupData.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Cryptocurrency'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Reference:</span>
                        <span className="font-mono text-xs truncate max-w-[200px]">{topupData.transactionRef || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3">
                  {step > 1 && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(step - 1)}
                      disabled={submitting}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    className="flex-1 btn-primary"
                    onClick={handleTopup}
                    disabled={submitting || (step === 1 && (!topupData.amount || parseFloat(topupData.amount) <= 0))}
                    data-testid="submit-topup"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : step === 3 ? (
                      'Submit Request'
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
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

        {/* Pending Topup Requests */}
        {topupRequests.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-6">Topup Requests</h2>
            <div className="space-y-3">
              {topupRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  data-testid={`topup-req-${req.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      req.payment_method === 'bank_transfer' ? 'bg-blue-500/10' : 'bg-orange-500/10'
                    }`}>
                      {req.payment_method === 'bank_transfer' ? (
                        <Building2 className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Bitcoin className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-mono font-bold text-text-primary">{formatCurrency(req.amount)}</p>
                      <p className="text-text-muted text-sm">{formatDateTime(req.created_at)}</p>
                      {req.transaction_ref && (
                        <p className="text-xs text-text-muted font-mono">Ref: {req.transaction_ref}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(req.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
