import React, { useState, useEffect } from 'react';
import customFetch from '../services/customFetch';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, FileSpreadsheet, Calendar, Search } from 'lucide-react';

const Reports = () => {
  const { hasPermission } = useAuth();
  const [reportType, setReportType] = useState('sales'); // 'sales', 'purchases', 'inventory'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await customFetch.get(`/reports/${reportType}`, {
        params: { startDate, endDate }
      });
      if (response.data?.success) {
        setRecords(response.data.data);
        setSummary(response.data.summary);
      }
    } catch (err) {
      setError('Failed to compile report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateReport();
  }, [reportType]);

  const handleExportCSV = () => {
    const start = startDate ? `&startDate=${startDate}` : '';
    const end = endDate ? `&endDate=${endDate}` : '';
    window.open(`http://localhost:5000/api/reports/export/csv?type=${reportType}${start}${end}`, '_blank');
  };

  const handleExportPDF = () => {
    const start = startDate ? `&startDate=${startDate}` : '';
    const end = endDate ? `&endDate=${endDate}` : '';
    window.open(`http://localhost:5000/api/reports/export/pdf?type=${reportType}${start}${end}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">System Reports</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Generate executive audits and export to PDF/CSV</p>
      </div>

      {/* Filter panel */}
      <form onSubmit={handleGenerateReport} className="glass-panel p-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              setRecords([]);
              setSummary(null);
            }}
            className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="sales">Sales Invoice Report</option>
            <option value="purchases">Procurement Purchase Report</option>
            <option value="inventory">Inventory Stock Report</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-4 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
        >
          <Search size={16} />
          <span>{loading ? 'Compiling...' : 'Generate'}</span>
        </button>
      </form>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      {/* Summary dashboard values widgets */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reportType === 'sales' && (
            <>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Total Invoices</span>
                <strong className="text-xl font-bold">{summary.totalOrders} bills</strong>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Total GST Collected</span>
                <strong className="text-xl font-bold text-emerald-500">INR {summary.totalGST.toFixed(2)}</strong>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Grand Total Revenue</span>
                <strong className="text-xl font-extrabold text-brand-600 dark:text-brand-400">INR {summary.totalRevenue.toFixed(2)}</strong>
              </div>
            </>
          )}

          {reportType === 'purchases' && (
            <>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Total Purchase Orders</span>
                <strong className="text-xl font-bold">{summary.totalOrders} POs</strong>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Total Expenditure</span>
                <strong className="text-xl font-extrabold text-rose-500">INR {summary.totalExpense.toFixed(2)}</strong>
              </div>
            </>
          )}

          {reportType === 'inventory' && (
            <>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Total SKUs</span>
                <strong className="text-xl font-bold">{summary.totalSKUs} items</strong>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Total Stock Quantity</span>
                <strong className="text-xl font-bold">{summary.totalQuantity} units</strong>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Asset Inventory Valuation (Cost)</span>
                <strong className="text-xl font-extrabold text-brand-600 dark:text-brand-400 font-mono">INR {summary.totalCostValue.toFixed(2)}</strong>
              </div>
            </>
          )}
        </div>
      )}

      {/* Export actions and table content preview */}
      {records.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Report Preview</h3>
            <div className="flex space-x-3">
              <button 
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3.5 py-2 border rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <FileSpreadsheet size={14} className="text-emerald-500" />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center space-x-1.5 px-3.5 py-2 border rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <FileText size={14} className="text-rose-500" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          <div className="glass-panel bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-400 font-bold border-b">
                    {reportType === 'sales' && (
                      <>
                        <th className="px-6 py-3">Invoice Number</th>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">Billing Date</th>
                        <th className="px-6 py-3 text-right">Tax Value</th>
                        <th className="px-6 py-3 text-right">Invoice Total</th>
                      </>
                    )}
                    {reportType === 'purchases' && (
                      <>
                        <th className="px-6 py-3">PO Number</th>
                        <th className="px-6 py-3">Supplier</th>
                        <th className="px-6 py-3">Order Date</th>
                        <th className="px-6 py-3 text-right">Total Expenditure</th>
                      </>
                    )}
                    {reportType === 'inventory' && (
                      <>
                        <th className="px-6 py-3">SKU</th>
                        <th className="px-6 py-3">Product Name</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3 text-right">Cost Price</th>
                        <th className="px-6 py-3 text-right">Qty</th>
                        <th className="px-6 py-3 text-right">Valuation (Cost)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-slate-700 dark:text-slate-300">
                  {records.map((r, idx) => (
                    <tr key={idx}>
                      {reportType === 'sales' && (
                        <>
                          <td className="px-6 py-4 font-mono font-bold">{r.invoiceNumber}</td>
                          <td className="px-6 py-4">{r.customer?.name}</td>
                          <td className="px-6 py-4">{new Date(r.saleDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">INR {r.gstAmount.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-extrabold text-brand-600 dark:text-brand-400">INR {r.grandTotal.toFixed(2)}</td>
                        </>
                      )}
                      {reportType === 'purchases' && (
                        <>
                          <td className="px-6 py-4 font-mono font-bold">{r.purchaseNumber}</td>
                          <td className="px-6 py-4">{r.supplier?.company || r.supplier?.name}</td>
                          <td className="px-6 py-4">{new Date(r.purchaseDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right font-extrabold text-rose-500">INR {r.totalAmount.toFixed(2)}</td>
                        </>
                      )}
                      {reportType === 'inventory' && (
                        <>
                          <td className="px-6 py-4 font-mono font-bold text-xs">{r.sku}</td>
                          <td className="px-6 py-4 font-semibold">{r.name}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">{r.category?.name}</td>
                          <td className="px-6 py-4 text-right">INR {r.costPrice.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">{r.quantity} units</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">INR {(r.quantity * r.costPrice).toFixed(2)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
