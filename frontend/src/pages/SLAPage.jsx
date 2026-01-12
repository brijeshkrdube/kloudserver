import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const SLAPage = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="container-main relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-xl bg-accent-success/10 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-accent-success" />
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-6 tracking-tight">
              Service Level Agreement
            </h1>
            <p className="text-lg text-text-secondary">
              Our commitment to 99.99% uptime and service reliability
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-main">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="glass-card p-8">
                {settings?.sla ? (
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                    {settings.sla}
                  </div>
                ) : (
                  <div className="space-y-6 text-text-secondary">
                    <h2 className="text-xl font-semibold text-text-primary">Uptime Guarantee</h2>
                    <p>We guarantee 99.99% network uptime for all our services. This means your server will be accessible 99.99% of the time, excluding scheduled maintenance.</p>
                    
                    <h2 className="text-xl font-semibold text-text-primary">Service Credits</h2>
                    <p>If we fail to meet our uptime commitment, you may be eligible for service credits as follows:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>99.9% - 99.99%: 10% credit</li>
                      <li>99.0% - 99.9%: 25% credit</li>
                      <li>Below 99.0%: 50% credit</li>
                    </ul>
                    
                    <h2 className="text-xl font-semibold text-text-primary">Support Response Times</h2>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Critical issues: 15 minutes</li>
                      <li>High priority: 1 hour</li>
                      <li>Medium priority: 4 hours</li>
                      <li>Low priority: 24 hours</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SLAPage;
