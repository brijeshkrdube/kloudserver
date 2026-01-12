import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Globe, Phone, Mail, MapPin, FileText, Shield, Server, Send } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const AdminSettings = () => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: '',
    company_description: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    skype_id: '',
    about_us: '',
    terms_of_service: '',
    privacy_policy: '',
    sla: '',
    aup: '',
    data_centers: '',
    bank_transfer_details: '',
    crypto_addresses: '',
    social_twitter: '',
    social_linkedin: '',
    social_github: '',
    sendgrid_api_key: '',
    sender_email: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings/');
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings/', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout isAdmin>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="admin-settings-title">
              Site Settings
            </h1>
            <p className="text-text-secondary mt-1">Manage website content and configuration</p>
          </div>
          <Button className="btn-primary" onClick={handleSave} disabled={saving} data-testid="save-settings">
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            Save All Settings
          </Button>
        </div>

        <Tabs defaultValue="company" className="w-full">
          <TabsList className="bg-background-paper border border-white/5 mb-6 flex-wrap h-auto p-1">
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="contact">Contact & Support</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          {/* Company Info */}
          <TabsContent value="company">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-text-primary">Company Information</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    placeholder="CloudNest"
                    className="input-field"
                    data-testid="company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline / Description</Label>
                  <Input
                    value={settings.company_description}
                    onChange={(e) => setSettings({ ...settings, company_description: e.target.value })}
                    placeholder="Enterprise Cloud Infrastructure"
                    className="input-field"
                    data-testid="company-description"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>About Us (displayed on About page)</Label>
                <textarea
                  value={settings.about_us}
                  onChange={(e) => setSettings({ ...settings, about_us: e.target.value })}
                  placeholder="Tell your company story..."
                  className="input-field w-full min-h-[200px] rounded-md border px-3 py-2"
                  data-testid="about-us"
                />
              </div>

              <div className="space-y-2">
                <Label>Data Centers Information</Label>
                <textarea
                  value={settings.data_centers}
                  onChange={(e) => setSettings({ ...settings, data_centers: e.target.value })}
                  placeholder="List your data center locations and specifications..."
                  className="input-field w-full min-h-[150px] rounded-md border px-3 py-2"
                  data-testid="data-centers"
                />
              </div>
            </div>
          </TabsContent>

          {/* Contact & Support */}
          <TabsContent value="contact">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-text-primary">Contact & Support</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    placeholder="support@cloudnest.com"
                    className="input-field"
                    data-testid="contact-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={settings.contact_phone}
                    onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="input-field"
                    data-testid="contact-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={settings.contact_address}
                  onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                  placeholder="123 Cloud Street, Tech City, TC 12345"
                  className="input-field"
                  data-testid="contact-address"
                />
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-5 h-5 text-primary" />
                  <Label className="text-primary font-semibold">Skype Support</Label>
                </div>
                <div className="space-y-2">
                  <Label>Skype ID (for live support)</Label>
                  <Input
                    value={settings.skype_id}
                    onChange={(e) => setSettings({ ...settings, skype_id: e.target.value })}
                    placeholder="your.skype.id"
                    className="input-field"
                    data-testid="skype-id"
                  />
                  <p className="text-text-muted text-sm">Users will see this on the support page to contact via Skype</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Legal Pages */}
          <TabsContent value="pages">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-text-primary">Legal & Policy Pages</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Terms of Service</Label>
                  <textarea
                    value={settings.terms_of_service}
                    onChange={(e) => setSettings({ ...settings, terms_of_service: e.target.value })}
                    placeholder="Enter your Terms of Service..."
                    className="input-field w-full min-h-[200px] rounded-md border px-3 py-2 font-mono text-sm"
                    data-testid="terms-of-service"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Privacy Policy</Label>
                  <textarea
                    value={settings.privacy_policy}
                    onChange={(e) => setSettings({ ...settings, privacy_policy: e.target.value })}
                    placeholder="Enter your Privacy Policy..."
                    className="input-field w-full min-h-[200px] rounded-md border px-3 py-2 font-mono text-sm"
                    data-testid="privacy-policy"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Service Level Agreement (SLA)</Label>
                  <textarea
                    value={settings.sla}
                    onChange={(e) => setSettings({ ...settings, sla: e.target.value })}
                    placeholder="Enter your SLA terms..."
                    className="input-field w-full min-h-[200px] rounded-md border px-3 py-2 font-mono text-sm"
                    data-testid="sla"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Acceptable Use Policy (AUP)</Label>
                  <textarea
                    value={settings.aup}
                    onChange={(e) => setSettings({ ...settings, aup: e.target.value })}
                    placeholder="Enter your AUP..."
                    className="input-field w-full min-h-[200px] rounded-md border px-3 py-2 font-mono text-sm"
                    data-testid="aup"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Payment Info */}
          <TabsContent value="payment">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-text-primary">Payment Information</h2>
              </div>
              
              <div className="space-y-2">
                <Label>Bank Transfer Details</Label>
                <textarea
                  value={settings.bank_transfer_details}
                  onChange={(e) => setSettings({ ...settings, bank_transfer_details: e.target.value })}
                  placeholder={"Bank: Your Bank Name\nAccount Name: Your Company\nAccount Number: XXXX-XXXX-XXXX\nSWIFT: XXXXXX\nIBAN: XXXX"}
                  className="input-field w-full min-h-[150px] rounded-md border px-3 py-2 font-mono text-sm"
                  data-testid="bank-transfer"
                />
              </div>

              <div className="space-y-2">
                <Label>Cryptocurrency Addresses</Label>
                <textarea
                  value={settings.crypto_addresses}
                  onChange={(e) => setSettings({ ...settings, crypto_addresses: e.target.value })}
                  placeholder={"BTC: your-bitcoin-address\nETH: your-ethereum-address\nUSDT (TRC20): your-usdt-address"}
                  className="input-field w-full min-h-[150px] rounded-md border px-3 py-2 font-mono text-sm"
                  data-testid="crypto-addresses"
                />
              </div>
            </div>
          </TabsContent>

          {/* Social Links */}
          <TabsContent value="social">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-text-primary">Social Media Links</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Twitter/X URL</Label>
                  <Input
                    value={settings.social_twitter}
                    onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
                    placeholder="https://twitter.com/yourcompany"
                    className="input-field"
                    data-testid="social-twitter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={settings.social_linkedin}
                    onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })}
                    placeholder="https://linkedin.com/company/yourcompany"
                    className="input-field"
                    data-testid="social-linkedin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GitHub URL</Label>
                  <Input
                    value={settings.social_github}
                    onChange={(e) => setSettings({ ...settings, social_github: e.target.value })}
                    placeholder="https://github.com/yourcompany"
                    className="input-field"
                    data-testid="social-github"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
