import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const SupportPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

      {/* Hero */}
      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="container-main relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-6 tracking-tight">
              Support Center
            </h1>
            <p className="text-lg text-text-secondary">
              We're here to help. Choose your preferred support method below.
            </p>
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16">
        <div className="container-main">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Skype Support */}
            <div className="glass-card p-8">
              <div className="w-16 h-16 rounded-xl bg-[#00AFF0]/10 flex items-center justify-center mb-6">
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#00AFF0">
                  <path d="M12.069 18.874c-4.023 0-5.82-1.979-5.82-3.464 0-.765.561-1.296 1.333-1.296 1.723 0 1.273 2.477 4.487 2.477 1.641 0 2.55-.895 2.55-1.811 0-.551-.269-1.16-1.354-1.429l-3.576-.895c-2.88-.724-3.403-2.286-3.403-3.751 0-3.047 2.861-4.191 5.549-4.191 2.471 0 5.393 1.373 5.393 3.199 0 .784-.688 1.24-1.453 1.24-1.469 0-1.198-2.037-4.164-2.037-1.469 0-2.292.664-2.292 1.617s1.153 1.258 2.157 1.487l2.637.587c2.891.649 3.624 2.346 3.624 3.944 0 2.476-1.902 4.324-5.722 4.324m11.084-4.882l-.029.135-.044-.24c.015.045.044.074.059.12.12-.675.181-1.363.181-2.052 0-1.529-.301-3.012-.898-4.42-.569-1.348-1.395-2.562-2.427-3.596-1.049-1.033-2.247-1.856-3.595-2.426-1.318-.541-2.767-.871-4.112-.949l-.15-.015.225-.015c.074 0 .149-.015.209-.015l.194-.03-.209.015c-5.875 0-10.649 4.773-10.649 10.649 0 .702.075 1.395.209 2.082l.03.149.044.254-.044-.119c-.12.674-.179 1.362-.179 2.051 0 1.53.301 3.012.898 4.42.572 1.349 1.393 2.561 2.427 3.596 1.049 1.032 2.248 1.856 3.596 2.426 1.408.585 2.891.885 4.42.885.689 0 1.378-.06 2.052-.179l.149-.03.255-.045-.12.045c.675.12 1.363.18 2.052.18 1.529 0 3.012-.301 4.42-.899 1.348-.572 2.562-1.394 3.596-2.427 1.032-1.049 1.856-2.248 2.426-3.596.585-1.408.885-2.891.885-4.42 0-.689-.06-1.377-.181-2.052"/>
                </svg>
              </div>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
                Live Chat on Skype
              </h2>
              <p className="text-text-secondary mb-6">
                Get instant support from our team via Skype. Available during business hours for quick assistance.
              </p>
              {loading ? (
                <div className="h-12 bg-white/5 rounded animate-pulse"></div>
              ) : settings?.skype_id ? (
                <a
                  href={`skype:${settings.skype_id}?chat`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-[#00AFF0] hover:bg-[#00AFF0]/90 text-white py-6" data-testid="skype-btn">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                      <path d="M12.069 18.874c-4.023 0-5.82-1.979-5.82-3.464 0-.765.561-1.296 1.333-1.296 1.723 0 1.273 2.477 4.487 2.477 1.641 0 2.55-.895 2.55-1.811 0-.551-.269-1.16-1.354-1.429l-3.576-.895c-2.88-.724-3.403-2.286-3.403-3.751 0-3.047 2.861-4.191 5.549-4.191 2.471 0 5.393 1.373 5.393 3.199 0 .784-.688 1.24-1.453 1.24-1.469 0-1.198-2.037-4.164-2.037-1.469 0-2.292.664-2.292 1.617s1.153 1.258 2.157 1.487l2.637.587c2.891.649 3.624 2.346 3.624 3.944 0 2.476-1.902 4.324-5.722 4.324m11.084-4.882l-.029.135-.044-.24c.015.045.044.074.059.12.12-.675.181-1.363.181-2.052 0-1.529-.301-3.012-.898-4.42-.569-1.348-1.395-2.562-2.427-3.596-1.049-1.033-2.247-1.856-3.595-2.426-1.318-.541-2.767-.871-4.112-.949l-.15-.015.225-.015c.074 0 .149-.015.209-.015l.194-.03-.209.015c-5.875 0-10.649 4.773-10.649 10.649 0 .702.075 1.395.209 2.082l.03.149.044.254-.044-.119c-.12.674-.179 1.362-.179 2.051 0 1.53.301 3.012.898 4.42.572 1.349 1.393 2.561 2.427 3.596 1.049 1.032 2.248 1.856 3.596 2.426 1.408.585 2.891.885 4.42.885.689 0 1.378-.06 2.052-.179l.149-.03.255-.045-.12.045c.675.12 1.363.18 2.052.18 1.529 0 3.012-.301 4.42-.899 1.348-.572 2.562-1.394 3.596-2.427 1.032-1.049 1.856-2.248 2.426-3.596.585-1.408.885-2.891.885-4.42 0-.689-.06-1.377-.181-2.052"/>
                    </svg>
                    Chat on Skype: {settings.skype_id}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              ) : (
                <p className="text-text-muted text-center py-4">Skype support not configured</p>
              )}
            </div>

            {/* Ticket System */}
            <div className="glass-card p-8">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
                Support Tickets
              </h2>
              <p className="text-text-secondary mb-6">
                Create a support ticket for detailed assistance. Our team typically responds within 24 hours.
              </p>
              {user ? (
                <Link to="/dashboard/tickets">
                  <Button className="w-full btn-primary py-6" data-testid="ticket-btn">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Open Support Ticket
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button className="w-full btn-primary py-6" data-testid="login-ticket-btn">
                    Login to Create Ticket
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="glass-card p-8">
              <h2 className="font-heading text-xl font-bold text-text-primary mb-6 text-center">
                Other Ways to Reach Us
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-text-muted text-sm">Email</p>
                    <p className="text-text-primary">{settings?.contact_email || 'support@cloudnest.com'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-text-muted text-sm">Phone</p>
                    <p className="text-text-primary">{settings?.contact_phone || '+1 (555) 123-4567'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent-success/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-accent-success" />
                  </div>
                  <div>
                    <p className="text-text-muted text-sm">Availability</p>
                    <p className="text-accent-success font-medium">24/7 Support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SupportPage;
