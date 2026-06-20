import { useState, useEffect } from "react";
import { 
  X, 
  Loader, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Shield,
  MapPin,
  Building,
  Globe,
  Briefcase,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import axios from "axios";
import toast from 'react-hot-toast';

const baseURL = "http://localhost:5000";

function UserModal({ isOpen, onClose, onSuccess, user, mode }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "borrower",
    profile: {
      address: "",
      city: "",
      country: "",
      occupation: "",
      income: ""
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Get current user role on mount
  useEffect(() => {
    const role = localStorage.getItem('role');
    setCurrentUserRole(role);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          password: "", // Always empty for edit
          role: user.role || "borrower",
          profile: user.profile || {
            address: "",
            city: "",
            country: "",
            occupation: "",
            income: ""
          }
        });
      } else {
        // Reset all fields for add mode
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          role: "borrower",
          profile: {
            address: "",
            city: "",
            country: "",
            occupation: "",
            income: ""
          }
        });
      }
      setErrors({});
      setShowPassword(false);
    }
  }, [user, mode, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Invalid phone number format";
    }

    if (mode === 'add' && !formData.password) {
      newErrors.password = "Password is required";
    } else if (mode === 'add' && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Check if trying to edit super_admin as non-super_admin
    if (mode === 'edit' && user?.role === 'super_admin' && currentUserRole !== 'super_admin') {
      toast.error('You cannot edit a Super Admin');
      return;
    }

    // Check if trying to create admin as non-super_admin
    if (formData.role === 'admin' && currentUserRole !== 'super_admin') {
      toast.error('Only Super Admin can create admin users');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = mode === 'add' 
        ? `${baseURL}/api/users`
        : `${baseURL}/api/users/${user._id}`;
      
      const method = mode === 'add' ? 'post' : 'put';
      
      // Don't send password if empty in edit mode
      const submitData = { ...formData };
      if (mode === 'edit' && !submitData.password) {
        delete submitData.password;
      }
      
      const response = await axios[method](url, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            <span>{mode === 'add' ? 'User created successfully' : 'User updated successfully'}</span>
          </div>
        );
        onSuccess();
      }
    } catch (error) {
      console.error('Save user error:', error);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-red-500" />
          <span>{error.response?.data?.message || 'Failed to save user'}</span>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
          
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {mode === 'add' ? <User size={24} className="text-white" /> : <Shield size={24} className="text-white" />}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {mode === 'add' ? 'Add New User' : 'Edit User'}
                  </h3>
                  <p className="text-green-100 text-sm mt-0.5">
                    {mode === 'add' ? 'Create a new user account' : `Editing ${user?.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition group"
              >
                <X size={20} className="text-white group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Hidden dummy fields to prevent browser autofill */}
              <input type="text" style={{ display: 'none' }} autoComplete="off" />
              <input type="email" style={{ display: 'none' }} autoComplete="off" />
              <input type="password" style={{ display: 'none' }} autoComplete="new-password" />
              
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
                  <User size={16} className="text-green-600" />
                  Basic Information
                </h4>

                {/* Name Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <User size={14} className="text-gray-400" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      autoComplete="off"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm transition ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    <User size={16} className="absolute left-3 top-3 text-gray-400" />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Mail size={14} className="text-gray-400" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={mode === 'edit'}
                      placeholder="john@example.com"
                      autoComplete="off"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm transition ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      } ${mode === 'edit' ? 'bg-gray-50' : ''}`}
                    />
                    <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Phone size={14} className="text-gray-400" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+252 61 234 5678"
                      autoComplete="off"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm transition ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                {(mode === 'add' || mode === 'edit') && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Lock size={14} className="text-gray-400" />
                      {mode === 'add' ? 'Password *' : 'New Password (optional)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={mode === 'add' ? "Enter password" : "Leave empty to keep current password"}
                        autoComplete="new-password"
                        className={`w-full pl-10 pr-12 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm transition ${
                          errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      />
                      <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle size={12} />
                        {errors.password}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {mode === 'add' 
                        ? 'Password must be at least 6 characters' 
                        : 'Enter a new password only if you want to change it'}
                    </p>
                  </div>
                )}

                {/* Role Selection */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Shield size={14} className="text-gray-400" />
                    User Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={mode === 'edit' && user?.role === 'super_admin' && currentUserRole !== 'super_admin'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white"
                  >
                    <option value="borrower">Borrower</option>
                    <option value="guarantor">Guarantor</option>
                    <option value="loan_officer">Loan Officer</option>
                    <option value="admin" disabled={currentUserRole !== 'super_admin'}>
                      Admin {currentUserRole !== 'super_admin' && '(Super Admin only)'}
                    </option>
                    {currentUserRole === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                  {currentUserRole !== 'super_admin' && formData.role === 'admin' && (
                    <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      Only Super Admin can create admin users
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
                  <Briefcase size={16} className="text-green-600" />
                  Profile Information
                </h4>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin size={14} className="text-gray-400" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="profile.address"
                    value={formData.profile.address}
                    onChange={handleChange}
                    placeholder="123 Main St"
                    autoComplete="off"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {/* City & Country */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600 flex items-center gap-1">
                      <Building size={14} className="text-gray-400" />
                      City
                    </label>
                    <input
                      type="text"
                      name="profile.city"
                      value={formData.profile.city}
                      onChange={handleChange}
                      placeholder="Mogadishu"
                      autoComplete="off"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600 flex items-center gap-1">
                      <Globe size={14} className="text-gray-400" />
                      Country
                    </label>
                    <input
                      type="text"
                      name="profile.country"
                      value={formData.profile.country}
                      onChange={handleChange}
                      placeholder="Somalia"
                      autoComplete="off"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Occupation & Income */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600 flex items-center gap-1">
                      <Briefcase size={14} className="text-gray-400" />
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="profile.occupation"
                      value={formData.profile.occupation}
                      onChange={handleChange}
                      placeholder="Software Engineer"
                      autoComplete="off"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600 flex items-center gap-1">
                      <DollarSign size={14} className="text-gray-400" />
                      Monthly Income
                    </label>
                    <input
                      type="number"
                      name="profile.income"
                      value={formData.profile.income}
                      onChange={handleChange}
                      placeholder="5000"
                      autoComplete="off"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer with Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition text-sm font-medium flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-600/30"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {mode === 'add' ? 'Create User' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserModal;