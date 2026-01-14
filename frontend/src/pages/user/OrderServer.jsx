import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Check, ChevronRight, Loader2, MapPin, Package, Plus, Minus, Wallet, Building2, Bitcoin, Copy } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Checkbox } from '../../components/ui/checkbox';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const UserOrderServer = () => {
  const navigate = useNavigate();
  const { api, user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [datacenters, setDatacenters] = useState([]);
  const [addons, setAddons] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(null);

  const [orderData, setOrderData] = useState({
    planId: '',
    billingCycle: 'monthly',
    dataCenterId: '',
    os: 'Ubuntu 22.04',
    controlPanel: 'none',
    selectedAddons: [],
    paymentMethod: 'wallet',
    notes: '',
  });

  const operatingSystems = [
    'Ubuntu 22.04',
    'Ubuntu 24.04',
    'CentOS 7',
    'CentOS 8',
    'Debian 11',
    'Debian 12',
    'Rocky Linux 8',
    'AlmaLinux 8',
    'Windows Server 2019',
    'Windows Server 2022',
  ];

  const controlPanels = [
    { value: 'none', label: 'None' },
    { value: 'cpanel', label: 'cPanel' },
    { value: 'whm', label: 'WHM' },
    { value: 'plesk', label: 'Plesk' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, dcRes, addonsRes, settingsRes] = await Promise.all([
          api.get('/plans'),
          api.get('/datacenters/'),
          api.get('/addons/'),
          axios.get(`${API_URL}/api/settings/public`)
        ]);
        setPlans(plansRes.data);
        setDatacenters(dcRes.data);
        setAddons(addonsRes.data);
        setSettings(settingsRes.data);
        
        // Set default data center if available
        if (dcRes.data.length > 0) {
          setOrderData(prev => ({ ...prev, dataCenterId: dcRes.data[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api]);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedPlan = plans.find(p => p.id === orderData.planId);
  const selectedDatacenter = datacenters.find(dc => dc.id === orderData.dataCenterId);

  const getBasePrice = () => {
    if (!selectedPlan) return 0;
    switch (orderData.billingCycle) {
      case 'quarterly':
        return selectedPlan.price_quarterly;
      case 'yearly':
        return selectedPlan.price_yearly;
      default:
        return selectedPlan.price_monthly;
    }
  };

  const getAddonsPrice = () => {
    let total = 0;
    orderData.selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) {
        let price = addon.price;
        // Adjust for billing cycle
        if (addon.billing_cycle === 'monthly') {
          if (orderData.billingCycle === 'quarterly') price *= 3;
          else if (orderData.billingCycle === 'yearly') price *= 12;
        }
        total += price;
      }
    });
    return total;
  };

  const getTotalPrice = () => getBasePrice() + getAddonsPrice();

  const toggleAddon = (addonId) => {
    setOrderData(prev => ({
      ...prev,
      selectedAddons: prev.selectedAddons.includes(addonId)
        ? prev.selectedAddons.filter(id => id !== addonId)
        : [...prev.selectedAddons, addonId]
    }));
  };

  const handleSubmit = async () => {
    if (!orderData.planId) {
      toast.error('Please select a plan');
      return;
    }

    // Validate wallet balance if paying from wallet
    if (orderData.paymentMethod === 'wallet') {
      const totalPrice = getTotalPrice();
      if ((user?.wallet_balance || 0) < totalPrice) {
        toast.error(`Insufficient wallet balance. You need ${formatCurrency(totalPrice)} but have ${formatCurrency(user?.wallet_balance || 0)}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await api.post('/orders/', {
        plan_id: orderData.planId,
        billing_cycle: orderData.billingCycle,
        data_center_id: orderData.dataCenterId || null,
        os: orderData.os,
        control_panel: orderData.controlPanel === 'none' ? null : orderData.controlPanel,
        addons: orderData.selectedAddons,
        payment_method: orderData.paymentMethod,
        notes: orderData.notes || null,
      });
      
      if (orderData.paymentMethod === 'wallet') {
        toast.success('Order placed and paid successfully! Your server will be provisioned soon.');
        refreshUser(); // Refresh user data to update wallet balance
      } else {
        toast.success('Order placed successfully! Invoice sent to your email.');
      }
      navigate(`/dashboard/orders/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place order');
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="order-title">
            Order New Server
          </h1>
          <p className="text-text-secondary mt-1">Configure and order your new server</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {['Plan', 'Configure', 'Add-ons', 'Review'].map((label, idx) => {
            const s = idx + 1;
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-all ${
                      step >= s
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-text-muted'
                    }`}
                  >
                    {step > s ? <Check className="w-5 h-5" /> : s}
                  </div>
                  <span className="text-xs text-text-muted mt-1">{label}</span>
                </div>
                {s < 4 && (
                  <div
                    className={`w-12 h-0.5 mx-2 transition-all ${
                      step > s ? 'bg-primary' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Select Plan */}
        {step === 1 && (
          <div className="glass-card p-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-6">
              Select a Plan
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setOrderData({ ...orderData, planId: plan.id })}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    orderData.planId === plan.id
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                  data-testid={`plan-${plan.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-text-primary">{plan.name}</h3>
                    {orderData.planId === plan.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {formatCurrency(plan.price_monthly)}
                    <span className="text-sm font-normal text-text-muted">/mo</span>
                  </div>
                  <div className="space-y-1 text-sm text-text-secondary">
                    <p>{plan.cpu}</p>
                    <p>{plan.ram} RAM</p>
                    <p>{plan.storage}</p>
                    <p>{plan.bandwidth}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setStep(2)}
                disabled={!orderData.planId}
                className="btn-primary"
                data-testid="next-step-1"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <div className="glass-card p-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-6">
              Configure Your Server
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Data Center Selection */}
              {datacenters.length > 0 && (
                <div className="md:col-span-2 space-y-3">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Data Center Location
                  </Label>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {datacenters.map((dc) => (
                      <div
                        key={dc.id}
                        onClick={() => setOrderData({ ...orderData, dataCenterId: dc.id })}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          orderData.dataCenterId === dc.id
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        data-testid={`datacenter-${dc.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-text-primary font-medium text-sm">{dc.name}</span>
                          {orderData.dataCenterId === dc.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-text-muted text-xs mt-1">{dc.country}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing Cycle */}
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select
                  value={orderData.billingCycle}
                  onValueChange={(v) => setOrderData({ ...orderData, billingCycle: v })}
                >
                  <SelectTrigger className="input-field" data-testid="billing-cycle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly (Save 10%)</SelectItem>
                    <SelectItem value="yearly">Yearly (Save 20%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Operating System */}
              <div className="space-y-2">
                <Label>Operating System</Label>
                <Select
                  value={orderData.os}
                  onValueChange={(v) => setOrderData({ ...orderData, os: v })}
                >
                  <SelectTrigger className="input-field" data-testid="os-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operatingSystems.map((os) => (
                      <SelectItem key={os} value={os}>{os}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Control Panel */}
              <div className="space-y-2">
                <Label>Control Panel</Label>
                <Select
                  value={orderData.controlPanel}
                  onValueChange={(v) => setOrderData({ ...orderData, controlPanel: v })}
                >
                  <SelectTrigger className="input-field" data-testid="panel-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {controlPanels.map((panel) => (
                      <SelectItem key={panel.value} value={panel.value}>{panel.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <RadioGroup
                  value={orderData.paymentMethod}
                  onValueChange={(v) => setOrderData({ ...orderData, paymentMethod: v })}
                  className="space-y-3"
                >
                  {/* Wallet Payment Option */}
                  <label 
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      orderData.paymentMethod === 'wallet' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <RadioGroupItem value="wallet" data-testid="payment-wallet" />
                    <Wallet className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <span className="text-text-primary font-medium">Pay from Wallet</span>
                      <p className="text-sm text-text-muted">
                        Balance: <span className={`font-mono ${(user?.wallet_balance || 0) >= getTotalPrice() ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(user?.wallet_balance || 0)}
                        </span>
                        {(user?.wallet_balance || 0) < getTotalPrice() && (
                          <span className="text-red-500 ml-2">- Insufficient balance</span>
                        )}
                      </p>
                    </div>
                    {(user?.wallet_balance || 0) >= getTotalPrice() && (
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">Instant</span>
                    )}
                  </label>

                  {/* Bank Transfer */}
                  <label 
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      orderData.paymentMethod === 'bank_transfer' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <RadioGroupItem value="bank_transfer" data-testid="payment-bank" />
                    <Building2 className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <span className="text-text-primary font-medium">Bank Transfer</span>
                      <p className="text-sm text-text-muted">Pay via bank transfer</p>
                    </div>
                  </label>

                  {/* Crypto */}
                  <label 
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      orderData.paymentMethod === 'crypto' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <RadioGroupItem value="crypto" data-testid="payment-crypto" />
                    <Bitcoin className="w-5 h-5 text-orange-500" />
                    <div className="flex-1">
                      <span className="text-text-primary font-medium">Cryptocurrency</span>
                      <p className="text-sm text-text-muted">Pay with BTC, USDT, etc.</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="btn-primary" data-testid="next-step-2">
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Add-ons */}
        {step === 3 && (
          <div className="glass-card p-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">
              Select Add-ons
            </h2>
            <p className="text-text-secondary mb-6">Optional services to enhance your server</p>
            
            {addons.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No add-ons available</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {addons.map((addon) => {
                  const isSelected = orderData.selectedAddons.includes(addon.id);
                  let displayPrice = addon.price;
                  if (addon.billing_cycle === 'monthly') {
                    if (orderData.billingCycle === 'quarterly') displayPrice *= 3;
                    else if (orderData.billingCycle === 'yearly') displayPrice *= 12;
                  }
                  
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      data-testid={`addon-${addon.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isSelected} className="pointer-events-none" />
                            <h3 className="text-text-primary font-medium">{addon.name}</h3>
                          </div>
                          {addon.description && (
                            <p className="text-text-muted text-sm mt-1 ml-6">{addon.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-primary font-semibold">{formatCurrency(displayPrice)}</p>
                          <p className="text-text-muted text-xs">
                            /{orderData.billingCycle === 'yearly' ? 'year' : orderData.billingCycle === 'quarterly' ? 'quarter' : 'month'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="btn-primary" data-testid="next-step-3">
                Review Order
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <div className="glass-card p-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-6">
              Review Your Order
            </h2>
            
            <div className="space-y-6">
              {/* Plan Summary */}
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="text-text-muted text-sm mb-3">Selected Plan</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-primary font-semibold text-lg">{selectedPlan?.name}</p>
                    <p className="text-text-muted text-sm">
                      {selectedPlan?.cpu} • {selectedPlan?.ram} • {selectedPlan?.storage}
                    </p>
                  </div>
                  <p className="text-primary font-bold text-xl">{formatCurrency(getBasePrice())}</p>
                </div>
              </div>

              {/* Configuration */}
              <div className="grid md:grid-cols-2 gap-4">
                {selectedDatacenter && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-text-muted text-sm">Data Center</p>
                    <p className="text-text-primary font-medium">{selectedDatacenter.name}</p>
                  </div>
                )}
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-text-muted text-sm">Billing Cycle</p>
                  <p className="text-text-primary font-medium capitalize">{orderData.billingCycle}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-text-muted text-sm">Operating System</p>
                  <p className="text-text-primary font-medium">{orderData.os}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-text-muted text-sm">Control Panel</p>
                  <p className="text-text-primary font-medium">
                    {controlPanels.find(p => p.value === orderData.controlPanel)?.label}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-text-muted text-sm">Payment Method</p>
                  <p className="text-text-primary font-medium">
                    {orderData.paymentMethod === 'wallet' ? 'Wallet Balance' : 
                     orderData.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Cryptocurrency'}
                  </p>
                  {orderData.paymentMethod === 'wallet' && (
                    <p className="text-xs text-green-500 mt-1">Payment will be deducted instantly</p>
                  )}
                </div>
              </div>

              {/* Selected Add-ons */}
              {orderData.selectedAddons.length > 0 && (
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="text-text-muted text-sm mb-3">Selected Add-ons</h3>
                  <div className="space-y-2">
                    {orderData.selectedAddons.map(addonId => {
                      const addon = addons.find(a => a.id === addonId);
                      if (!addon) return null;
                      let price = addon.price;
                      if (addon.billing_cycle === 'monthly') {
                        if (orderData.billingCycle === 'quarterly') price *= 3;
                        else if (orderData.billingCycle === 'yearly') price *= 12;
                      }
                      return (
                        <div key={addonId} className="flex justify-between text-sm">
                          <span className="text-text-secondary">{addon.name}</span>
                          <span className="text-text-primary">{formatCurrency(price)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  value={orderData.notes}
                  onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                  placeholder="Any special requirements or notes..."
                  className="input-field min-h-[100px]"
                  data-testid="order-notes"
                />
              </div>

              {/* Total */}
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted text-sm">Total Amount</p>
                    <p className="text-text-secondary text-xs">
                      Billed {orderData.billingCycle}
                    </p>
                  </div>
                  <p className="text-primary font-bold text-2xl" data-testid="total-price">
                    {formatCurrency(getTotalPrice())}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="btn-primary"
                disabled={submitting}
                data-testid="submit-order"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Server className="w-5 h-5 mr-2" />
                    Place Order
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserOrderServer;
