import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  CheckCircle,
  X,
  Loader,
  Shield
} from "lucide-react";
import axios from "axios";
import toast from 'react-hot-toast';

// ✅ Define baseURL ONCE at the top
const baseURL = "http://localhost:5000";

function Auth({ setIsAuthenticated, setUserRole }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ""
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email";
    }

    if (!formData.password) {
      newErrors.password = "Password required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Min 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Logging in...');

    try {
      console.log("Connecting to:", `${baseURL}/api/auth/login`);
      
      const response = await axios.post(
        `${baseURL}/api/auth/login`, 
        { 
          email: formData.email, 
          password: formData.password
        },
        { timeout: 8000 }
      );

      if (response.data.success) {
        // Check if user is admin or super_admin
        const userRole = response.data.data.role;
        
        // Only allow admin and super_admin to login
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          toast.error('Access denied. Admin privileges required.', { id: toastId });
          setIsLoading(false);
          return;
        }

        // Login success
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('role', userRole);
        
        if (rememberMe && response.data.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.data.refreshToken);
        }

        setIsAuthenticated(true);
        setUserRole(userRole);

        toast.success('Login successful! Redirecting...', { id: toastId });

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error("Auth error details:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.code === 'ECONNREFUSED') {
        toast.error('❌ Backend server not running! Start it with: npm run dev', { 
          id: toastId,
          duration: 5000 
        });
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Connection timeout. Server not responding.', { id: toastId });
      } else if (!error.response) {
        toast.error('Cannot connect to server. Make sure backend is running on port 5000', { id: toastId });
      } else if (error.response.status === 401) {
        toast.error('Invalid email or password', { id: toastId });
      } else if (error.response.status === 403) {
        toast.error('Account locked. Try again later.', { id: toastId });
      } else {
        toast.error(error.response.data?.message || 'Login failed', { id: toastId });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Login Container */}
      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Loan<span className="text-green-200">Manager</span>
          </h1>
          <p className="text-green-100 text-sm mt-2">
            Admin Portal - Secure Access
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <LogIn size={18} />
              Admin Login
            </h2>
            <p className="text-green-100 text-xs mt-1">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Mail size={16} className="text-green-600" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@loanapp.com"
                  className={`w-full px-4 py-3 pl-11 border ${
                    errors.email ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-green-500"
                  } rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition bg-white`}
                />
                <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <X size={12} />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Lock size={16} className="text-green-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pl-11 pr-11 border ${
                    errors.password ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-green-500"
                  } rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition bg-white`}
                />
                <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <X size={12} />
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => toast('Password reset coming soon!', {
                  icon: '🔧',
                })}
                className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl shadow-lg shadow-green-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Access Dashboard</span>
                </>
              )}
            </button>

            {/* Admin Note */}
            <p className="text-xs text-center text-gray-500">
              This portal is for authorized administrators only
            </p>
          </form>

          {/* Demo Credentials */}
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">super@loanapp.com</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">SuperAdmin123!</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle size={12} />
                <span className="text-xs">Super Admin access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center mt-6">
          <p className="text-xs text-green-200 flex items-center justify-center gap-1">
            <Shield size={12} />
            Secured with 256-bit encryption
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;