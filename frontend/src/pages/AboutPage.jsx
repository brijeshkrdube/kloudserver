import { useState, useEffect } from 'react';
import { Server, Shield, Globe, Users, Award, Clock } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const AboutPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings/public`);
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const features = [
    { icon: Server, title: 'Enterprise Infrastructure', description: 'State-of-the-art servers with NVMe storage and redundant networking' },
    { icon: Shield, title: 'Security First', description: 'Advanced DDoS protection and 24/7 security monitoring' },
    { icon: Globe, title: 'Global Network', description: 'Multiple data centers for low-latency worldwide access' },
    { icon: Users, title: 'Expert Support', description: 'Technical experts available around the clock' },
    { icon: Award, title: 'Industry Leading', description: 'Trusted by thousands of businesses worldwide' },
    { icon: Clock, title: '99.99% Uptime', description: 'Guaranteed uptime with automatic failover' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="container-main relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-6 tracking-tight">
              About {settings?.company_name || 'KloudNests'}
            </h1>
            <p className="text-lg text-text-secondary">
              {settings?.company_description || 'Enterprise Cloud Infrastructure Provider'}
            </p>
          </div>
        </div>
      </section>

      {/* About Content */}
      <section className="py-16">
        <div className="container-main">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : settings?.about_us ? (
              <div className="glass-card p-8">
                <div className="prose prose-invert max-w-none">
                  {settings.about_us.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="text-text-secondary mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card p-8">
                <p className="text-text-secondary mb-4">
                  KloudNests is a leading provider of enterprise-grade cloud infrastructure solutions. 
                  We specialize in VPS hosting, shared hosting, and dedicated server solutions designed 
                  to meet the needs of businesses of all sizes.
                </p>
                <p className="text-text-secondary mb-4">
                  Founded with a mission to make reliable, high-performance hosting accessible to everyone, 
                  we've grown to serve thousands of customers worldwide. Our commitment to excellence is 
                  reflected in our 99.99% uptime guarantee and our dedicated 24/7 support team.
                </p>
                <p className="text-text-secondary">
                  We believe in transparency, reliability, and putting our customers first. Whether you're 
                  launching your first website or scaling an enterprise application, we're here to help 
                  you succeed.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background-paper">
        <div className="container-main">
          <h2 className="font-heading text-3xl font-bold text-text-primary mb-12 text-center">
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="glass-card p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
