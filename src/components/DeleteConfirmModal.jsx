import { X, AlertTriangle, Shield, UserX, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = "http://localhost:5000/api";

function DeleteConfirmModal({ isOpen, onClose, onConfirm, user }) {
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    const userData = localStorage.getItem('user');
    setCurrentUserRole(role);
    
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setCurrentUserId(parsed.id);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleConfirm = async () => {
    // Check if trying to delete self
    if (user?._id === currentUserId) {
      toast.error('You cannot delete your own account');
      return;
    }

    // Check if trying to delete super_admin as non-super_admin
    if (user?.role === 'super_admin' && currentUserRole !== 'super_admin') {
      toast.error('Only Super Admin can delete a Super Admin');
      return;
    }

    // Check if admin trying to delete another admin
    if (user?.role === 'admin' && currentUserRole === 'admin') {
      toast.error('Admins cannot delete other admins');
      return;
    }

    // If all checks pass, proceed with deletion
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Send reason as query parameter (more reliable)
      const url = `${API_URL}/users/${user._id}?reason=${encodeURIComponent(deleteReason || 'No reason provided')}`;
      
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(
        <div className="flex items-center gap-2">
          <UserX size={18} className="text-green-500" />
          <span>User deleted successfully</span>
        </div>
      );
      
      onConfirm(); // Call the onConfirm callback
      onClose(); // Close the modal
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-red-500" />
          <span>{error.response?.data?.message || 'Failed to delete user'}</span>
        </div>
      );
    } finally {
      setDeleting(false);
    }
  };

  const getWarningMessage = () => {
    if (user?._id === currentUserId) {
      return {
        title: "Cannot Delete Yourself",
        message: "You cannot delete your own account. This action is not allowed for security reasons.",
        type: "error"
      };
    }

    if (user?.role === 'super_admin' && currentUserRole !== 'super_admin') {
      return {
        title: "Cannot Delete Super Admin",
        message: "Only a Super Admin can delete another Super Admin. Please contact your system administrator.",
        type: "error"
      };
    }

    if (user?.role === 'admin' && currentUserRole === 'admin') {
      return {
        title: "Cannot Delete Admin",
        message: "Admins cannot delete other admin accounts. Only Super Admin can perform this action.",
        type: "warning"
      };
    }

    return {
      title: "Delete User",
      message: `Are you sure you want to delete ${user?.name}? This action cannot be undone.`,
      type: "confirm"
    };
  };

  if (!isOpen) return null;

  const warning = getWarningMessage();
  const isError = warning.type === 'error';
  const isWarning = warning.type === 'warning';
  const canDelete = warning.type === 'confirm';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
          
          {/* Header with Gradient based on type */}
          <div className={`px-6 py-4 rounded-t-2xl ${
            isError ? 'bg-gradient-to-r from-red-600 to-rose-600' :
            isWarning ? 'bg-gradient-to-r from-orange-600 to-amber-600' :
            'bg-gradient-to-r from-red-600 to-rose-600'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-white/20 rounded-lg ${
                isError ? 'animate-pulse' : ''
              }`}>
                {isError ? (
                  <Shield size={24} className="text-white" />
                ) : isWarning ? (
                  <AlertTriangle size={24} className="text-white" />
                ) : (
                  <UserX size={24} className="text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {warning.title}
                </h3>
                <p className="text-white/80 text-sm mt-0.5">
                  {user?.name} • {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                isError ? 'bg-red-100' : isWarning ? 'bg-orange-100' : 'bg-red-100'
              }`}>
                {isError ? (
                  <Shield size={24} className="text-red-600" />
                ) : isWarning ? (
                  <AlertTriangle size={24} className="text-orange-600" />
                ) : (
                  <AlertTriangle size={24} className="text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {warning.message}
                </p>

                {/* User Details */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">User ID</span>
                    <span className="font-mono text-gray-700">{user?._id?.slice(-8)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-700">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Role</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user?.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                      user?.role === 'admin' ? 'bg-gray-100 text-gray-700' :
                      user?.role === 'loan_officer' ? 'bg-orange-100 text-orange-700' :
                      user?.role === 'borrower' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Reason for deletion - only show if can delete */}
                {canDelete && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Reason for deletion (optional)
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Enter reason for deleting this user..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                      rows="3"
                    />
                  </div>
                )}

                {/* Warning for important users */}
                {user?.role === 'admin' && canDelete && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-xs text-orange-700 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      You are about to delete an admin user. This will remove all their access and permissions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>
              
              {canDelete && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={deleting}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <UserX size={16} />
                      Delete User
                    </>
                  )}
                </button>
              )}

              {!canDelete && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition text-sm font-medium flex items-center gap-2"
                >
                  <X size={16} />
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;