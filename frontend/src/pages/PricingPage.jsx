import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const PricingPage = () => {
  const [plans, setPlans] = useState({ vps: [], shared: [], dedicated: [] });
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API_URL}/plans`);
        const allPlans = response.data;
        setPlans({
          vps: allPlans.filter(p => p.type === 'vps'),
          shared: allPlans.filter(p => p.type === 'shared'),
          dedicated: allPlans.filter(p => p.type === 'dedicated'),
        });
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const getPrice = (plan) => {
    switch (billingCycle) {
      case 'quarterly':
        return plan.price_quarterly;
      case 'yearly':
        return plan.price_yearly;
      default:
        return plan.price_monthly;
    }
  };

  const getPeriod = () => {
    switch (billingCycle) {
      case 'quarterly':
        return '/3mo';
      case 'yearly':
        return '/yr';
      default:
        return '/mo';
    }
  };

  const renderPlans = (planList, accentColor = 'primary') => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {planList.map((plan, index) => (
        <div 
          key={plan.id}
          className={`glass-card p-8 relative ${index === 1 ? `border-${accentColor}/50 ring-1 ring-${accentColor}/20` : ''}`}
          data-testid={`pricing-plan-${plan.id}`}
        >
          {index === 1 && (
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-${accentColor} rounded-full text-xs font-medium text-white`}>
              Recommended
            </div>
          )}
          <h3 className="font-heading text-2xl font-bold text-text-primary mb-2">
            {plan.name}
          </h3>
          <div className="space-y-1 mb-6 text-sm">
            <p className="text-accent-cyan font-mono">{plan.cpu}</p>
            <p className="text-text-secondary">{plan.ram}</p>
            <p className="text-text-secondary">{plan.storage}</p>
            <p className="text-text-secondary">{plan.bandwidth} Bandwidth</p>
          </div>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="font-mono text-4xl font-bold text-text-primary">
              ${getPrice(plan).toFixed(2)}
            </span>
            <span className="text-text-muted">{getPeriod()}</span>
          </div>
          <ul className="space-y-2 mb-8">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-text-secondary text-sm">
                <Check className="w-4 h-4 text-accent-success flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <Link to={user ? '/dashboard/order' : '/register'}>
            <Button className={`w-full ${index === 1 ? 'btn-primary' : 'btn-secondary'}`}>
              Order Now
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="container-main relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-6 tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-text-secondary mb-8">
              Choose the perfect plan for your needs. All plans include DDoS protection, 
              24/7 support, and our 99.9% uptime guarantee.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-2 p-1 bg-background-paper rounded-lg border border-white/5">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-primary text-white' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                data-testid="billing-monthly"
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('quarterly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'quarterly' 
                    ? 'bg-primary text-white' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                data-testid="billing-quarterly"
              >
                Quarterly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                  billingCycle === 'yearly' 
                    ? 'bg-primary text-white' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                data-testid="billing-yearly"
              >
                Yearly
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-accent-success text-[10px] rounded-full text-white">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16">
        <div className="container-main">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="vps" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-12 bg-background-paper border border-white/5">
                <TabsTrigger value="vps" data-testid="tab-vps">VPS</TabsTrigger>
                <TabsTrigger value="shared" data-testid="tab-shared">Shared</TabsTrigger>
                <TabsTrigger value="dedicated" data-testid="tab-dedicated">Dedicated</TabsTrigger>
              </TabsList>
              
              <TabsContent value="vps">
                {renderPlans(plans.vps)}
              </TabsContent>
              
              <TabsContent value="shared">
                {renderPlans(plans.shared, 'accent-success')}
              </TabsContent>
              
              <TabsContent value="dedicated">
                {renderPlans(plans.dedicated, 'accent-purple')}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-background-paper">
        <div className="container-main">
          <h2 className="font-heading text-3xl font-bold text-text-primary mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: 'What payment methods do you accept?',
                a: 'We accept bank transfers and cryptocurrency payments (BTC, ETH, USDT). All payments are processed securely.',
              },
              {
                q: 'How long does server setup take?',
                a: 'VPS and shared hosting are usually set up within 1-24 hours after payment confirmation. Dedicated servers may take 24-72 hours.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 7-day money-back guarantee for all new orders. Contact our support team if you\'re not satisfied.',
              },
              {
                q: 'Can I upgrade my plan later?',
                a: 'Absolutely! You can upgrade your plan at any time from your dashboard. The price difference will be prorated.',
              },
            ].map((faq, index) => (
              <div key={index} className="glass-card p-6">
                <h3 className="font-heading text-lg font-semibold text-text-primary mb-2">{faq.q}</h3>
                <p className="text-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
