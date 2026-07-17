import React, { useEffect, useState, useRef } from 'react';
import customFetch from '../services/customFetch';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit2, Trash2, Search, Filter, 
  ChevronLeft, ChevronRight, Upload, Download, 
  Barcode, Printer, Eye, X, Check, RefreshCcw, Camera 
} from 'lucide-react';

const Products = () => {
  const { hasPermission } = useAuth();
  
  // Lists & Lookups
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Form State (Modal)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [gst, setGst] = useState('18');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [warehouse, setWarehouse] = useState('');
  const [bin, setBin] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formError, setFormError] = useState('');

  // Detail Modal State
  const [detailProduct, setDetailProduct] = useState(null);
  const [stockLevels, setStockLevels] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Barcode Printing State
  const [printProduct, setPrintProduct] = useState(null);
  
  // Barcode Scanning Simulator State
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');

  // CSV Import State
  const [csvFile, setCsvFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await customFetch.get(`/products`, {
        params: {
          page,
          limit: 8,
          search,
          category: categoryFilter,
          warehouse: warehouseFilter,
          status: statusFilter
        }
      });
      if (response.data && response.data.success) {
        setProducts(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalProducts(response.data.totalProducts);
      }
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [catsRes, whsRes] = await Promise.all([
        customFetch.get('/categories'),
        customFetch.get('/warehouses')
      ]);
      if (catsRes.data?.success) setCategories(catsRes.data.data);
      if (whsRes.data?.success) setWarehouses(whsRes.data.data);
    } catch (err) {
      console.error('Failed to load filters', err);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, search, categoryFilter, warehouseFilter, statusFilter]);

  // Fetch bins when warehouse is selected inside form
  useEffect(() => {
    if (!warehouse) {
      setBins([]);
      setBin('');
      return;
    }
    const fetchBins = async () => {
      try {
        const response = await customFetch.get(`/warehouses/bins?warehouse=${warehouse}`);
        if (response.data?.success) setBins(response.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBins();
  }, [warehouse]);

  // SKU & Barcode automatic generation
  const handleAutoGenerateSKU = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const prefix = brand.trim() ? brand.trim().substring(0, 3).toUpperCase() : 'INV';
    setSku(`${prefix}-${randomDigits}`);
  };

  const handleAutoGenerateBarcode = () => {
    // Generate simple 12 digit UPC mock barcode
    const randomDigits = Math.floor(100000000000 + Math.random() * 900000000000);
    setBarcode(randomDigits.toString());
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setSku('');
    setBarcode('');
    setName('');
    setBrand('');
    setCategory('');
    setCostPrice('');
    setSellingPrice('');
    setGst('18');
    setReorderLevel('10');
    setWarehouse('');
    setBin('');
    setImageFile(null);
    setImagePreview('');
    setFormStatus('Active');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p._id);
    setSku(p.sku);
    setBarcode(p.barcode);
    setName(p.name);
    setBrand(p.brand);
    setCategory(p.category?._id || p.category);
    setCostPrice(p.costPrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setGst(p.gst.toString());
    setReorderLevel(p.reorderLevel.toString());
    setWarehouse(p.warehouse?._id || p.warehouse || '');
    setBin(p.bin?._id || p.bin || '');
    setImagePreview(p.image ? `http://localhost:5000${p.image}` : '');
    setImageFile(null);
    setFormStatus(p.status);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenDetail = async (p) => {
    try {
      const response = await customFetch.get(`/products/${p._id}`);
      if (response.data?.success) {
        setDetailProduct(response.data.data);
        setStockLevels(response.data.stockLevels);
        setDetailModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load product details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!sku.trim()) return setFormError('SKU is required');
    if (!barcode.trim()) return setFormError('Barcode is required');
    if (!name.trim()) return setFormError('Product Name is required');
    if (!brand.trim()) return setFormError('Brand name is required');
    if (!category) return setFormError('Category is required');
    if (!costPrice) return setFormError('Cost Price is required');
    if (!sellingPrice) return setFormError('Selling Price is required');

    try {
      const formData = new FormData();
      formData.append('sku', sku);
      formData.append('barcode', barcode);
      formData.append('name', name);
      formData.append('brand', brand);
      formData.append('category', category);
      formData.append('costPrice', parseFloat(costPrice));
      formData.append('sellingPrice', parseFloat(sellingPrice));
      formData.append('gst', parseFloat(gst));
      formData.append('reorderLevel', parseFloat(reorderLevel));
      formData.append('status', formStatus);
      if (warehouse) formData.append('warehouse', warehouse);
      if (bin) formData.append('bin', bin);
      if (imageFile) formData.append('image', imageFile);

      let response;
      if (editingId) {
        response = await customFetch.put(`/products/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await customFetch.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data?.success) {
        setModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      setFormError(err.friendlyMessage || 'Product transaction failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This will clear related stock levels!')) return;
    try {
      const response = await customFetch.delete(`/products/${id}`);
      if (response.data?.success) {
        fetchProducts();
      }
    } catch (err) {
      alert(err.friendlyMessage || 'Delete failed');
    }
  };

  // Image Upload Preview Helper
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Barcode scanning search simulator
  const handleBarcodeScanSearch = async (e) => {
    e.preventDefault();
    setScanError('');
    if (!scanInput.trim()) return;

    try {
      const response = await customFetch.get(`/products/barcode/${scanInput}`);
      if (response.data?.success) {
        setScanModalOpen(false);
        setScanInput('');
        handleOpenDetail(response.data.data);
      }
    } catch (err) {
      setScanError(err.friendlyMessage || 'No matching product found with barcode.');
    }
  };

  // CSV Import Trigger
  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportStatus('Processing CSV import...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await customFetch.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data?.success) {
        setImportStatus(`Success! Products processed successfully.`);
        fetchProducts();
        setTimeout(() => setImportStatus(''), 4000);
      }
    } catch (err) {
      setImportStatus(`Error: ${err.friendlyMessage}`);
    }
  };

  const handleCSVExport = () => {
    window.open('http://localhost:5000/api/products/export', '_blank');
  };

  const canManage = hasPermission('manage_products');

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Product Catalogue</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Add SKUs, monitor barcode labels, and audit levels</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setScanModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Camera size={16} />
            <span>Scan Barcode</span>
          </button>
          {canManage && (
            <>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="flex items-center space-x-2 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Upload size={16} />
                <span>Import CSV</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCSVImport} 
                accept=".csv" 
                className="hidden" 
              />
              <button 
                onClick={handleCSVExport}
                className="flex items-center space-x-2 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Download size={16} />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={handleOpenCreate}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-all shadow-md shadow-brand-500/10"
              >
                <Plus size={16} />
                <span>Create Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {importStatus && (
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 text-blue-600 text-sm font-semibold">
          {importStatus}
        </div>
      )}

      {/* Filter panel */}
      <div className="glass-panel p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white"
            placeholder="Search SKU, Name, Barcode, Brand..."
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <select
          value={warehouseFilter}
          onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-900 border rounded-2xl text-slate-400">No products match search criteria.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const isLowStock = p.quantity <= p.reorderLevel;
              return (
                <div key={p._id} className="glass-panel p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between h-[360px] group relative hover:shadow-xl transition-all">
                  
                  {/* Image & Header block */}
                  <div className="space-y-3">
                    <div className="w-full h-36 rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden relative border border-slate-200/30">
                      {p.image ? (
                        <img 
                          src={`http://localhost:5000${p.image}`} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Barcode size={36} />
                        </div>
                      )}
                      
                      {isLowStock && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                          Low Stock
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        <span>SKU: {p.sku}</span>
                        <span>{p.brand}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-white mt-1 group-hover:text-brand-500 transition-colors truncate">{p.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{p.category?.name || 'General'}</p>
                    </div>
                  </div>

                  {/* Stock Qty & Pricing */}
                  <div className="border-t border-slate-100 dark:border-slate-800/40 pt-3 mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Quantity</span>
                      <strong className={`text-base font-extrabold ${isLowStock ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {p.quantity} units
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Price</span>
                      <strong className="text-base font-extrabold text-brand-600 dark:text-brand-400">
                        INR {p.sellingPrice.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Action overlays */}
                  <div className="flex items-center justify-between mt-4">
                    <button 
                      onClick={() => handleOpenDetail(p)}
                      className="text-xs text-brand-500 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <Eye size={12} />
                      <span>View details</span>
                    </button>
                    {canManage && (
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 rounded-lg hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => setPrintProduct(p)}
                          className="p-2 rounded-lg hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Printer size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p._id)}
                          className="p-2 rounded-lg hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination bar */}
          <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/40 pt-4 mt-6">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total: {totalProducts} SKUs</span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page === 1}
                className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
                disabled={page === totalPages}
                className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Product Parameters' : 'Create Product Entry'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Product Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                    placeholder="e.g. DDR4 8GB RAM, SSD 1TB"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Brand / Manufacturer</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                    placeholder="e.g. Corsair, Kingston"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">SKU Code</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none font-mono"
                      placeholder="e.g. CR-8GB-509"
                    />
                    <button 
                      type="button"
                      onClick={handleAutoGenerateSKU}
                      className="px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all inline-flex items-center"
                    >
                      <RefreshCcw size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Barcode UPC/EAN</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none font-mono"
                      placeholder="UPC digits barcode"
                    />
                    <button 
                      type="button"
                      onClick={handleAutoGenerateBarcode}
                      className="px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all inline-flex items-center"
                    >
                      <RefreshCcw size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-none"
                  >
                    <option value="">Select Division</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Cost Price (INR)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Selling Price (INR)</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                    placeholder="80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">GST Percentage</label>
                  <select
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-none"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Reorder Level Alert</label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Initial Warehouses setup options - Only shown on Product creation */}
              {!editingId && (
                <div className="p-4 rounded-2xl border border-brand-100 bg-brand-50/20 dark:border-brand-950/20 dark:bg-brand-950/5 space-y-4">
                  <h4 className="text-xs font-extrabold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Initial Warehouse Placement</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Warehouse</label>
                      <select
                        value={warehouse}
                        onChange={(e) => setWarehouse(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
                      >
                        <option value="">Select Storage space</option>
                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Bin</label>
                      <select
                        value={bin}
                        onChange={(e) => setBin(e.target.value)}
                        disabled={!warehouse}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Select Bin placement</option>
                        {bins.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Product Image</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                  />
                  {imagePreview && (
                    <div className="w-16 h-16 rounded-xl border overflow-hidden bg-slate-100">
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all"
                >
                  <Check size={16} />
                  <span>{editingId ? 'Save Changes' : 'Create Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanning Simulator Modal */}
      {scanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Barcode size={22} className="text-brand-500" />
                <span>Scan Barcode (Simulator)</span>
              </h3>
              <button onClick={() => setScanModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {scanError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold">
                {scanError}
              </div>
            )}

            <form onSubmit={handleBarcodeScanSearch} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simulate a barcode hardware scanner swipe by typing or pasting the UPC digits below.
              </p>
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none font-mono text-center text-lg tracking-widest"
                placeholder="e.g. 123456789012"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-all"
              >
                Scan Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Print Barcode Label Dialog */}
      {printProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl text-center">
            <div className="flex items-center justify-between mb-5 text-left">
              <h3 className="text-md font-bold text-slate-900 dark:text-white">Print Barcode Label</h3>
              <button onClick={() => setPrintProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Label block inside print borders */}
            <div className="p-6 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 rounded-2xl flex flex-col items-center justify-center mb-6">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{printProduct.name}</h4>
              <p className="text-[10px] text-slate-400 font-mono">SKU: {printProduct.sku}</p>
              
              {/* Simulated Code-128 Barcode lines */}
              <div className="my-4 h-12 w-48 flex items-center space-x-[1.5px] bg-white p-2 rounded border border-slate-200/50">
                <div className="h-full bg-slate-900 flex-1 w-[2px]"></div>
                <div className="h-full bg-slate-900 flex-1 w-[1px]"></div>
                <div className="h-full bg-slate-900 flex-1 w-[3px]"></div>
                <div className="h-full bg-slate-900 flex-1 w-[1px]"></div>
                <div className="h-full bg-slate-900 flex-1 w-[2px]"></div>
                <div className="h-full bg-slate-900 flex-1 w-[4px]"></div>
                <div className="h-full bg-slate-900 flex-1 w-[1px]"></div>
                <div className="h-full bg-slate-900 flex-1 w-[2px]"></div>
                <div className="h-full bg-slate-900 flex-1 w-[1px]"></div>
                <div className="h-full bg-slate-900 flex-1 w-[3px]"></div>
                <div className="h-full bg-slate-900 flex-1 w-[1px]"></div>
              </div>
              
              <span className="text-xs font-mono tracking-widest font-semibold text-slate-700 dark:text-slate-300">
                {printProduct.barcode}
              </span>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setPrintProduct(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-1.5 transition-all"
              >
                <Printer size={16} />
                <span>Print Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Product info dialog */}
      {detailModalOpen && detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Product Full Metrics</h3>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex space-x-4">
                <div className="w-24 h-24 rounded-xl border border-slate-200/40 overflow-hidden bg-slate-100">
                  {detailProduct.image ? (
                    <img src={`http://localhost:5000${detailProduct.image}`} className="w-full h-full object-cover" alt="Detail" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><Barcode size={32} /></div>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">{detailProduct.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">Brand: {detailProduct.brand} | Category: {detailProduct.category?.name || 'General'}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">Barcode: {detailProduct.barcode}</p>
                </div>
              </div>

              {/* pricing table */}
              <div className="grid grid-cols-3 gap-3 border-t border-b border-slate-100 dark:border-slate-800/40 py-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cost Price</span>
                  <strong className="text-sm font-extrabold text-slate-800 dark:text-slate-200">INR {detailProduct.costPrice.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Selling Price</span>
                  <strong className="text-sm font-extrabold text-brand-600 dark:text-brand-400">INR {detailProduct.sellingPrice.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">GST Tax Rate</span>
                  <strong className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{detailProduct.gst}%</strong>
                </div>
              </div>

              {/* Warehouse stocks status breakdowns */}
              <div>
                <h5 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Warehouse Stock Allocation</h5>
                <div className="space-y-2">
                  {stockLevels.length === 0 ? (
                    <div className="text-center py-4 bg-slate-50 dark:bg-slate-950/20 text-slate-400 text-xs rounded-xl">No stocks allocated to warehouses yet. Placed in draft.</div>
                  ) : (
                    stockLevels.map((lvl) => (
                      <div key={lvl._id} className="p-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl flex items-center justify-between text-sm">
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200">{lvl.warehouse?.name}</strong>
                          <p className="text-xs text-slate-400">Bin: {lvl.bin?.name || 'Unassigned'}</p>
                        </div>
                        <span className="font-extrabold text-brand-600 dark:text-brand-400 text-base">{lvl.quantity} units</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
