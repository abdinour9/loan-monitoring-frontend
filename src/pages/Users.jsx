// src/pages/Users.jsx
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Loader,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from 'react-hot-toast';
import UserModal from "../components/UserModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

const baseURL = "http://localhost:5000";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    borrowers: 0,
    guarantors: 0,
    admins: 0,
    loanOfficers: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await axios.get(`${baseURL}/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleUserSaved = () => {
    fetchUsers();
    setIsModalOpen(false);
  };

  const handleUserDeleted = async (reason) => {
    try {
      const token = localStorage.getItem('token');
      
      // Send reason as query parameter
      const url = `${baseURL}/api/users/${selectedUser._id}?reason=${encodeURIComponent(reason || 'No reason provided')}`;
      
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(
        <div className="flex items-center gap-2">
          <Trash2 size={18} className="text-green-500" />
          <span>User deleted successfully</span>
        </div>
      );
      
      fetchUsers();
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-red-500" />
          <span>{error.response?.data?.message || 'Failed to delete user'}</span>
        </div>
      );
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${baseURL}/api/users?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Convert to CSV
      const users = response.data.data;
      const csv = [
        ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created At', 'Last Login'],
        ...users.map(u => [
          u.name,
          u.email,
          u.phone,
          u.role,
          u.isActive ? 'Active' : 'Inactive',
          new Date(u.createdAt).toLocaleDateString(),
          u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'
        ])
      ].map(row => row.join(',')).join('\n');

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success('Export started');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            User Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Manage borrowers, guarantors, and system users
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-all text-sm"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all text-sm"
          >
            <Plus size={18} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.total}
          icon={<UserCheck size={20} />}
          color="green"
        />
        <StatsCard
          title="Active Users"
          value={stats.active}
          icon={<Shield size={20} />}
          color="emerald"
        />
        <StatsCard
          title="Borrowers"
          value={stats.borrowers}
          icon={<UserCheck size={20} />}
          color="blue"
        />
        <StatsCard
          title="Guarantors"
          value={stats.guarantors}
          icon={<UserCheck size={20} />}
          color="purple"
        />
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              autoComplete="off"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white text-sm"
            >
              <option value="all">All Roles</option>
              <option value="borrower">Borrower</option>
              <option value="guarantor">Guarantor</option>
              <option value="admin">Admin</option>
              <option value="loan_officer">Loan Officer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={fetchUsers}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:text-gray-900" onClick={() => handleSort('name')}>
                  User {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 cursor-pointer hover:text-gray-900" onClick={() => handleSort('role')}>
                  Role {sortBy === 'role' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-gray-900" onClick={() => handleSort('isActive')}>
                  Status {sortBy === 'isActive' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-gray-900" onClick={() => handleSort('createdAt')}>
                  Created {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    <Loader className="animate-spin mx-auto mb-2" size={24} />
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <UserRow
                    key={user._id}
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {users.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      pagination.page === pageNum
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleUserSaved}
        user={selectedUser}
        mode={modalMode}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleUserDeleted}
        user={selectedUser}
      />
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, color }) {
  const colorVariants = {
    green: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
    emerald: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200",
    blue: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
    purple: "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200",
  };

  const iconColors = {
    green: "text-green-600",
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorVariants[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-white ${iconColors[color]}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{title}</p>
        <h3 className="text-xl font-bold text-gray-800">{value.toLocaleString()}</h3>
      </div>
    </div>
  );
}

// User Row Component - Removed the Loans column
function UserRow({ user, onEdit, onDelete }) {
  const roleConfig = {
    borrower: { color: "bg-blue-100 text-blue-700", label: "Borrower" },
    guarantor: { color: "bg-purple-100 text-purple-700", label: "Guarantor" },
    admin: { color: "bg-gray-100 text-gray-700", label: "Admin" },
    loan_officer: { color: "bg-orange-100 text-orange-700", label: "Loan Officer" },
    super_admin: { color: "bg-red-100 text-red-700", label: "Super Admin" }
  };

  const statusConfig = {
    true: { color: "bg-green-100 text-green-700", label: "Active" },
    false: { color: "bg-red-100 text-red-700", label: "Inactive" }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs">
            {getInitials(user.name)}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">{user.name}</p>
            <p className="text-xs text-gray-500">ID: {user._id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs">
            <Mail size={12} className="text-gray-400" />
            <span className="text-gray-600">{user.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Phone size={12} className="text-gray-400" />
            <span className="text-gray-600">{user.phone}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleConfig[user.role]?.color || 'bg-gray-100 text-gray-700'}`}>
          {roleConfig[user.role]?.label || user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[user.isActive]?.color}`}>
          {statusConfig[user.isActive]?.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Calendar size={12} className="text-gray-400" />
          {formatDate(user.createdAt)}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            title="Edit user"
          >
            <Edit2 size={14} className="text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-1.5 hover:bg-red-50 rounded-lg transition"
            title="Delete user"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <MoreHorizontal size={14} className="text-gray-600" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default Users;