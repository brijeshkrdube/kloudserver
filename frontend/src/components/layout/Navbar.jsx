import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Server, Cloud, Database, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const services = [
    { name: 'VPS Hosting', href: '/vps-hosting', icon: Server },
    { name: 'Shared Hosting', href: '/shared-hosting', icon: Cloud },
    { name: 'Dedicated Servers', href: '/dedicated-servers', icon: Database },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-text-primary">KloudNests</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors" data-testid="services-dropdown">
                Services <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background-paper border-white/10">
                {services.map((service) => (
                  <DropdownMenuItem key={service.href} asChild>
                    <Link to={service.href} className="flex items-center gap-2 cursor-pointer" data-testid={`nav-${service.href.slice(1)}`}>
                      <service.icon className="w-4 h-4" />
                      {service.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link to="/pricing" className="text-text-secondary hover:text-text-primary transition-colors" data-testid="nav-pricing">
              Pricing
            </Link>
            <Link to="/contact" className="text-text-secondary hover:text-text-primary transition-colors" data-testid="nav-contact">
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-btn">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-text-primary">{user.full_name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background-paper border-white/10 w-48">
                  <DropdownMenuItem asChild>
                    <Link to={user.role === 'user' ? '/dashboard' : '/admin'} className="flex items-center gap-2 cursor-pointer" data-testid="dashboard-link">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer" data-testid="profile-link">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-accent-error" data-testid="logout-btn">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-text-secondary hover:text-text-primary" data-testid="login-btn">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="btn-primary" data-testid="register-btn">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-text-primary"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="mobile-menu-btn"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/5">
            <div className="flex flex-col gap-4">
              {services.map((service) => (
                <Link
                  key={service.href}
                  to={service.href}
                  className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  <service.icon className="w-4 h-4" />
                  {service.name}
                </Link>
              ))}
              <Link
                to="/pricing"
                className="text-text-secondary hover:text-text-primary transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/contact"
                className="text-text-secondary hover:text-text-primary transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              
              <div className="border-t border-white/5 pt-4 mt-2">
                {user ? (
                  <>
                    <Link
                      to={user.role === 'user' ? '/dashboard' : '/admin'}
                      className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 text-accent-error py-2 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Login</Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      <Button className="btn-primary w-full">Get Started</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
