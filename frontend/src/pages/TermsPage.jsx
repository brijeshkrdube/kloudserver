import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const TermsPage = () => {
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
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-6 tracking-tight">
              Terms of Service
            </h1>
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
                {settings?.terms_of_service ? (
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                    {settings.terms_of_service}
                  </div>
                ) : (
                  <p className="text-text-muted text-center py-8">Terms of Service content will be available soon.</p>
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

export default TermsPage;
