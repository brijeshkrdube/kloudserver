import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Save, X, Loader2, Globe } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const AdminDataCenters = () => {
  const { api } = useAuth();
  const [datacenters, setDatacenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    country: '',
    description: ''
  });

  useEffect(() => {
    fetchDatacenters();
  }, []);

  const fetchDatacenters = async () => {
    try {
      const response = await api.get('/admin/datacenters');
      setDatacenters(response.data);
    } catch (error) {
      console.error('Failed to fetch data centers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (datacenter = null) => {
    if (datacenter) {
      setEditing(datacenter);
      setFormData({
        name: datacenter.name,
        location: datacenter.location,
        country: datacenter.country,
        description: datacenter.description || ''
      });
    } else {
      setEditing(null);
      setFormData({ name: '', location: '', country: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.location || !formData.country) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/admin/datacenters/${editing.id}`, null, { params: formData });
        toast.success('Data center updated');
      } else {
        await api.post('/admin/datacenters', formData);
        toast.success('Data center created');
      }
      setDialogOpen(false);
      fetchDatacenters();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save data center');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this data center?')) return;
    
    try {
      await api.delete(`/admin/datacenters/${id}`);
      toast.success('Data center deleted');
      fetchDatacenters();
    } catch (error) {
      toast.error('Failed to delete data center');
    }
  };

  const handleToggleActive = async (datacenter) => {
    try {
      await api.put(`/admin/datacenters/${datacenter.id}`, null, { 
        params: { is_active: !datacenter.is_active }
      });
      toast.success(`Data center ${datacenter.is_active ? 'disabled' : 'enabled'}`);
      fetchDatacenters();
    } catch (error) {
      toast.error('Failed to update data center');
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
            <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="datacenters-title">
              Data Centers
            </h1>
            <p className="text-text-secondary mt-1">Manage server locations for customers</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="btn-primary" data-testid="add-datacenter-btn">
            <Plus className="w-4 h-4 mr-2" />
            Add Data Center
          </Button>
        </div>

        {/* Data Centers Grid */}
        {datacenters.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Globe className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">No Data Centers</h2>
            <p className="text-text-secondary mb-4">Add your first data center to get started.</p>
            <Button onClick={() => handleOpenDialog()} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Data Center
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datacenters.map((dc) => (
              <div key={dc.id} className={`glass-card p-6 ${!dc.is_active && 'opacity-50'}`} data-testid={`datacenter-${dc.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-text-primary font-semibold">{dc.name}</h3>
                      <p className="text-text-muted text-sm">{dc.location}, {dc.country}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${dc.is_active ? 'bg-accent-success/20 text-accent-success' : 'bg-accent-error/20 text-accent-error'}`}>
                    {dc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {dc.description && (
                  <p className="text-text-secondary text-sm mb-4">{dc.description}</p>
                )}
                
                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                  <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(dc)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleToggleActive(dc)}
                    className={dc.is_active ? 'text-accent-warning' : 'text-accent-success'}
                  >
                    {dc.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-accent-error" onClick={() => handleDelete(dc.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-background-paper border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                {editing ? 'Edit Data Center' : 'Add Data Center'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="US East (New York)"
                  className="input-field"
                  data-testid="dc-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="New York"
                    className="input-field"
                    data-testid="dc-location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="United States"
                    className="input-field"
                    data-testid="dc-country"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Low latency to East Coast"
                  className="input-field"
                  data-testid="dc-description"
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

export default AdminDataCenters;
