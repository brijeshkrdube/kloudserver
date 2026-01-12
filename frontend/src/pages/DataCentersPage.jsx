import { useState, useEffect } from 'react';
import { Globe, Server, Shield, Zap } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const DataCentersPage = () => {
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

  const defaultDatacenters = [
    { name: 'North America', location: 'New York, USA', features: ['Tier IV', '10Gbps', 'DDoS Protection'] },
    { name: 'Europe', location: 'Frankfurt, Germany', features: ['Tier III', '10Gbps', 'GDPR Compliant'] },
    { name: 'Asia Pacific', location: 'Singapore', features: ['Tier III', '10Gbps', 'Low Latency Asia'] },
  ];

  const features = [
    { icon: Server, title: 'Enterprise Hardware', description: 'Latest generation servers with NVMe storage' },
    { icon: Shield, title: 'Physical Security', description: '24/7 on-site security and biometric access' },
    { icon: Zap, title: 'Redundant Power', description: 'N+1 UPS and backup generators' },
    { icon: Globe, title: 'Network', description: 'Multiple Tier 1 carriers with 10Gbps connectivity' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="container-main relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-6 tracking-tight">
              Data Centers
            </h1>
            <p className="text-lg text-text-secondary">
              Global infrastructure for maximum performance and reliability
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-main">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : settings?.data_centers ? (
            <div className="max-w-4xl mx-auto glass-card p-8">
              <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                {settings.data_centers}
              </div>
            </div>
          ) : (
            <>
              {/* Default Data Centers */}
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {defaultDatacenters.map((dc, index) => (
                  <div key={index} className="glass-card p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">{dc.name}</h3>
                    <p className="text-text-muted mb-4">{dc.location}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {dc.features.map((feature, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs text-text-secondary">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => (
                  <div key={index} className="glass-card p-6">
                    <feature.icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-heading text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                    <p className="text-text-secondary text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DataCentersPage;
