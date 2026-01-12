import { Link } from 'react-router-dom';
import { Server, Shield, Zap, Clock, Globe, HeadphonesIcon, ChevronRight, Check, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const HomePage = () => {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'NVMe SSD storage with up to 10Gbps network connectivity for blazing performance.',
    },
    {
      icon: Shield,
      title: 'DDoS Protection',
      description: 'Enterprise-grade DDoS mitigation to keep your services online 24/7.',
    },
    {
      icon: Clock,
      title: '99.99% Uptime',
      description: 'Industry-leading SLA with redundant infrastructure and automatic failover.',
    },
    {
      icon: Globe,
      title: 'Global Network',
      description: 'Multiple data centers worldwide for low-latency access from anywhere.',
    },
    {
      icon: Server,
      title: 'Full Root Access',
      description: 'Complete control over your server with SSH and IPMI access.',
    },
    {
      icon: HeadphonesIcon,
      title: '24/7 Support',
      description: 'Expert technical support available around the clock via ticket system.',
    },
  ];

  const plans = [
    {
      name: 'VPS Hosting',
      description: 'Virtual private servers for growing businesses',
      price: '5.99',
      features: ['1-8 vCPU', 'Up to 32GB RAM', 'NVMe Storage', 'Full Root Access'],
      href: '/vps-hosting',
      popular: false,
    },
    {
      name: 'Shared Hosting',
      description: 'Affordable hosting for websites and blogs',
      price: '2.99',
      features: ['cPanel Access', 'Free SSL', 'Email Accounts', 'One-Click Installs'],
      href: '/shared-hosting',
      popular: true,
    },
    {
      name: 'Dedicated Servers',
      description: 'Maximum performance for enterprise workloads',
      price: '99.99',
      features: ['Intel Xeon CPUs', 'Up to 128GB RAM', 'Hardware RAID', 'IPMI Access'],
      href: '/dedicated-servers',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-hero-glow" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1689692784625-1ce82784a25a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHwxfHxmdXR1cmlzdGljJTIwc2VydmVyJTIwcm9vbSUyMGJsdWUlMjBuZW9ufGVufDB8fHx8MTc2ODE0NTQwNnww&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        
        <div className="container-main relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Powered by next-gen infrastructure
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 tracking-tight">
              Enterprise Cloud
              <span className="block text-gradient">Infrastructure</span>
            </h1>
            
            <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto">
              Deploy VPS, shared hosting, and dedicated servers with enterprise-grade 
              security, blazing-fast NVMe storage, and 24/7 expert support.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing">
                <Button className="btn-primary px-8 py-6 text-lg" data-testid="hero-view-plans">
                  View Plans
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="btn-secondary px-8 py-6 text-lg" data-testid="hero-contact-sales">
                  Contact Sales
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/5">
              <div>
                <div className="font-heading text-3xl font-bold text-primary">99.99%</div>
                <div className="text-text-muted text-sm mt-1">Uptime SLA</div>
              </div>
              <div>
                <div className="font-heading text-3xl font-bold text-primary">50K+</div>
                <div className="text-text-muted text-sm mt-1">Active Servers</div>
              </div>
              <div>
                <div className="font-heading text-3xl font-bold text-primary">24/7</div>
                <div className="text-text-muted text-sm mt-1">Expert Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background-paper">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Why Choose CloudNest?
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Built for performance, security, and reliability. Our infrastructure 
              is designed to scale with your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-6 group hover:border-primary/30 transition-all duration-300"
                data-testid={`feature-${index}`}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Preview Section */}
      <section className="py-20">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Choose Your Plan
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              From small websites to enterprise applications, we have the perfect 
              hosting solution for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`glass-card p-8 relative ${plan.popular ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
                data-testid={`plan-${index}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-xs font-medium text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="font-heading text-2xl font-bold text-text-primary mb-2">
                  {plan.name}
                </h3>
                <p className="text-text-secondary text-sm mb-6">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-mono text-4xl font-bold text-text-primary">${plan.price}</span>
                  <span className="text-text-muted">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-text-secondary">
                      <Check className="w-5 h-5 text-accent-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to={plan.href}>
                  <Button className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                    Learn More
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/pricing">
              <Button variant="link" className="text-primary hover:text-primary-hover" data-testid="view-all-plans">
                View All Plans & Pricing
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background-paper relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow opacity-50" />
        <div className="container-main relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-text-secondary mb-8">
              Deploy your first server in minutes. No credit card required for account creation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button className="btn-primary px-8 py-6 text-lg" data-testid="cta-get-started">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="btn-secondary px-8 py-6 text-lg" data-testid="cta-contact">
                  Talk to an Expert
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
