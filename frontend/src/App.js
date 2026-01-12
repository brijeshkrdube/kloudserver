import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// Public Pages
import HomePage from "./pages/HomePage";
import VPSHostingPage from "./pages/VPSHostingPage";
import SharedHostingPage from "./pages/SharedHostingPage";
import DedicatedServersPage from "./pages/DedicatedServersPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// User Dashboard Pages
import UserDashboard from "./pages/user/Dashboard";
import UserServices from "./pages/user/Services";
import UserServerDetails from "./pages/user/ServerDetails";
import UserOrderServer from "./pages/user/OrderServer";
import UserBilling from "./pages/user/Billing";
import UserWallet from "./pages/user/Wallet";
import UserTickets from "./pages/user/Tickets";
import UserTicketDetails from "./pages/user/TicketDetails";
import UserProfile from "./pages/user/Profile";

// Admin Dashboard Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminServers from "./pages/admin/Servers";
import AdminUsers from "./pages/admin/Users";
import AdminBilling from "./pages/admin/Billing";
import AdminTickets from "./pages/admin/Tickets";
import AdminTicketDetails from "./pages/admin/TicketDetails";
import AdminPlans from "./pages/admin/Plans";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !["admin", "super_admin"].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right" 
          richColors 
          theme="dark"
          toastOptions={{
            style: {
              background: '#0B0E14',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/vps-hosting" element={<VPSHostingPage />} />
          <Route path="/shared-hosting" element={<SharedHostingPage />} />
          <Route path="/dedicated-servers" element={<DedicatedServersPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* User Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/services" element={<ProtectedRoute><UserServices /></ProtectedRoute>} />
          <Route path="/dashboard/servers/:serverId" element={<ProtectedRoute><UserServerDetails /></ProtectedRoute>} />
          <Route path="/dashboard/order" element={<ProtectedRoute><UserOrderServer /></ProtectedRoute>} />
          <Route path="/dashboard/billing" element={<ProtectedRoute><UserBilling /></ProtectedRoute>} />
          <Route path="/dashboard/wallet" element={<ProtectedRoute><UserWallet /></ProtectedRoute>} />
          <Route path="/dashboard/tickets" element={<ProtectedRoute><UserTickets /></ProtectedRoute>} />
          <Route path="/dashboard/tickets/:ticketId" element={<ProtectedRoute><UserTicketDetails /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          
          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/servers" element={<ProtectedRoute adminOnly><AdminServers /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/billing" element={<ProtectedRoute adminOnly><AdminBilling /></ProtectedRoute>} />
          <Route path="/admin/plans" element={<ProtectedRoute adminOnly><AdminPlans /></ProtectedRoute>} />
          <Route path="/admin/tickets" element={<ProtectedRoute adminOnly><AdminTickets /></ProtectedRoute>} />
          <Route path="/admin/tickets/:ticketId" element={<ProtectedRoute adminOnly><AdminTicketDetails /></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
