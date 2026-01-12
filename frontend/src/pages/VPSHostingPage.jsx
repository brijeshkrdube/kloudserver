import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const VPSHostingPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API_URL}/plans?type=vps`);
        setPlans(response.data);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const features = [
    'Full Root Access',
    'NVMe SSD Storage',
    'DDoS Protection',
    '99.9% Uptime SLA',
    '24/7 Support',
    'Weekly Backups',
    'IPv4 & IPv6',
    'Custom OS',
  ];

  const osList = [
    'Ubuntu 22.04 / 24.04',
    'CentOS 7 / 8 / 9',
    'Debian 11 / 12',
    'Rocky Linux 8 / 9',
    'AlmaLinux 8 / 9',
    'Windows Server 2019 / 2022',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="container-main relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              Virtual Private Servers
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-6 tracking-tight">
              High-Performance VPS Hosting
            </h1>
            <p className="text-lg text-text-secondary mb-8">
              Deploy powerful virtual servers with NVMe storage, dedicated resources, 
              and full root access. Scale your applications with confidence.
            </p>
            <Link to={user ? '/dashboard/order' : '/register'}>
              <Button className="btn-primary px-8 py-6 text-lg" data-testid="vps-get-started">
                Get Started
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16">
        <div className="container-main">
          <h2 className="font-heading text-3xl font-bold text-text-primary mb-8 text-center">
            Choose Your VPS Plan
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div 
                  key={plan.id}
                  className={`glass-card p-8 relative ${index === 1 ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
                  data-testid={`vps-plan-${index}`}
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-xs font-medium text-white">
                      Most Popular
                    </div>
                  )}
                  <h3 className="font-heading text-2xl font-bold text-text-primary mb-2">
                    {plan.name}
                  </h3>
                  <div className="space-y-2 mb-6">
                    <p className="text-accent-cyan font-mono">{plan.cpu}</p>
                    <p className="text-text-secondary">{plan.ram} RAM</p>
                    <p className="text-text-secondary">{plan.storage}</p>
                    <p className="text-text-secondary">{plan.bandwidth} Bandwidth</p>
                  </div>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-mono text-4xl font-bold text-text-primary">${plan.price_monthly}</span>
                    <span className="text-text-muted">/mo</span>
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
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background-paper">
        <div className="container-main">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl font-bold text-text-primary mb-6">
                All VPS Plans Include
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-text-secondary">
                    <Check className="w-5 h-5 text-accent-success" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-text-primary mb-4">
                Supported Operating Systems
              </h3>
              <div className="glass-card p-6">
                <ul className="space-y-3">
                  {osList.map((os, index) => (
                    <li key={index} className="flex items-center gap-2 text-text-secondary font-mono text-sm">
                      <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                      {os}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VPSHostingPage;
