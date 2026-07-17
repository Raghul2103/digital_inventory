import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import customFetch from '../services/customFetch';
import { 
  TrendingUp, ShoppingCart, UserCheck, Package, 
  AlertTriangle, CreditCard, DollarSign, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#5376ff', '#85a4ff', '#3350eb', '#c7d2fe', '#818cf8', '#6366f1'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await customFetch.get('/dashboard');
        if (response.data && response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        setError('Failed to fetch dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl border border-rose-200">
        {error || 'Error loading dashboard data'}
      </div>
    );
  }

  const { summary, recentLogs, lowStockList, salesTrend, categoryDistribution } = data;

  const cardStats = [
    { name: 'Total Products', val: summary.totalProducts, icon: Package, color: 'from-blue-500 to-sky-400' },
    { name: 'Total Customers', val: summary.totalCustomers, icon: UserCheck, color: 'from-emerald-500 to-teal-400' },
    { name: 'Total Sales Revenue', val: `INR ${summary.totalSalesAmount.toFixed(2)}`, icon: DollarSign, color: 'from-brand-600 to-indigo-500' },
    { name: 'Total Purchases Value', val: `INR ${summary.totalPurchasesAmount.toFixed(2)}`, icon: ShoppingCart, color: 'from-amber-500 to-orange-400' },
    { name: "Today's Sales", val: `INR ${summary.todaySalesAmount.toFixed(2)}`, icon: Calendar, color: 'from-purple-500 to-fuchsia-400' },
    { name: 'Monthly Revenue', val: `INR ${summary.monthlySalesAmount.toFixed(2)}`, icon: TrendingUp, color: 'from-pink-500 to-rose-400' },
    { name: 'Low Stock Alerts', val: summary.lowStockProductsCount, icon: AlertTriangle, color: 'from-rose-500 to-red-400', badge: summary.lowStockProductsCount > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="relative glass-panel rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between overflow-hidden group hover:scale-[1.01] transition-all">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.name}</span>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate max-w-[200px]">{stat.val}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                <Icon size={20} />
              </div>
              {stat.badge && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales trend Area chart */}
        <div className="lg:col-span-2 glass-panel p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-5">Monthly Sales Volume</h3>
          <div className="h-64">
            {salesTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No Sales Transactions Available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5376ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#5376ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="Sales" stroke="#5376ff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories breakdown donut chart */}
        <div className="glass-panel p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3">Product Categories</h3>
          <div className="flex-1 min-h-[220px]">
            {categoryDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No Categories Registered</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" fontSize={11} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock & Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Listing */}
        <div className="glass-panel p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Low Stock Products</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500">Action Required</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                  <th className="pb-3">SKU</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3 text-right">Available Qty</th>
                  <th className="pb-3 text-right">Reorder Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm">
                {lowStockList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400">All products have sufficient stock level</td>
                  </tr>
                ) : (
                  lowStockList.map((product) => (
                    <tr key={product._id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 font-mono font-medium text-xs">{product.sku}</td>
                      <td className="py-3 font-semibold">{product.name}</td>
                      <td className="py-3 text-right font-bold text-rose-500">{product.quantity}</td>
                      <td className="py-3 text-right font-medium text-slate-400">{product.reorderLevel}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent logs audit activity */}
        <div className="glass-panel p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Recent System Logs</h3>
          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">No activity recorded yet</div>
            ) : (
              recentLogs.map((log) => (
                <div key={log._id} className="flex items-start space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      <span className="font-bold text-slate-900 dark:text-white">{log.user ? log.user.name : 'System'}</span>{' '}
                      {log.action} in <span className="font-bold text-brand-600 dark:text-brand-400">{log.module}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
