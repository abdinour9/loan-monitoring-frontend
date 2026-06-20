import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Calendar, 
  BarChart3,
  Menu,
  X,
  LogOut,
  Settings,
  Shield,
  Send // Add this icon for broadcast
} from "lucide-react";
import toast from 'react-hot-toast';
import '../index.css';

function Sidebar({ setIsAuthenticated, setUserRole }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState({ name: '', email: '', role: '' });

  // Get user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({
          name: parsedUser.name || 'Admin User',
          email: parsedUser.email || 'admin@loanapp.com',
          role: role || parsedUser.role || 'admin'
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const linkClass = 
    "flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-green-600 transition-all duration-200 text-gray-100";

  const activeClass = 
    "bg-green-600 text-white font-medium shadow-lg shadow-green-600/30";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/loans", icon: CreditCard, label: "Loans" },
  { to: "/repayments", icon: Calendar, label: "Repayments" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/broadcast", icon: Send, label: "Broadcast" }, // Add this new item
  { to: "/settings", icon: Settings, label: "Settings" },
];

  const handleLogout = () => {
    // Show custom toast confirmation
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <LogOut size={18} className="text-red-500" />
          <span className="font-medium">Confirm Logout</span>
        </div>
        <p className="text-sm text-gray-600">Are you sure you want to logout?</p>
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              // Proceed with logout
              performLogout();
            }}
            className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
          >
            Yes, Logout
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 5000, // Keep it open until user interacts
      position: 'top-center',
      style: {
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        maxWidth: '350px',
      },
    });
  };

  // Separate function for actual logout logic
  const performLogout = () => {
    // Clear all sessions
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('refreshToken');
    
    // Update auth state
    if (setIsAuthenticated) setIsAuthenticated(false);
    if (setUserRole) setUserRole(null);
    
    // Show success message
    toast.success('Logged out successfully', {
      icon: '👋',
      duration: 3000,
      position: 'top-center',
    });
    
    // Redirect to login page
    navigate('/auth');
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    if (user.name && user.name !== 'Admin User') {
      return user.name.charAt(0).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  // Get display role text
  const getDisplayRole = () => {
    return user.role === 'super_admin' ? 'Super Admin' : 'Admin User';
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    return user.role === 'super_admin' 
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
          Loan<span className="text-white">Admin</span>
        </h2>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden text-white hover:text-green-400 transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : "hover:bg-green-600/80"}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon 
                  size={20} 
                  className={isActive ? "text-white" : "text-green-400"} 
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile Section - With Role Display */}
      <div className="mt-auto pt-6 border-t border-green-800">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-600/30 flex-shrink-0">
            <span className="text-sm font-bold text-white">{getUserInitial()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-green-400 truncate">{user.email}</p>
          </div>
        </div>
        
        {/* Role Badge */}
        <div className={`px-3 py-2 mx-2 rounded-lg border ${getRoleBadgeColor()} flex items-center gap-2`}>
          <Shield size={14} />
          <span className="text-xs font-medium">{getDisplayRole()}</span>
        </div>
      </div>

      {/* Logout Button - Always Visible at Bottom */}
      <button
        onClick={handleLogout}
        className="mt-3 flex items-center gap-3 px-4 py-2.5 w-full rounded-lg hover:bg-red-600/20 transition-all duration-200 text-gray-200 hover:text-red-400 group border-t border-green-800/50 pt-4"
      >
        <LogOut size={20} className="text-red-400 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium">Logout</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-600/50 hover:from-green-700 hover:to-green-800 transition-all duration-200"
        aria-label="Toggle menu"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on Desktop, Slide-over on Mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-50
        transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-72 lg:w-64
        bg-gradient-to-b from-gray-900 to-gray-950
        text-white
        shadow-2xl lg:shadow-xl
        overflow-hidden
        flex flex-col
      `}>
        <div className="h-full overflow-y-auto p-6">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}

export default Sidebar;