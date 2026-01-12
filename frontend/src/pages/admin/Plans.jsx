import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, X, Loader2, Check, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

const AdminPlans = () => {
  const { api } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'vps',
    cpu: '',
    ram: '',
    storage: '',
    bandwidth: '',
    price_monthly: '',
    price_quarterly: '',
    price_yearly: '',
    features: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/admin/plans/');
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'vps',
      cpu: '',
      ram: '',
      storage: '',
      bandwidth: '',
      price_monthly: '',
      price_quarterly: '',
      price_yearly: '',
      features: '',
    });
    setEditingPlan(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      type: plan.type,
      cpu: plan.cpu,
      ram: plan.ram,
      storage: plan.storage,
      bandwidth: plan.bandwidth,
      price_monthly: plan.price_monthly.toString(),
      price_quarterly: plan.price_quarterly.toString(),
      price_yearly: plan.price_yearly.toString(),
      features: plan.features.join('\n'),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.cpu || !formData.ram || !formData.storage || !formData.bandwidth) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.price_monthly || !formData.price_quarterly || !formData.price_yearly) {
      toast.error('Please enter all pricing tiers');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        cpu: formData.cpu,
        ram: formData.ram,
        storage: formData.storage,
        bandwidth: formData.bandwidth,
        price_monthly: parseFloat(formData.price_monthly),
        price_quarterly: parseFloat(formData.price_quarterly),
        price_yearly: parseFloat(formData.price_yearly),
        features: formData.features.split('\n').filter(f => f.trim()),
      };

      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan.id}`, payload);
        toast.success('Plan updated successfully');
      } else {
        await api.post('/admin/plans/', payload);
        toast.success('Plan created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await api.put(`/admin/plans/${plan.id}`, { is_active: !plan.is_active });
      toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`);
      fetchPlans();
    } catch (error) {
      toast.error('Failed to update plan status');
    }
  };

  const handleDelete = async (planId) => {
    try {
      const response = await api.delete(`/admin/plans/${planId}`);
      if (response.data.deactivated) {
        toast.info('Plan deactivated (has existing orders)');
      } else {
        toast.success('Plan deleted successfully');
      }
      setDeleteConfirm(null);
      fetchPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const groupedPlans = {
    vps: plans.filter(p => p.type === 'vps'),
    shared: plans.filter(p => p.type === 'shared'),
    dedicated: plans.filter(p => p.type === 'dedicated'),
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
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="admin-plans-title">
              Plan Management
            </h1>
            <p className="text-text-secondary mt-1">Manage hosting plans and pricing</p>
          </div>
          <Button className="btn-primary" onClick={openCreateDialog} data-testid="create-plan-btn">
            <Plus className="w-5 h-5 mr-2" />
            Create Plan
          </Button>
        </div>

        {/* Plans by Type */}
        {['vps', 'shared', 'dedicated'].map((type) => (
          <div key={type} className="space-y-4">
            <h2 className="font-heading text-xl font-semibold text-text-primary capitalize flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {type === 'vps' ? 'VPS Hosting' : type === 'shared' ? 'Shared Hosting' : 'Dedicated Servers'}
              <span className="text-text-muted text-sm font-normal">({groupedPlans[type].length} plans)</span>
            </h2>

            {groupedPlans[type].length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-text-muted">No {type} plans created yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {groupedPlans[type].map((plan) => (
                  <div
                    key={plan.id}
                    className={`glass-card p-6 ${!plan.is_active ? 'opacity-60' : ''}`}
                    data-testid={`plan-${plan.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-lg font-semibold text-text-primary">{plan.name}</h3>
                          {!plan.is_active && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-text-muted/20 text-text-muted">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-text-muted text-xs uppercase tracking-wider">CPU</p>
                            <p className="text-text-primary font-mono">{plan.cpu}</p>
                          </div>
                          <div>
                            <p className="text-text-muted text-xs uppercase tracking-wider">RAM</p>
                            <p className="text-text-primary">{plan.ram}</p>
                          </div>
                          <div>
                            <p className="text-text-muted text-xs uppercase tracking-wider">Storage</p>
                            <p className="text-text-primary">{plan.storage}</p>
                          </div>
                          <div>
                            <p className="text-text-muted text-xs uppercase tracking-wider">Bandwidth</p>
                            <p className="text-text-primary">{plan.bandwidth}</p>
                          </div>
                        </div>
                        <div className="flex gap-6 mt-4">
                          <div>
                            <p className="text-text-muted text-xs">Monthly</p>
                            <p className="font-mono font-bold text-primary">{formatCurrency(plan.price_monthly)}</p>
                          </div>
                          <div>
                            <p className="text-text-muted text-xs">Quarterly</p>
                            <p className="font-mono font-bold text-text-primary">{formatCurrency(plan.price_quarterly)}</p>
                          </div>
                          <div>
                            <p className="text-text-muted text-xs">Yearly</p>
                            <p className="font-mono font-bold text-text-primary">{formatCurrency(plan.price_yearly)}</p>
                          </div>
                        </div>
                        {plan.features && plan.features.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {plan.features.map((feature, idx) => (
                              <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs text-text-secondary">
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.is_active}
                            onCheckedChange={() => handleToggleActive(plan)}
                            data-testid={`toggle-${plan.id}`}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(plan)}
                          data-testid={`edit-${plan.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-accent-error hover:text-accent-error"
                          onClick={() => setDeleteConfirm(plan.id)}
                          data-testid={`delete-${plan.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-background-paper border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name *</Label>
                  <Input
                    placeholder="VPS Starter"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    data-testid="plan-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    disabled={!!editingPlan}
                  >
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vps">VPS Hosting</SelectItem>
                      <SelectItem value="shared">Shared Hosting</SelectItem>
                      <SelectItem value="dedicated">Dedicated Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CPU *</Label>
                  <Input
                    placeholder="2 vCPU"
                    value={formData.cpu}
                    onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                    className="input-field"
                    data-testid="plan-cpu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RAM *</Label>
                  <Input
                    placeholder="4 GB"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    className="input-field"
                    data-testid="plan-ram"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Storage *</Label>
                  <Input
                    placeholder="80 GB NVMe"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    className="input-field"
                    data-testid="plan-storage"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bandwidth *</Label>
                  <Input
                    placeholder="3 TB"
                    value={formData.bandwidth}
                    onChange={(e) => setFormData({ ...formData, bandwidth: e.target.value })}
                    className="input-field"
                    data-testid="plan-bandwidth"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Price ($) *</Label>
                  <Input
                    type="number"
                    placeholder="19.99"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                    className="input-field font-mono"
                    step="0.01"
                    data-testid="plan-price-monthly"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quarterly Price ($) *</Label>
                  <Input
                    type="number"
                    placeholder="54.99"
                    value={formData.price_quarterly}
                    onChange={(e) => setFormData({ ...formData, price_quarterly: e.target.value })}
                    className="input-field font-mono"
                    step="0.01"
                    data-testid="plan-price-quarterly"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yearly Price ($) *</Label>
                  <Input
                    type="number"
                    placeholder="199.99"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                    className="input-field font-mono"
                    step="0.01"
                    data-testid="plan-price-yearly"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <textarea
                  placeholder={"99.9% Uptime\nDDoS Protection\n24/7 Support\nRoot Access"}
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="input-field w-full min-h-[120px] rounded-md border px-3 py-2"
                  data-testid="plan-features"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 btn-secondary"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  data-testid="save-plan"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="bg-background-paper border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-accent-error" />
                Confirm Delete
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-text-secondary mb-6">
                Are you sure you want to delete this plan? If there are existing orders with this plan, 
                it will be deactivated instead.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 btn-secondary"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-accent-error hover:bg-accent-error/90"
                  onClick={() => handleDelete(deleteConfirm)}
                  data-testid="confirm-delete"
                >
                  Delete Plan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminPlans;
