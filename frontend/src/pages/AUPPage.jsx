import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const AUPPage = () => {
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
            <div className="w-16 h-16 rounded-xl bg-accent-warning/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-accent-warning" />
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-6 tracking-tight">
              Acceptable Use Policy
            </h1>
            <p className="text-lg text-text-secondary">
              Guidelines for responsible use of our services
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
                {settings?.aup ? (
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                    {settings.aup}
                  </div>
                ) : (
                  <div className="space-y-6 text-text-secondary">
                    <h2 className="text-xl font-semibold text-text-primary">Prohibited Activities</h2>
                    <p>The following activities are strictly prohibited:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Illegal content distribution</li>
                      <li>Spam or unsolicited bulk email</li>
                      <li>DDoS attacks or hacking attempts</li>
                      <li>Malware distribution</li>
                      <li>Copyright infringement</li>
                      <li>Resource abuse affecting other users</li>
                    </ul>
                    
                    <h2 className="text-xl font-semibold text-text-primary">Enforcement</h2>
                    <p>Violations may result in immediate suspension without refund. We reserve the right to terminate services for AUP violations.</p>
                    
                    <h2 className="text-xl font-semibold text-text-primary">Reporting Abuse</h2>
                    <p>To report abuse, please contact our support team with detailed information about the violation.</p>
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

export default AUPPage;
