import React, { useEffect, useState } from 'react';
import customFetch from '../services/customFetch';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';

const Suppliers = () => {
  const { hasPermission } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSuppliers = async () => {
    try {
      const response = await customFetch.get('/suppliers');
      if (response.data?.success) {
        setSuppliers(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch suppliers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setAddress('');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingId(sup._id);
    setName(sup.name);
    setEmail(sup.email);
    setPhone(sup.phone);
    setCompany(sup.company);
    setAddress(sup.address);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) return setFormError('Name is required');
    if (!email.trim()) return setFormError('Email is required');
    if (!phone.trim()) return setFormError('Phone is required');
    if (!company.trim()) return setFormError('Company name is required');
    if (!address.trim()) return setFormError('Address is required');

    try {
      const payload = { name, email, phone, company, address };
      let response;
      if (editingId) {
        response = await customFetch.put(`/suppliers/${editingId}`, payload);
      } else {
        response = await customFetch.post('/suppliers', payload);
      }

      if (response.data?.success) {
        setModalOpen(false);
        fetchSuppliers();
      }
    } catch (err) {
      setFormError(err.friendlyMessage || 'Request failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const response = await customFetch.delete(`/suppliers/${id}`);
      if (response.data?.success) {
        fetchSuppliers();
      }
    } catch (err) {
      alert(err.friendlyMessage || 'Delete failed');
    }
  };

  const canManage = hasPermission('manage_suppliers');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Vendors & Suppliers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage supplier metadata and procurement channels</p>
        </div>
        {canManage && (
          <button 
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-all shadow-md shadow-brand-500/10"
          >
            <Plus size={16} />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      {/* Search Filter input */}
      <div className="glass-panel p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl flex items-center relative">
        <span className="absolute inset-y-0 left-0 pl-7 flex items-center text-slate-400 pointer-events-none">
          <Search size={14} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          placeholder="Search suppliers by company, name, email, or phone..."
        />
      </div>

      {/* Table list */}
      <div className="glass-panel bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/50 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Address</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm">
              {(() => {
                const filtered = suppliers.filter(sup => 
                  sup.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  sup.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  sup.phone.includes(searchQuery)
                );
                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={canManage ? 6 : 5} className="px-6 py-8 text-center text-slate-400">No suppliers match your search.</td>
                    </tr>
                  );
                }
                return filtered.map((sup) => (
                  <tr key={sup._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors text-slate-700 dark:text-slate-300">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{sup.company}</td>
                    <td className="px-6 py-4 font-medium">{sup.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{sup.email}</td>
                    <td className="px-6 py-4">{sup.phone}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{sup.address}</td>
                    {canManage && (
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleOpenEdit(sup)}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all inline-flex"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(sup._id)}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all inline-flex"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Supplier Details' : 'Add New Supplier'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Company Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                    placeholder="e.g. Corsair Inc"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Contact Person</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                    placeholder="e.g. Rahul"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                  placeholder="vendor@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                  placeholder="+91 9999999999"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Office Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none min-h-[80px]"
                  placeholder="Company official headquarters..."
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all"
                >
                  <Check size={16} />
                  <span>{editingId ? 'Save Changes' : 'Add Supplier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
