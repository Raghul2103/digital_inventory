import React, { useEffect, useState } from 'react';
import customFetch from '../services/customFetch';
import { useAuth } from '../context/AuthContext';
import { Plus, ArrowLeftRight, Check, X, AlertTriangle, Search } from 'lucide-react';

const Transfers = () => {
  const { hasPermission } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  
  // Bins map and Stock level caches
  const [binsMap, setBinsMap] = useState({}); // warehouseId -> bins list
  const [stockMap, setStockMap] = useState({}); // "productId-warehouseId-binId" -> quantity
  const [capacityMap, setCapacityMap] = useState({}); // "warehouseId-binId" -> current usage quantity
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State (Modal)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [sourceBin, setSourceBin] = useState('');
  const [destWarehouse, setDestWarehouse] = useState('');
  const [destBin, setDestBin] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [transRes, prodRes, whRes] = await Promise.all([
        customFetch.get('/transfers'),
        customFetch.get('/products?limit=100'),
        customFetch.get('/warehouses')
      ]);

      if (transRes.data?.success) setTransfers(transRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
      if (whRes.data?.success) setWarehouses(whRes.data.data);
    } catch (err) {
      setError('Failed to fetch stock transfer logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchBinsForWarehouse = async (warehouseId) => {
    if (!warehouseId || binsMap[warehouseId]) return;
    try {
      const response = await customFetch.get(`/warehouses/bins?warehouse=${warehouseId}`);
      if (response.data?.success) {
        setBinsMap(prev => ({ ...prev, [warehouseId]: response.data.data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch product stock level at selected source location
  const fetchSourceStock = async (pId, wId, bId) => {
    if (!pId || !wId || !bId) return;
    try {
      const response = await customFetch.get(`/products/${pId}`);
      if (response.data?.success) {
        const stockLevels = response.data.stockLevels;
        const matchingLvl = stockLevels.find(
          lvl => lvl.warehouse?._id === wId && lvl.bin?._id === bId
        );
        const available = matchingLvl ? matchingLvl.quantity : 0;
        
        const cacheKey = `${pId}-${wId}-${bId}`;
        setStockMap(prev => ({ ...prev, [cacheKey]: available }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger warehouse selections
  useEffect(() => {
    if (sourceWarehouse) fetchBinsForWarehouse(sourceWarehouse);
  }, [sourceWarehouse]);

  useEffect(() => {
    if (destWarehouse) fetchBinsForWarehouse(destWarehouse);
  }, [destWarehouse]);

  useEffect(() => {
    if (selectedProduct && sourceWarehouse && sourceBin) {
      fetchSourceStock(selectedProduct, sourceWarehouse, sourceBin);
    }
  }, [selectedProduct, sourceWarehouse, sourceBin]);

  const handleOpenModal = () => {
    setSelectedProduct('');
    setSourceWarehouse('');
    setSourceBin('');
    setDestWarehouse('');
    setDestBin('');
    setQuantity('1');
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedProduct) return setFormError('Product is required');
    if (!sourceWarehouse || !sourceBin) return setFormError('Source warehouse and bin are required');
    if (!destWarehouse || !destBin) return setFormError('Destination warehouse and bin are required');
    if (sourceBin === destBin) return setFormError('Source and destination bins cannot be the same');
    
    const qtyVal = parseInt(quantity);
    if (!qtyVal || qtyVal <= 0) return setFormError('Transfer quantity must be greater than zero');

    // Check source stock limits
    const cacheKey = `${selectedProduct}-${sourceWarehouse}-${sourceBin}`;
    const available = stockMap[cacheKey] || 0;
    if (qtyVal > available) {
      return setFormError(`Insufficient stock for transfer. Available at source: ${available} units`);
    }

    try {
      const payload = {
        product: selectedProduct,
        sourceWarehouse,
        sourceBin,
        destWarehouse,
        destBin,
        quantity: qtyVal,
        notes
      };

      const response = await customFetch.post('/transfers', payload);
      if (response.data?.success) {
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setFormError(err.friendlyMessage || 'Stock transfer failed');
    }
  };

  const sourceCacheKey = `${selectedProduct}-${sourceWarehouse}-${sourceBin}`;
  const availableSourceQty = stockMap[sourceCacheKey] || 0;
  const isStockDeficient = parseInt(quantity) > availableSourceQty;

  const destBinObj = (binsMap[destWarehouse] || []).find(b => b._id === destBin);
  const destCapacity = destBinObj ? destBinObj.capacity : 0;

  const canManage = hasPermission('manage_transfers');

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
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Stock Transfers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Move products between warehouses and bin placements</p>
        </div>
        {canManage && (
          <button 
            onClick={handleOpenModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-all shadow-md shadow-brand-500/10"
          >
            <Plus size={16} />
            <span>Initiate Transfer</span>
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
          placeholder="Search transfers by number, product, or warehouse..."
        />
      </div>

      {/* Transfers table */}
      <div className="glass-panel bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/50 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Transfer Number</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4 text-right">Transfer Qty</th>
                <th className="px-6 py-4">From Location</th>
                <th className="px-6 py-4">To Location</th>
                <th className="px-6 py-4">Date Executed</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm">
              {(() => {
                const filtered = transfers.filter(t => 
                  t.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (t.product?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (t.sourceWarehouse?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (t.destWarehouse?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
                );
                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-slate-400">No stock transfers matching search query.</td>
                    </tr>
                  );
                }
                return filtered.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors text-slate-700 dark:text-slate-300">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900 dark:text-white">{t.transferNumber}</td>
                    <td className="px-6 py-4 font-semibold">{t.product?.name}</td>
                    <td className="px-6 py-4 text-right font-extrabold text-brand-600 dark:text-brand-400">{t.quantity} units</td>
                    <td className="px-6 py-4">
                      <span>{t.sourceWarehouse?.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">Bin: {t.sourceBin?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span>{t.destWarehouse?.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">Bin: {t.destBin?.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(t.transferDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl">
            <div className="flex items-center justify-between mb-5 border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <ArrowLeftRight size={20} className="text-brand-500" />
                <span>Initiate Stock Transfer Movement</span>
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

            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              {/* Product selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Product SKU / Name</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    setSourceWarehouse('');
                    setSourceBin('');
                    setDestWarehouse('');
                    setDestBin('');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-none"
                >
                  <option value="">Select SKU</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              {/* Source coordinates block */}
              <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/10 dark:border-rose-950/20 dark:bg-rose-950/5 space-y-4">
                <h4 className="text-xs font-extrabold text-rose-500 uppercase tracking-wider">Source coordinates (Stock Out)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Source Warehouse</label>
                    <select
                      value={sourceWarehouse}
                      disabled={!selectedProduct}
                      onChange={(e) => {
                        setSourceWarehouse(e.target.value);
                        setSourceBin('');
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Source Bin</label>
                    <select
                      value={sourceBin}
                      disabled={!sourceWarehouse}
                      onChange={(e) => setSourceBin(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Select Bin</option>
                      {(binsMap[sourceWarehouse] || []).map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                {selectedProduct && sourceWarehouse && sourceBin && (
                  <div className="text-xs text-slate-500">
                    Current Stock available at this bin: <strong className={isStockDeficient ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}>{availableSourceQty} units</strong>
                  </div>
                )}
              </div>

              {/* Destination coordinates block */}
              <div className="p-4 rounded-2xl border border-brand-100 bg-brand-50/10 dark:border-brand-950/20 dark:bg-brand-950/5 space-y-4">
                <h4 className="text-xs font-extrabold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Destination coordinates (Stock In)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Destination Warehouse</label>
                    <select
                      value={destWarehouse}
                      disabled={!selectedProduct}
                      onChange={(e) => {
                        setDestWarehouse(e.target.value);
                        setDestBin('');
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Destination Bin</label>
                    <select
                      value={destBin}
                      disabled={!destWarehouse}
                      onChange={(e) => setDestBin(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Select Bin</option>
                      {(binsMap[destWarehouse] || []).map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                {destBin && (
                  <div className="text-xs text-slate-500">
                    Bin Capacity limit: <strong>{destCapacity} units</strong>
                  </div>
                )}
              </div>

              {/* Qty & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Quantity to move</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Transfer Notes / Reason</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                    placeholder="e.g. Stock consolidation, damaged shelf move..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStockDeficient}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all"
                >
                  <Check size={16} />
                  <span>Execute Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfers;
