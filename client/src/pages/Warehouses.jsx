import React, { useEffect, useState } from 'react';
import customFetch from '../services/customFetch';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, Check, Eye, ChevronRight, Search } from 'lucide-react';

const Warehouses = () => {
  const { hasPermission } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [selectedW, setSelectedW] = useState(null);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Warehouse Form State
  const [wModalOpen, setWModalOpen] = useState(false);
  const [editingWId, setEditingWId] = useState(null);
  const [wName, setWName] = useState('');
  const [wLocation, setWLocation] = useState('');
  const [wCapacity, setWCapacity] = useState('10000');
  const [wStatus, setWStatus] = useState('Active');
  const [wFormError, setWFormError] = useState('');

  // Bin Form State
  const [binModalOpen, setBinModalOpen] = useState(false);
  const [editingBinId, setEditingBinId] = useState(null);
  const [binName, setBinName] = useState('');
  const [binCapacity, setBinCapacity] = useState('1000');
  const [binStatus, setBinStatus] = useState('Active');
  const [binFormError, setBinFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWarehouses = async () => {
    try {
      const response = await customFetch.get('/warehouses');
      if (response.data && response.data.success) {
        setWarehouses(response.data.data);
        if (response.data.data.length > 0 && !selectedW) {
          setSelectedW(response.data.data[0]);
        }
      }
    } catch (err) {
      setError('Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  const fetchBinsForSelected = async () => {
    if (!selectedW) return;
    try {
      const response = await customFetch.get(`/warehouses/bins?warehouse=${selectedW._id}`);
      if (response.data && response.data.success) {
        setBins(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch bins:', err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchBinsForSelected();
  }, [selectedW]);

  // Warehouse actions
  const handleOpenWCreate = () => {
    setEditingWId(null);
    setWName('');
    setWLocation('');
    setWCapacity('10000');
    setWStatus('Active');
    setWFormError('');
    setWModalOpen(true);
  };

  const handleOpenWEdit = (w) => {
    setEditingWId(w._id);
    setWName(w.name);
    setWLocation(w.location);
    setWCapacity(w.capacity.toString());
    setWStatus(w.status);
    setWFormError('');
    setWModalOpen(true);
  };

  const handleWSubmit = async (e) => {
    e.preventDefault();
    setWFormError('');
    if (!wName.trim()) return setWFormError('Name is required');
    if (!wLocation.trim()) return setWFormError('Location is required');

    try {
      const payload = { name: wName, location: wLocation, capacity: parseInt(wCapacity), status: wStatus };
      let response;
      if (editingWId) {
        response = await customFetch.put(`/warehouses/${editingWId}`, payload);
      } else {
        response = await customFetch.post('/warehouses', payload);
      }

      if (response.data && response.data.success) {
        setWModalOpen(false);
        fetchWarehouses();
      }
    } catch (err) {
      setWFormError(err.friendlyMessage || 'Warehouse operation failed');
    }
  };

  const handleWDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this warehouse?')) return;
    try {
      const response = await customFetch.delete(`/warehouses/${id}`);
      if (response.data && response.data.success) {
        if (selectedW?._id === id) setSelectedW(null);
        fetchWarehouses();
      }
    } catch (err) {
      alert(err.friendlyMessage || 'Delete failed');
    }
  };

  // Bin actions
  const handleOpenBinCreate = () => {
    if (!selectedW) return alert('Select a warehouse first');
    setEditingBinId(null);
    setBinName('');
    setBinCapacity('1000');
    setBinStatus('Active');
    setBinFormError('');
    setBinModalOpen(true);
  };

  const handleOpenBinEdit = (b) => {
    setEditingBinId(b._id);
    setBinName(b.name);
    setBinCapacity(b.capacity.toString());
    setBinStatus(b.status);
    setBinFormError('');
    setBinModalOpen(true);
  };

  const handleBinSubmit = async (e) => {
    e.preventDefault();
    setBinFormError('');
    if (!binName.trim()) return setBinFormError('Bin name is required');

    try {
      const payload = { 
        name: binName, 
        warehouse: selectedW._id, 
        capacity: parseInt(binCapacity), 
        status: binStatus 
      };
      
      let response;
      if (editingBinId) {
        response = await customFetch.put(`/warehouses/bins/${editingBinId}`, payload);
      } else {
        response = await customFetch.post('/warehouses/bins', payload);
      }

      if (response.data && response.data.success) {
        setBinModalOpen(false);
        fetchBinsForSelected();
      }
    } catch (err) {
      setBinFormError(err.friendlyMessage || 'Bin operation failed');
    }
  };

  const handleBinDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bin?')) return;
    try {
      const response = await customFetch.delete(`/warehouses/bins/${id}`);
      if (response.data && response.data.success) {
        fetchBinsForSelected();
      }
    } catch (err) {
      alert(err.friendlyMessage || 'Delete failed');
    }
  };

  const canManage = hasPermission('manage_warehouses');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Warehouses management panel (Col 2) */}
      <div className="xl:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Warehouses</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage multiple inventory storage spaces</p>
          </div>
          {canManage && (
            <button 
              onClick={handleOpenWCreate}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-all shadow-md shadow-brand-500/10"
            >
              <Plus size={16} />
              <span>Create Warehouse</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-200">
            {error}
          </div>
        )}

        {/* Warehouse search filter input */}
        <div className="glass-panel p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl flex items-center relative">
          <span className="absolute inset-y-0 left-0 pl-7 flex items-center text-slate-400 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
            placeholder="Search warehouses by name or location..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(() => {
            const filtered = warehouses.filter(w => 
              w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (w.location && w.location.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            if (filtered.length === 0) {
              return <div className="col-span-2 text-center p-8 bg-white dark:bg-slate-900 border rounded-2xl text-slate-400 font-sans">No matching warehouses found</div>;
            }
            return filtered.map((w) => {
              const isSelected = selectedW?._id === w._id;
              return (
                <div 
                  key={w._id} 
                  onClick={() => setSelectedW(w)}
                  className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-44 ${isSelected ? 'border-brand-500 ring-2 ring-brand-500/10 bg-white dark:bg-slate-900 shadow-xl' : 'border-slate-200/50 dark:border-slate-800/40 bg-white/70 dark:bg-slate-900/60'}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                        {w.status}
                      </span>
                      <ChevronRight size={16} className={`text-slate-400 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-3 truncate">{w.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{w.location}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-3 mt-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Capacity: <strong className="text-slate-700 dark:text-slate-200">{w.capacity} units</strong></span>
                    {canManage && (
                      <div className="space-x-1.5" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenWEdit(w)}
                          className="p-1.5 rounded-lg hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleWDelete(w._id)}
                          className="p-1.5 rounded-lg hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Selected Warehouse Bins panel (Col 1) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Bins breakdown</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              {selectedW ? `Inside: ${selectedW.name}` : 'Select a warehouse'}
            </p>
          </div>
          {canManage && selectedW && (
            <button 
              onClick={handleOpenBinCreate}
              className="p-2 rounded-xl bg-slate-800 dark:bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center justify-center"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        <div className="glass-panel p-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl min-h-[300px] flex flex-col">
          {!selectedW ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select a warehouse to view bin distributions</div>
          ) : bins.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm py-8 text-center space-y-2">
              <span>No bins created for this warehouse yet.</span>
              {canManage && (
                <button onClick={handleOpenBinCreate} className="text-brand-500 hover:underline font-semibold">
                  Add first Bin
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {bins.map((bin) => (
                <div key={bin._id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between hover:scale-[1.005] transition-all">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 dark:text-white truncate">{bin.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Capacity: {bin.capacity} units</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${bin.status === 'Active' ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-600'}`}>
                      {bin.status}
                    </span>
                    {canManage && (
                      <div className="flex">
                        <button 
                          onClick={() => handleOpenBinEdit(bin)}
                          className="p-1.5 hover:text-brand-500 dark:hover:text-brand-400"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleBinDelete(bin._id)}
                          className="p-1.5 hover:text-rose-500 dark:hover:text-rose-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Warehouse Modal */}
      {wModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingWId ? 'Edit Warehouse Details' : 'Create Warehouse'}
              </h3>
              <button onClick={() => setWModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {wFormError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold">
                {wFormError}
              </div>
            )}

            <form onSubmit={handleWSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Warehouse Name</label>
                <input
                  type="text"
                  value={wName}
                  onChange={(e) => setWName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
                  placeholder="e.g. Mumbai North Hub, West Depot"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Location/Address</label>
                <input
                  type="text"
                  value={wLocation}
                  onChange={(e) => setWLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
                  placeholder="e.g. Road No 5, Industrial Area, Mumbai"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Capacity (Units)</label>
                  <input
                    type="number"
                    value={wCapacity}
                    onChange={(e) => setWCapacity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Status</label>
                  <select
                    value={wStatus}
                    onChange={(e) => setWStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all"
                >
                  <Check size={16} />
                  <span>{editingWId ? 'Save Changes' : 'Create Warehouse'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bin Modal */}
      {binModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingBinId ? 'Edit Bin Details' : `Create Bin inside ${selectedW?.name}`}
              </h3>
              <button onClick={() => setBinModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {binFormError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold">
                {binFormError}
              </div>
            )}

            <form onSubmit={handleBinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Bin Name</label>
                <input
                  type="text"
                  value={binName}
                  onChange={(e) => setBinName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
                  placeholder="e.g. Bin A-1, Shelf-4-Top"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Bin Capacity (Units)</label>
                  <input
                    type="number"
                    value={binCapacity}
                    onChange={(e) => setBinCapacity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Status</label>
                  <select
                    value={binStatus}
                    onChange={(e) => setBinStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBinModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all"
                >
                  <Check size={16} />
                  <span>{editingBinId ? 'Save Changes' : 'Create Bin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouses;
