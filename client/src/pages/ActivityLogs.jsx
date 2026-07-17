import React, { useEffect, useState } from 'react';
import customFetch from '../services/customFetch';
import { useAuth } from '../context/AuthContext';
import { History, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const ActivityLogs = () => {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [userQuery, setUserQuery] = useState('');
  const [moduleQuery, setModuleQuery] = useState('');
  const [actionQuery, setActionQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await customFetch.get('/logs', {
        params: {
          page,
          limit: 15,
          module: moduleQuery,
          action: actionQuery,
          startDate,
          endDate
        }
      });
      if (response.data?.success) {
        setLogs(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalLogs(response.data.totalLogs);
      }
    } catch (err) {
      setError('Failed to fetch activity audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, moduleQuery, actionQuery, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <History className="text-brand-500" />
          <span>Security Audit & Activity Logs</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">View chronological audit trail of all transactions and catalog modifications</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      {/* Filters panel */}
      <div className="glass-panel p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[150px]">
          <input
            type="text"
            value={actionQuery}
            onChange={(e) => { setActionQuery(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
            placeholder="Search action keyword..."
          />
        </div>

        <select
          value={moduleQuery}
          onChange={(e) => { setModuleQuery(e.target.value); setPage(1); }}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Modules</option>
          <option value="Authentication">Authentication</option>
          <option value="Products">Products</option>
          <option value="Categories">Categories</option>
          <option value="Warehouses">Warehouses</option>
          <option value="Bins">Bins</option>
          <option value="Purchases">Purchases</option>
          <option value="Sales">Sales</option>
          <option value="Transfers">Transfers</option>
          <option value="Settings">Settings</option>
        </select>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
          />
          <span className="text-slate-400">To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-900 border rounded-2xl text-slate-400">No logs found matching criteria.</div>
      ) : (
        <div className="space-y-4">
          <div className="glass-panel bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/40">
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Module</th>
                    <th className="px-6 py-3.5">Details</th>
                    <th className="px-6 py-3.5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-slate-700 dark:text-slate-300">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-3 text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">
                        {log.user ? (
                          <div>
                            <span>{log.user.name}</span>
                            <span className="block text-[9px] text-slate-400 font-normal">{log.user.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">System / Guest</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded font-bold border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 uppercase tracking-wider text-[9px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-bold text-brand-600 dark:text-brand-400">{log.module}</td>
                      <td className="px-6 py-3 max-w-sm truncate">{log.details}</td>
                      <td className="px-6 py-3 font-mono text-slate-400">{log.ipAddress || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination bar */}
          <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/40 pt-4 mt-6">
            <span className="text-xs text-slate-500">Total: {totalLogs} logs</span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page === 1}
                className="p-2 border hover:bg-slate-50 rounded-lg disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
                disabled={page === totalPages}
                className="p-2 border hover:bg-slate-50 rounded-lg disabled:opacity-40 transition-colors"
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

export default ActivityLogs;
