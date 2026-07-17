import React, { useEffect, useState } from 'react';
import customFetch from '../services/customFetch';
import { useAuth } from '../context/AuthContext';
import { Package, Search, MapPin, Layers, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const Inventory = () => {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdowns listing states
  const [warehouses, setWarehouses] = useState([]);
  const [bins, setBins] = useState([]);

  // Filter conditions
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedBin, setSelectedBin] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch dropdowns initial list
  const fetchWarehouses = async () => {
    try {
      const res = await customFetch.get('/warehouses');
      if (res.data?.success) {
        setWarehouses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load warehouses list', err);
    }
  };

  const fetchBins = async (warehouseId) => {
    if (!warehouseId) {
      setBins([]);
      setSelectedBin('');
      return;
    }
    try {
      const res = await customFetch.get(`/warehouses/bins?warehouse=${warehouseId}`);
      if (res.data?.success) {
        setBins(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load bins list', err);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await customFetch.get('/inventory', {
        params: {
          search,
          warehouse: selectedWarehouse,
          bin: selectedBin,
          page,
          limit: 10
        }
      });
      if (res.data?.success) {
        setItems(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotalItems(res.data.totalItems);
      }
    } catch (err) {
      setError('Failed to fetch detailed inventory records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchBins(selectedWarehouse);
    setPage(1);
  }, [selectedWarehouse]);

  useEffect(() => {
    setPage(1);
  }, [selectedBin]);

  useEffect(() => {
    fetchInventory();
  }, [page, search, selectedWarehouse, selectedBin]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <Package className="text-brand-500" />
          <span>Bin-Level Stock Balances</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">View real-time stock balances nested by warehouse location and specific rack bins</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      {/* Filter panel */}
      <div className="glass-panel p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
            placeholder="Search product name, SKU, or Barcode..."
          />
        </div>

        {/* Warehouse Filter */}
        <div className="flex items-center space-x-2">
          <MapPin size={14} className="text-slate-400" />
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Bin Filter */}
        <div className="flex items-center space-x-2">
          <Layers size={14} className="text-slate-400" />
          <select
            value={selectedBin}
            onChange={(e) => setSelectedBin(e.target.value)}
            disabled={!selectedWarehouse}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none disabled:opacity-40"
          >
            <option value="">All Bins</option>
            {bins.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory table list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-900 border rounded-2xl text-slate-400">
          No inventory stock records matched your query filters.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-panel bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/40">
                    <th className="px-6 py-3.5">Product Details</th>
                    <th className="px-6 py-3.5">SKU / Barcode</th>
                    <th className="px-6 py-3.5">Warehouse</th>
                    <th className="px-6 py-3.5">Storage Bin</th>
                    <th className="px-6 py-3.5">Available Stock Quantity</th>
                    <th className="px-6 py-3.5">Alert Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-slate-700 dark:text-slate-300">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {item.product?.image ? (
                            <img
                              src={`http://localhost:5000${item.product.image}`}
                              alt={item.product.name}
                              className="w-10 h-10 rounded-lg object-cover border bg-slate-50"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                              <Package size={18} />
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block text-sm">{item.product?.name || 'Deleted Product'}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Price: INR {item.product?.price?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">
                        <div>
                          <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">{item.product?.sku}</span>
                          <span className="block text-[10px] text-slate-400">{item.product?.barcode}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                        {item.warehouse?.name || 'Unknown Warehouse'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border dark:border-slate-700/60 font-medium text-slate-700 dark:text-slate-300">
                          {item.bin?.name || 'Rack floor'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-slate-900 dark:text-white">
                        {item.quantity} units
                      </td>
                      <td className="px-6 py-4">
                        {item.quantity === 0 ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-200 dark:border-rose-900/30">
                            <AlertTriangle size={10} />
                            <span>Out of Stock</span>
                          </span>
                        ) : item.quantity <= 10 ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200 dark:border-amber-900/30">
                            <AlertTriangle size={10} />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-200 dark:border-emerald-900/30">
                            <span>Optimal</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination bar */}
          <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/40 pt-4 mt-6">
            <span className="text-xs text-slate-500">Total matched: {totalItems} bins records</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 border hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 border hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
