import React, { useEffect, useState } from 'react';
import customFetch from '../services/customFetch';
import { useAuth } from '../context/AuthContext';
import { Plus, Eye, ShoppingCart, Trash2, Check, X, Search, DollarSign } from 'lucide-react';

const Purchases = () => {
  const { hasPermission } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [binsMap, setBinsMap] = useState({}); // warehouseId -> bins array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Creation Wizard Form State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [notes, setNotes] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [wizardError, setWizardError] = useState('');

  // Details Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailPurchase, setDetailPurchase] = useState(null);
  const [detailItems, setDetailItems] = useState([]);

  const fetchInitialData = async () => {
    try {
      const [purRes, supRes, prodRes, whRes] = await Promise.all([
        customFetch.get('/purchases'),
        customFetch.get('/suppliers'),
        customFetch.get('/products?limit=100'),
        customFetch.get('/warehouses')
      ]);

      if (purRes.data?.success) setPurchases(purRes.data.data);
      if (supRes.data?.success) setSuppliers(supRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
      if (whRes.data?.success) setWarehouses(whRes.data.data);
    } catch (err) {
      setError('Failed to fetch procurement data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch bins when warehouse is changed in a cart item row
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

  const handleOpenWizard = () => {
    setSelectedSupplier('');
    setPaymentStatus('Paid');
    setNotes('');
    setCartItems([{ product: '', quantity: 1, costPrice: 0, gst: 18, warehouse: '', bin: '', subtotal: 0 }]);
    setWizardError('');
    setWizardOpen(true);
  };

  const handleAddCartItem = () => {
    setCartItems(prev => [
      ...prev,
      { product: '', quantity: 1, costPrice: 0, gst: 18, warehouse: '', bin: '', subtotal: 0 }
    ]);
  };

  const handleRemoveCartItem = (idx) => {
    if (cartItems.length === 1) return;
    setCartItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCartProductChange = (idx, productId) => {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;

    // Load warehouse if product has a default warehouse
    if (prod.warehouse?._id || prod.warehouse) {
      const wId = prod.warehouse?._id || prod.warehouse;
      fetchBinsForWarehouse(wId);
    }

    setCartItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const baseCost = prod.costPrice || 0;
      const baseGst = prod.gst || 18;
      const qty = item.quantity;
      const sub = qty * baseCost * (1 + baseGst / 100);

      return {
        ...item,
        product: productId,
        costPrice: baseCost,
        gst: baseGst,
        warehouse: prod.warehouse?._id || prod.warehouse || '',
        bin: prod.bin?._id || prod.bin || '',
        subtotal: sub
      };
    }));
  };

  const handleCartItemValueChange = (idx, field, val) => {
    setCartItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updatedItem = { ...item, [field]: val };
      
      if (field === 'warehouse') {
        fetchBinsForWarehouse(val);
        updatedItem.bin = ''; // Reset bin when warehouse changes
      }

      // Re-calculate subtotal
      const cost = parseFloat(updatedItem.costPrice) || 0;
      const qty = parseInt(updatedItem.quantity) || 0;
      const gstVal = parseFloat(updatedItem.gst) || 0;
      updatedItem.subtotal = qty * cost * (1 + gstVal / 100);

      return updatedItem;
    }));
  };

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    setWizardError('');

    if (!selectedSupplier) return setWizardError('Please select a supplier');
    
    // Validate cart
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      if (!item.product) return setWizardError(`Row ${i + 1}: Product selection is required`);
      if (item.quantity <= 0) return setWizardError(`Row ${i + 1}: Quantity must be greater than zero`);
      if (item.costPrice < 0) return setWizardError(`Row ${i + 1}: Cost Price cannot be negative`);
      if (!item.warehouse || !item.bin) return setWizardError(`Row ${i + 1}: Destination warehouse and bin placements are required`);
    }

    try {
      const payload = {
        supplier: selectedSupplier,
        paymentStatus,
        notes,
        items: cartItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          costPrice: item.costPrice,
          gst: item.gst,
          warehouse: item.warehouse,
          bin: item.bin
        }))
      };

      const response = await customFetch.post('/purchases', payload);
      if (response.data?.success) {
        setWizardOpen(false);
        fetchInitialData();
      }
    } catch (err) {
      setWizardError(err.friendlyMessage || 'Procurement purchase order failed');
    }
  };

  const handleOpenDetail = async (p) => {
    try {
      const response = await customFetch.get(`/purchases/${p._id}`);
      if (response.data?.success) {
        setDetailPurchase(response.data.data);
        setDetailItems(response.data.items);
        setDetailModalOpen(true);
      }
    } catch (err) {
      alert('Failed to fetch details');
    }
  };

  const grandTotal = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const canManage = hasPermission('manage_purchases');

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
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Procurement Purchases</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Order inventory materials and increment stock levels</p>
        </div>
        {canManage && (
          <button 
            onClick={handleOpenWizard}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-all shadow-md shadow-brand-500/10"
          >
            <Plus size={16} />
            <span>New Purchase Order</span>
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
          placeholder="Search purchases by PO number or vendor..."
        />
      </div>

      {/* Orders list */}
      <div className="glass-panel bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/50 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Purchase Date</th>
                <th className="px-6 py-4">Total Cost (With GST)</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm">
              {(() => {
                const filtered = purchases.filter(p => 
                  p.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.supplier?.company || p.supplier?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
                );
                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-400">No purchase records matching your search query.</td>
                    </tr>
                  );
                }
                return filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors text-slate-700 dark:text-slate-300">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900 dark:text-white">{p.purchaseNumber}</td>
                    <td className="px-6 py-4 font-semibold">{p.supplier?.company || p.supplier?.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-extrabold text-brand-600 dark:text-brand-400">INR {p.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${p.paymentStatus === 'Paid' ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-600'}`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenDetail(p)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-500 inline-flex"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wizard Form Modal */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <ShoppingCart size={20} className="text-brand-500" />
                <span>Create Purchase Order (Stock In)</span>
              </h3>
              <button onClick={() => setWizardOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {wizardError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold">
                {wizardError}
              </div>
            )}

            <form onSubmit={handleSubmitPurchase} className="space-y-6">
              {/* Meta details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Vendor / Supplier</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-none"
                  >
                    <option value="">Select Vendor</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.company} ({s.name})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Purchase Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                    placeholder="Procurement notes..."
                  />
                </div>
              </div>

              {/* Items Cart Table Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800/40">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Purchase Items Cart</h4>
                  <button
                    type="button"
                    onClick={handleAddCartItem}
                    className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300"
                  >
                    <Plus size={12} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end p-4 border border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20 rounded-2xl relative">
                      {/* Product Selector */}
                      <div className="lg:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Product</label>
                        <select
                          value={item.product}
                          onChange={(e) => handleCartProductChange(idx, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
                        >
                          <option value="">Select Item</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </div>

                      {/* Warehouse Selector */}
                      <div className="lg:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Destination Warehouse</label>
                        <select
                          value={item.warehouse}
                          onChange={(e) => handleCartItemValueChange(idx, 'warehouse', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
                        >
                          <option value="">Select Storage</option>
                          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                        </select>
                      </div>

                      {/* Bin Selector */}
                      <div className="lg:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Destination Bin</label>
                        <select
                          value={item.bin}
                          onChange={(e) => handleCartItemValueChange(idx, 'bin', e.target.value)}
                          disabled={!item.warehouse}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none disabled:opacity-50"
                        >
                          <option value="">Select Bin</option>
                          {(binsMap[item.warehouse] || []).map(b => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Cost Price */}
                      <div className="lg:col-span-1.5 lg:col-start-8">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cost Price</label>
                        <input
                          type="number"
                          value={item.costPrice}
                          onChange={(e) => handleCartItemValueChange(idx, 'costPrice', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none"
                        />
                      </div>

                      {/* Qty */}
                      <div className="lg:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleCartItemValueChange(idx, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none"
                        />
                      </div>

                      {/* GST */}
                      <div className="lg:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GST %</label>
                        <select
                          value={item.gst}
                          onChange={(e) => handleCartItemValueChange(idx, 'gst', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>

                      {/* Subtotal & Delete action */}
                      <div className="lg:col-span-1.5 flex items-center space-x-2 justify-end">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Subtotal</span>
                          <strong className="text-xs text-slate-700 dark:text-slate-300 font-mono">INR {item.subtotal.toFixed(2)}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order total footer */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-4 mt-6">
                <div>
                  <span className="text-xs text-slate-500">Total Purchase Value (Including GST Tax):</span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">INR {grandTotal.toFixed(2)}</h3>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setWizardOpen(false)}
                    className="py-3 px-6 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Check size={16} />
                    <span>File Order</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Details Modal */}
      {detailModalOpen && detailPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl">
            <div className="flex items-center justify-between mb-5 border-b pb-3 border-slate-100 dark:border-slate-800/40">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">{detailPurchase.purchaseNumber}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Supplier: {detailPurchase.supplier?.company || detailPurchase.supplier?.name}</p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 text-xs text-slate-500">
                <span>Date Filed: {new Date(detailPurchase.purchaseDate).toLocaleString()}</span>
                <span className="text-right">Payment Status: <strong className="text-brand-500">{detailPurchase.paymentStatus}</strong></span>
              </div>

              {/* Items table */}
              <div className="border border-slate-100 dark:border-slate-800/40 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/40">
                      <th className="px-4 py-2">Item SKU / Name</th>
                      <th className="px-4 py-2 text-right">Cost Price</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">GST %</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-slate-700 dark:text-slate-300">
                    {detailItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium">
                          <span>{item.product?.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">SKU: {item.product?.sku}</span>
                        </td>
                        <td className="px-4 py-3 text-right">INR {item.costPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{item.gst}%</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">INR {item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-right pt-2 border-t border-slate-100 dark:border-slate-800/40">
                <span className="text-xs text-slate-500">Order Grand Total:</span>
                <h4 className="text-lg font-extrabold text-brand-600 dark:text-brand-400">INR {detailPurchase.totalAmount.toFixed(2)}</h4>
              </div>

              {detailPurchase.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 text-xs text-slate-500 rounded-xl border">
                  <strong>Notes:</strong> {detailPurchase.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
