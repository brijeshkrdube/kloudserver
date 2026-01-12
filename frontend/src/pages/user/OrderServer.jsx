import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Check, ChevronRight, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

const UserOrderServer = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const [orderData, setOrderData] = useState({
    planId: '',
    billingCycle: 'monthly',
    os: 'Ubuntu 22.04',
    controlPanel: '',
    paymentMethod: 'bank_transfer',
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
    const fetchPlans = async () => {
      try {
        const response = await api.get('/plans');
        setPlans(response.data);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [api]);

  const selectedPlan = plans.find(p => p.id === orderData.planId);

  const getPrice = () => {
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

  const handleSubmit = async () => {
    if (!orderData.planId) {
      toast.error('Please select a plan');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/orders', {
        plan_id: orderData.planId,
        billing_cycle: orderData.billingCycle,
        os: orderData.os,
        control_panel: orderData.controlPanel || null,
        addons: [],
        payment_method: orderData.paymentMethod,
        notes: orderData.notes || null,
      });
      toast.success('Order placed successfully!');
      navigate('/dashboard/billing');
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
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-all ${
                  step >= s
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-text-muted'
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-0.5 mx-2 transition-all ${
                    step > s ? 'bg-primary' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Plan */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary">Select a Plan</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setOrderData({ ...orderData, planId: plan.id })}
                  className={`glass-card p-6 text-left transition-all ${
                    orderData.planId === plan.id
                      ? 'border-primary ring-1 ring-primary'
                      : 'hover:border-white/20'
                  }`}
                  data-testid={`plan-${plan.id}`}
                >
                  <h3 className="font-heading text-lg font-semibold text-text-primary mb-2">
                    {plan.name}
                  </h3>
                  <div className="space-y-1 text-sm text-text-secondary mb-4">
                    <p>{plan.cpu}</p>
                    <p>{plan.ram}</p>
                    <p>{plan.storage}</p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-text-primary">
                    ${plan.price_monthly}
                    <span className="text-text-muted text-sm font-normal">/mo</span>
                  </p>
                  {orderData.planId === plan.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <Button
              className="btn-primary w-full py-6"
              onClick={() => setStep(2)}
              disabled={!orderData.planId}
              data-testid="next-step-1"
            >
              Continue to Configuration
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary">Configure Your Server</h2>
            
            <div className="glass-card p-6 space-y-6">
              <div className="space-y-3">
                <Label>Billing Cycle</Label>
                <RadioGroup
                  value={orderData.billingCycle}
                  onValueChange={(value) => setOrderData({ ...orderData, billingCycle: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="cursor-pointer">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quarterly" id="quarterly" />
                    <Label htmlFor="quarterly" className="cursor-pointer">Quarterly (5% off)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="cursor-pointer">Yearly (20% off)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Operating System</Label>
                <Select
                  value={orderData.os}
                  onValueChange={(value) => setOrderData({ ...orderData, os: value })}
                >
                  <SelectTrigger className="input-field" data-testid="os-select">
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    {operatingSystems.map((os) => (
                      <SelectItem key={os} value={os}>{os}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Control Panel (Optional)</Label>
                <Select
                  value={orderData.controlPanel}
                  onValueChange={(value) => setOrderData({ ...orderData, controlPanel: value })}
                >
                  <SelectTrigger className="input-field" data-testid="panel-select">
                    <SelectValue placeholder="Select Control Panel" />
                  </SelectTrigger>
                  <SelectContent>
                    {controlPanels.map((panel) => (
                      <SelectItem key={panel.value} value={panel.value}>{panel.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Any special requirements or instructions..."
                  value={orderData.notes}
                  onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                  className="input-field"
                  data-testid="order-notes"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="btn-secondary flex-1 py-6" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="btn-primary flex-1 py-6" onClick={() => setStep(3)} data-testid="next-step-2">
                Continue to Payment
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary">Payment Method</h2>
            
            <div className="glass-card p-6 space-y-6">
              <div className="space-y-3">
                <Label>Select Payment Method</Label>
                <RadioGroup
                  value={orderData.paymentMethod}
                  onValueChange={(value) => setOrderData({ ...orderData, paymentMethod: value })}
                  className="space-y-3"
                >
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    orderData.paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20'
                  }`}>
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer" className="cursor-pointer flex-1">
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-text-muted text-sm">Pay via bank transfer. Invoice will be generated.</p>
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    orderData.paymentMethod === 'crypto' ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20'
                  }`}>
                    <RadioGroupItem value="crypto" id="crypto" />
                    <Label htmlFor="crypto" className="cursor-pointer flex-1">
                      <p className="font-medium">Cryptocurrency</p>
                      <p className="text-text-muted text-sm">Pay with BTC, ETH, or USDT.</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Order Summary */}
              <div className="pt-6 border-t border-white/10">
                <h3 className="font-heading text-lg font-semibold text-text-primary mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-text-secondary">
                    <span>Plan</span>
                    <span className="text-text-primary">{selectedPlan?.name}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Billing Cycle</span>
                    <span className="text-text-primary capitalize">{orderData.billingCycle}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Operating System</span>
                    <span className="text-text-primary">{orderData.os}</span>
                  </div>
                  {orderData.controlPanel && (
                    <div className="flex justify-between text-text-secondary">
                      <span>Control Panel</span>
                      <span className="text-text-primary capitalize">{orderData.controlPanel}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-white/10 flex justify-between">
                    <span className="font-semibold text-text-primary">Total</span>
                    <span className="font-mono text-2xl font-bold text-primary">{formatCurrency(getPrice())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="btn-secondary flex-1 py-6" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                className="btn-primary flex-1 py-6"
                onClick={handleSubmit}
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
                    Place Order
                    <ChevronRight className="w-5 h-5 ml-2" />
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
