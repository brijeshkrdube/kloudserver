import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Server, Mail, Phone, MapPin, Twitter, Github, Linkedin } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Footer = () => {
  const [settings, setSettings] = useState(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings/public`);
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const services = [
    { name: 'VPS Hosting', href: '/vps-hosting' },
    { name: 'Shared Hosting', href: '/shared-hosting' },
    { name: 'Dedicated Servers', href: '/dedicated-servers' },
    { name: 'Pricing', href: '/pricing' },
  ];

  const company = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Data Centers', href: '/data-centers' },
    { name: 'Support', href: '/support' },
  ];

  const legal = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'SLA', href: '/sla' },
    { name: 'AUP', href: '/aup' },
  ];

  return (
    <footer className="bg-background-paper border-t border-white/5">
      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-2xl text-text-primary">
                {settings?.company_name || 'KloudNests'}
              </span>
            </Link>
            <p className="text-text-secondary mb-6 max-w-sm">
              {settings?.company_description || 'Enterprise-grade cloud infrastructure for businesses of all sizes. Reliable, scalable, and secure hosting solutions.'}
            </p>
            <div className="flex gap-4">
              {settings?.social_twitter && (
                <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-white/10 transition-all" data-testid="social-twitter">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {settings?.social_github && (
                <a href={settings.social_github} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-white/10 transition-all" data-testid="social-github">
                  <Github className="w-5 h-5" />
                </a>
              )}
              {settings?.social_linkedin && (
                <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-white/10 transition-all" data-testid="social-linkedin">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {!settings?.social_twitter && !settings?.social_github && !settings?.social_linkedin && (
                <>
                  <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-text-muted">
                    <Twitter className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-text-muted">
                    <Github className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-text-muted">
                    <Linkedin className="w-5 h-5" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-semibold text-text-primary mb-4">Services</h4>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-text-secondary hover:text-primary transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-semibold text-text-primary mb-4">Company</h4>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-text-secondary hover:text-primary transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-text-primary mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-4 h-4 text-primary" />
                {settings?.contact_email || 'support@cloudnest.com'}
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <Phone className="w-4 h-4 text-primary" />
                {settings?.contact_phone || '+1 (555) 123-4567'}
              </li>
              <li className="flex items-start gap-2 text-text-secondary">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                <span className="text-sm">{settings?.contact_address || '123 Cloud Street, Tech City'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-sm">
            © {currentYear} {settings?.company_name || 'KloudNests'}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legal.map((item) => (
              <Link key={item.href} to={item.href} className="text-text-muted text-sm hover:text-primary transition-colors">
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
