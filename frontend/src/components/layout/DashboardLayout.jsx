import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Server, LayoutDashboard, ShoppingCart, CreditCard, Wallet, 
  MessageSquare, User, Settings, LogOut, Menu, X, ChevronRight,
  Users, Package, FileText, Bell
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const DashboardLayout = ({ children, isAdmin = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Services', href: '/dashboard/services', icon: Server },
    { name: 'Order Server', href: '/dashboard/order', icon: ShoppingCart },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Support Tickets', href: '/dashboard/tickets', icon: MessageSquare },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: Package },
    { name: 'Servers', href: '/admin/servers', icon: Server },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Billing', href: '/admin/billing', icon: FileText },
    { name: 'Tickets', href: '/admin/tickets', icon: MessageSquare },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background-paper border-b border-white/5 h-16 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-text-primary"
          data-testid="sidebar-toggle"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <Link to="/" className="flex items-center gap-2 ml-4">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Server className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-lg text-text-primary">CloudNest</span>
        </Link>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-full w-64 bg-background-paper border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-text-primary">CloudNest</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive 
                    ? "bg-primary/10 text-primary border-l-2 border-primary" 
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium truncate">{user?.full_name}</p>
              <p className="text-text-muted text-sm truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-text-secondary hover:text-accent-error"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
