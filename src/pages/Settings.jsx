import { 
  User, 
  Bell, 
  Save,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from 'react-hot-toast';

const API_URL = "http://localhost:5000/api";

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and notification preferences</p>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1 w-fit">
        <TabButton 
          active={activeTab === "profile"} 
          onClick={() => setActiveTab("profile")}
          icon={<User size={16} />}
          label="Profile"
        />
        <TabButton 
          active={activeTab === "notifications"} 
          onClick={() => setActiveTab("notifications")}
          icon={<Bell size={16} />}
          label="Notifications"
        />
      </div>

      {/* Content */}
      <div>
        {activeTab === "profile" && <ProfileSettings user={user} onUpdate={fetchUserProfile} />}
        {activeTab === "notifications" && <NotificationSettings />}
      </div>
    </div>
  );
}

// ==================== PROFILE SETTINGS ====================
function ProfileSettings({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.profile?.city ? `${user.profile.city}, ${user.profile.country || 'Somalia'}` : "Mogadishu, Somalia"
  });

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  // Format join date
  const getJoinDate = () => {
    if (user?.createdAt) {
      const date = new Date(user.createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return 'Jan 2025';
  };

  // Get display role
  const getDisplayRole = () => {
    if (user?.role === 'super_admin') return 'Super Admin';
    if (user?.role === 'admin') return 'Admin';
    return user?.role || 'User';
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare update data
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        profile: {
          city: formData.location.split(',')[0].trim(),
          country: formData.location.split(',')[1]?.trim() || 'Somalia'
        }
      };

      const response = await axios.put(`${API_URL}/auth/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        onUpdate(); // Refresh user data
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition ${
              isEditing 
                ? "bg-gray-100 text-gray-700" 
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            disabled={saving}
          >
            {isEditing ? "Cancel" : <><Edit2 size={14} /> Edit</>}
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center text-white text-lg font-bold shadow-lg">
            {getUserInitials()}
          </div>

          {/* Name & Role */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-green-600 text-sm">{getDisplayRole()}</p>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Field 
            label="Email" 
            value={user?.email || ''} 
            icon={<Mail size={14} />}
            isEditing={false} // Email cannot be edited
          />
          
          <Field 
            label="Phone" 
            name="phone"
            value={formData.phone} 
            icon={<Phone size={14} />}
            isEditing={isEditing}
            onChange={handleInputChange}
          />
          
          <Field 
            label="Name" 
            name="name"
            value={formData.name} 
            icon={<User size={14} />}
            isEditing={isEditing}
            onChange={handleInputChange}
          />
          
          <Field 
            label="Location" 
            name="location"
            value={formData.location} 
            icon={<MapPin size={14} />}
            isEditing={isEditing}
            onChange={handleInputChange}
          />
          
          <Field 
            label="Member Since" 
            value={getJoinDate()} 
            icon={<Calendar size={14} />}
            isEditing={false} 
          />
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== NOTIFICATION SETTINGS ====================
function NotificationSettings() {
  const [settings, setSettings] = useState({
    email: true,
    sms: true,
    push: false
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // Fetch notification settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/notifications/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key) => {
    setUpdating(key);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/notifications/settings/${key}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSettings(prev => ({
          ...prev,
          [key]: !prev[key]
        }));
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      toast.error(error.response?.data?.message || 'Failed to update setting');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
        <Loader className="animate-spin text-green-600" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-500 mt-1">Choose how you want to receive updates</p>
      </div>
      
      <div className="p-6 space-y-4">
        <Toggle 
          label="Email Notifications" 
          description="Receive updates via email"
          checked={settings.email}
          onChange={() => toggleSetting('email')}
          disabled={updating === 'email'}
          loading={updating === 'email'}
        />
        
        <Toggle 
          label="SMS Notifications" 
          description="Get text messages for alerts"
          checked={settings.sms}
          onChange={() => toggleSetting('sms')}
          disabled={updating === 'sms'}
          loading={updating === 'sms'}
        />
        
        <Toggle 
          label="Push Notifications" 
          description="In-app browser notifications"
          checked={settings.push}
          onChange={() => toggleSetting('push')}
          disabled={updating === 'push'}
          loading={updating === 'push'}
        />
      </div>

      <div className="px-6 pb-6">
        <p className="text-xs text-gray-400">
          Changes are saved automatically when you toggle any setting
        </p>
      </div>
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
        active 
          ? "bg-green-600 text-white shadow-sm" 
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ label, name, value, icon, isEditing, type = "text", onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
        {icon}
        {label}
      </label>
      {isEditing ? (
        <input 
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />
      ) : (
        <p className="text-sm text-gray-900">{value}</p>
      )}
    </div>
  );
}

function Toggle({ label, description, checked, onChange, disabled, loading }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onChange}
        disabled={disabled || loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
          checked ? 'bg-green-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          } ${loading ? 'flex items-center justify-center' : ''}`}
        >
          {loading && (
            <Loader size={10} className="animate-spin text-green-600 mx-auto" />
          )}
        </span>
      </button>
    </div>
  );
}

export default Settings;