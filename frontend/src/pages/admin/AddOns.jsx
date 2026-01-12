import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Save, Loader2, DollarSign } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

const AdminAddOns = () => {
  const { api } = useAuth();
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'other',
    price: '',
    billing_cycle: 'monthly',
    description: ''
  });

  const addonTypes = [
    { value: 'control_panel', label: 'Control Panel' },
    { value: 'ssl', label: 'SSL Certificate' },
    { value: 'backup', label: 'Backup' },
    { value: 'ip', label: 'IP Address' },
    { value: 'support', label: 'Support' },
    { value: 'other', label: 'Other' }
  ];

  const billingCycles = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'one_time', label: 'One Time' }
  ];

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const response = await api.get('/admin/addons');
      setAddons(response.data);
    } catch (error) {
      console.error('Failed to fetch add-ons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (addon = null) => {
    if (addon) {
      setEditing(addon);
      setFormData({
        name: addon.name,
        type: addon.type,
        price: addon.price.toString(),
        billing_cycle: addon.billing_cycle,
        description: addon.description || ''
      });
    } else {
      setEditing(null);
      setFormData({ name: '', type: 'other', price: '', billing_cycle: 'monthly', description: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      if (editing) {
        await api.put(`/admin/addons/${editing.id}`, null, { params: { name: data.name, price: data.price, description: data.description } });
        toast.success('Add-on updated');
      } else {
        await api.post('/admin/addons', data);
        toast.success('Add-on created');
      }
      setDialogOpen(false);
      fetchAddons();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save add-on');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this add-on?')) return;
    
    try {
      await api.delete(`/admin/addons/${id}`);
      toast.success('Add-on deleted');
      fetchAddons();
    } catch (error) {
      toast.error('Failed to delete add-on');
    }
  };

  const handleToggleActive = async (addon) => {
    try {
      await api.put(`/admin/addons/${addon.id}`, null, { 
        params: { is_active: !addon.is_active }
      });
      toast.success(`Add-on ${addon.is_active ? 'disabled' : 'enabled'}`);
      fetchAddons();
    } catch (error) {
      toast.error('Failed to update add-on');
    }
  };

  const getTypeLabel = (type) => addonTypes.find(t => t.value === type)?.label || type;
  const getCycleLabel = (cycle) => billingCycles.find(c => c.value === cycle)?.label || cycle;

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
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="addons-title">
              Add-ons
            </h1>
            <p className="text-text-secondary mt-1">Manage additional services for orders</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="btn-primary" data-testid="add-addon-btn">
            <Plus className="w-4 h-4 mr-2" />
            Add New Add-on
          </Button>
        </div>

        {/* Add-ons Table */}
        {addons.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Package className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Add-ons</h2>
            <p className="text-text-secondary mb-4">Create add-ons that customers can select during order.</p>
            <Button onClick={() => handleOpenDialog()} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add First Add-on
            </Button>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase">Billing</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {addons.map((addon) => (
                  <tr key={addon.id} className={`hover:bg-white/5 ${!addon.is_active && 'opacity-50'}`} data-testid={`addon-${addon.id}`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-text-primary font-medium">{addon.name}</p>
                        {addon.description && (
                          <p className="text-text-muted text-xs">{addon.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                        {getTypeLabel(addon.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-text-primary">{formatCurrency(addon.price)}</td>
                    <td className="px-6 py-4 text-text-secondary">{getCycleLabel(addon.billing_cycle)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${addon.is_active ? 'bg-accent-success/20 text-accent-success' : 'bg-accent-error/20 text-accent-error'}`}>
                        {addon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(addon)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleToggleActive(addon)}
                          className={addon.is_active ? 'text-accent-warning' : 'text-accent-success'}
                        >
                          {addon.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-accent-error" onClick={() => handleDelete(addon.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-background-paper border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                {editing ? 'Edit Add-on' : 'Create Add-on'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="cPanel/WHM"
                  className="input-field"
                  data-testid="addon-name"
                />
              </div>
              
              {!editing && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {addonTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Cycle *</Label>
                    <Select value={formData.billing_cycle} onValueChange={(v) => setFormData({ ...formData, billing_cycle: v })}>
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {billingCycles.map((cycle) => (
                          <SelectItem key={cycle.value} value={cycle.value}>{cycle.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Price ($) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="15.00"
                    className="input-field pl-9"
                    data-testid="addon-price"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Full-featured web hosting control panel"
                  className="input-field"
                  data-testid="addon-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editing ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminAddOns;
