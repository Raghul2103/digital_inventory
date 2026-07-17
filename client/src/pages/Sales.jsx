import React, { useEffect, useState } from 'react';
import customFetch from '../services/customFetch';
import { useAuth } from '../context/AuthContext';
import { Plus, Eye, ScrollText, Trash2, Check, X, Download, Printer, AlertTriangle, Search } from 'lucide-react';

const Sales = () => {
  const { hasPermission } = useAuth();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [binsMap, setBinsMap] = useState({}); // warehouseId -> bins array
  const [stockMap, setStockMap] = useState({}); // "productId-warehouseId-binId" -> quantity available
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart Form State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [notes, setNotes] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [wizardError, setWizardError] = useState('');

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailSale, setDetailSale] = useState(null);
  const [detailItems, setDetailItems] = useState([]);

  const fetchInitialData = async () => {
    try {
      const [salesRes, custRes, prodRes, whRes] = await Promise.all([
        customFetch.get('/sales'),
        customFetch.get('/customers'),
        customFetch.get('/products?limit=100'),
        customFetch.get('/warehouses')
      ]);

      if (salesRes.data?.success) setSales(salesRes.data.data);
      if (custRes.data?.success) setCustomers(custRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
      if (whRes.data?.success) setWarehouses(whRes.data.data);
    } catch (err) {
      setError('Failed to fetch sales records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
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

  // Fetch available quantity for specific product, warehouse, and bin
  const fetchAvailableStock = async (productId, warehouseId, binId, idx) => {
    if (!productId || !warehouseId || !binId) return;
    try {
      const response = await customFetch.get(`/products/${productId}`);
      if (response.data?.success) {
        const stockLevels = response.data.stockLevels;
        const matchingLvl = stockLevels.find(
          lvl => lvl.warehouse?._id === warehouseId && lvl.bin?._id === binId
        );
        const availableQty = matchingLvl ? matchingLvl.quantity : 0;
        
        const cacheKey = `${productId}-${warehouseId}-${binId}`;
        setStockMap(prev => ({ ...prev, [cacheKey]: availableQty }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenWizard = () => {
    setSelectedCustomer('');
    setPaymentStatus('Paid');
    setNotes('');
    setCartItems([{ product: '', quantity: 1, sellingPrice: 0, gst: 18, warehouse: '', bin: '', subtotal: 0 }]);
    setWizardError('');
    setWizardOpen(true);
  };

  const handleAddCartItem = () => {
    setCartItems(prev => [
      ...prev,
      { product: '', quantity: 1, sellingPrice: 0, gst: 18, warehouse: '', bin: '', subtotal: 0 }
    ]);
  };

  const handleRemoveCartItem = (idx) => {
    if (cartItems.length === 1) return;
    setCartItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCartProductChange = (idx, productId) => {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;

    if (prod.warehouse?._id || prod.warehouse) {
      const wId = prod.warehouse?._id || prod.warehouse;
      fetchBinsForWarehouse(wId);
      
      const bId = prod.bin?._id || prod.bin || '';
      if (bId) {
        fetchAvailableStock(productId, wId, bId, idx);
      }
    }

    setCartItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const basePrice = prod.sellingPrice || 0;
      const baseGst = prod.gst || 18;
      const qty = item.quantity;
      const sub = qty * basePrice * (1 + baseGst / 100);

      return {
        ...item,
        product: productId,
        sellingPrice: basePrice,
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

      // If key coordinates are set, fetch available stock level
      if (field === 'bin' || field === 'warehouse' || field === 'product') {
        const pId = field === 'product' ? val : updatedItem.product;
        const wId = field === 'warehouse' ? val : updatedItem.warehouse;
        const bId = field === 'bin' ? val : updatedItem.bin;
        fetchAvailableStock(pId, wId, bId, idx);
      }

      // Re-calculate subtotal
      const price = parseFloat(updatedItem.sellingPrice) || 0;
      const qty = parseInt(updatedItem.quantity) || 0;
      const gstVal = parseFloat(updatedItem.gst) || 0;
      updatedItem.subtotal = qty * price * (1 + gstVal / 100);

      return updatedItem;
    }));
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    setWizardError('');

    if (!selectedCustomer) return setWizardError('Please select a customer');

    // Validate cart
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      if (!item.product) return setWizardError(`Row ${i + 1}: Product selection is required`);
      if (item.quantity <= 0) return setWizardError(`Row ${i + 1}: Quantity must be greater than zero`);
      if (item.sellingPrice < 0) return setWizardError(`Row ${i + 1}: Price cannot be negative`);
      if (!item.warehouse || !item.bin) return setWizardError(`Row ${i + 1}: Source warehouse and bin are required`);

      // Verify stock level caches
      const cacheKey = `${item.product}-${item.warehouse}-${item.bin}`;
      const available = stockMap[cacheKey] || 0;
      if (item.quantity > available) {
        return setWizardError(`Row ${i + 1}: Insufficient stock. Requested: ${item.quantity}, Available: ${available}`);
      }
    }

    try {
      const payload = {
        customer: selectedCustomer,
        paymentStatus,
        notes,
        items: cartItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          gst: item.gst,
          warehouse: item.warehouse,
          bin: item.bin
        }))
      };

      const response = await customFetch.post('/sales', payload);
      if (response.data?.success) {
        setWizardOpen(false);
        fetchInitialData();
      }
    } catch (err) {
      setWizardError(err.friendlyMessage || 'Invoicing failed');
    }
  };

  const handleOpenDetail = async (s) => {
    try {
      const response = await customFetch.get(`/sales/${s._id}`);
      if (response.data?.success) {
        setDetailSale(response.data.data);
        setDetailItems(response.data.items);
        setDetailModalOpen(true);
      }
    } catch (err) {
      alert('Failed to fetch details');
    }
  };

  const handleDownloadPDF = (id) => {
    window.open(`http://localhost:5000/api/sales/${id}/pdf`, '_blank');
  };

  const grandTotal = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const canManage = hasPermission('manage_sales');

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
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Sales & Invoicing</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate tax invoices and deduct stock levels</p>
        </div>
        {canManage && (
          <button 
            onClick={handleOpenWizard}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-all shadow-md shadow-brand-500/10"
          >
            <Plus size={16} />
            <span>Generate Invoice</span>
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
          placeholder="Search sales by Invoice number or customer..."
        />
      </div>

      {/* Invoices list */}
      <div className="glass-panel bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/50 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Billing Date</th>
                <th className="px-6 py-4">Base Value</th>
                <th className="px-6 py-4">GST Tax</th>
                <th className="px-6 py-4">Grand Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm">
              {(() => {
                const filtered = sales.filter(s => 
                  s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (s.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
                );
                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-slate-400">No invoices matching search query.</td>
                    </tr>
                  );
                }
                return filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors text-slate-700 dark:text-slate-300">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900 dark:text-white">{s.invoiceNumber}</td>
                    <td className="px-6 py-4 font-semibold">{s.customer?.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(s.saleDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">INR {s.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">INR {s.gstAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 font-extrabold text-brand-600 dark:text-brand-400">INR {s.grandTotal.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${s.paymentStatus === 'Paid' ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-600'}`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button 
                        onClick={() => handleOpenDetail(s)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-500 inline-flex"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => handleDownloadPDF(s._id)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-850 inline-flex"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice wizard dialog modal */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <ScrollText size={20} className="text-brand-500" />
                <span>Create Invoice (Billing Sale)</span>
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

            <form onSubmit={handleSubmitSale} className="space-y-6">
              {/* Meta details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Customer Name</label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-none"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
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
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Sale Invoice Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                    placeholder="Invoice terms..."
                  />
                </div>
              </div>

              {/* Items Cart */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800/40">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Sale Invoice Cart</h4>
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
                  {cartItems.map((item, idx) => {
                    const cacheKey = `${item.product}-${item.warehouse}-${item.bin}`;
                    const availableStock = stockMap[cacheKey] || 0;
                    const stockExceeded = item.quantity > availableStock;

                    return (
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
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Source Warehouse</label>
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
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Source Bin</label>
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

                        {/* Selling Price */}
                        <div className="lg:col-span-1.5">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Price (INR)</label>
                          <input
                            type="number"
                            value={item.sellingPrice}
                            onChange={(e) => handleCartItemValueChange(idx, 'sellingPrice', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none"
                          />
                        </div>

                        {/* Qty */}
                        <div className="lg:col-span-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleCartItemValueChange(idx, 'quantity', e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none ${stockExceeded ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                          />
                        </div>

                        {/* Available Stock Indicator */}
                        <div className="lg:col-span-1.5 flex flex-col justify-end text-xs pb-2">
                          <span className="text-[9px] text-slate-400 uppercase block">Available Stock</span>
                          <span className={`font-bold font-mono ${stockExceeded ? 'text-rose-500 animate-pulse flex items-center space-x-1' : 'text-slate-500 dark:text-slate-400'}`}>
                            {stockExceeded && <AlertTriangle size={10} />}
                            <span>{availableStock} units</span>
                          </span>
                        </div>

                        {/* Subtotal & Delete */}
                        <div className="lg:col-span-1 flex items-center space-x-2 justify-end">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 uppercase block">Subtotal</span>
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
                    );
                  })}
                </div>
              </div>

              {/* Invoice footer */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-4 mt-6">
                <div>
                  <span className="text-xs text-slate-500">Total Invoice Value:</span>
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
                    <span>Create Invoice</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {detailModalOpen && detailSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5 border-b pb-3 border-slate-100 dark:border-slate-800/40">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">{detailSale.invoiceNumber}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Billing Customer: {detailSale.customer?.name}</p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Table items list (Col 2) */}
              <div className="md:col-span-2 space-y-4">
                <div className="border border-slate-100 dark:border-slate-800/40 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/40">
                        <th className="px-4 py-2">Item SKU / Name</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Qty</th>
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
                          <td className="px-4 py-3 text-right">INR {item.sellingPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-bold">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">INR {item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1.5 text-right border-t pt-3">
                  <div className="text-xs text-slate-500">Base Net Value: INR {detailSale.totalAmount.toFixed(2)}</div>
                  <div className="text-xs text-slate-500">GST Value: INR {detailSale.gstAmount.toFixed(2)}</div>
                  <div className="text-sm font-extrabold text-brand-600 dark:text-brand-400">Total Bill Value: INR {detailSale.grandTotal.toFixed(2)}</div>
                </div>

                {detailSale.notes && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/20 text-xs text-slate-500 rounded-xl border">
                    <strong>Invoice terms:</strong> {detailSale.notes}
                  </div>
                )}
              </div>

              {/* QR Code and printing operations (Col 1) */}
              <div className="flex flex-col items-center justify-between border-l border-slate-100 dark:border-slate-800/40 pl-4 py-2">
                <div className="text-center space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Invoice QR Authenticator</span>
                  {detailSale.qrCode ? (
                    <img src={detailSale.qrCode} className="w-32 h-32 border border-slate-100 rounded-xl p-1 bg-white" alt="QR" />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center border text-slate-400 rounded-xl">No QR</div>
                  )}
                  <span className="text-[9px] text-slate-400 max-w-[150px] block">Scan code using scanner or mobile phone to verify invoice details</span>
                </div>

                <button
                  onClick={() => handleDownloadPDF(detailSale._id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors mt-6 hover:bg-slate-700"
                >
                  <Download size={14} />
                  <span>Download Invoice PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
