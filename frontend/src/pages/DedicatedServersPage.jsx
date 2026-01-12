import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Server, Shield, Cpu, HardDrive } from 'lucide-react';
import { Button } from '../components/ui/button';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const DedicatedServersPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API_URL}/plans?type=dedicated`);
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
    { icon: Cpu, title: 'Intel Xeon CPUs', description: 'Enterprise-grade processors for maximum performance' },
    { icon: HardDrive, title: 'Hardware RAID', description: 'Data redundancy with hardware RAID controllers' },
    { icon: Server, title: 'IPMI Access', description: 'Remote management and KVM access included' },
    { icon: Shield, title: 'DDoS Protection', description: 'Advanced DDoS mitigation up to 10Tbps' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="container-main relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-sm mb-6">
              Dedicated Servers
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-6 tracking-tight">
              Powerful Dedicated Servers
            </h1>
            <p className="text-lg text-text-secondary mb-8">
              Maximum performance and control with bare-metal dedicated servers. 
              Perfect for high-traffic websites, game servers, and enterprise applications.
            </p>
            <Link to={user ? '/dashboard/order' : '/register'}>
              <Button className="btn-primary px-8 py-6 text-lg" data-testid="dedicated-get-started">
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
            Dedicated Server Plans
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <div 
                  key={plan.id}
                  className={`glass-card p-8 relative ${index === 1 ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
                  data-testid={`dedicated-plan-${index}`}
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-xs font-medium text-white">
                      Best Value
                    </div>
                  )}
                  <h3 className="font-heading text-2xl font-bold text-text-primary mb-4">
                    {plan.name}
                  </h3>
                  <div className="space-y-2 mb-6 font-mono text-sm">
                    <p className="text-accent-cyan">{plan.cpu}</p>
                    <p className="text-text-secondary">{plan.ram}</p>
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
          <h2 className="font-heading text-3xl font-bold text-text-primary mb-12 text-center">
            Enterprise Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="glass-card p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-accent-purple/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-accent-purple" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DedicatedServersPage;
