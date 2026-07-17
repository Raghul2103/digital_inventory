import React, { useEffect, useState } from 'react';
import customFetch from '../services/customFetch';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, LineChart } from 'lucide-react';

const COLORS = ['#5376ff', '#85a4ff', '#3350eb', '#c7d2fe', '#818cf8', '#6366f1'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await customFetch.get('/dashboard');
        if (response.data && response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        setError('Failed to fetch analytics datasets');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
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
      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl border border-rose-200">
        {error}
      </div>
    );
  }

  const { salesTrend, categoryDistribution, summary } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Business Intelligence</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Perform statistical analytics on warehouse flow metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales trend Area chart */}
        <div className="glass-panel p-5 bg-white dark:bg-slate-900 border rounded-2xl">
          <div className="flex items-center space-x-2.5 mb-5 border-b pb-3">
            <TrendingUp size={20} className="text-brand-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Revenue Stream Trend</h3>
          </div>
          <div className="h-64">
            {salesTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No Sales Volume Recorded</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="colorSalesVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3350eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3350eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Sales" stroke="#3350eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSalesVal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sales vs Purchases comparison bar chart */}
        <div className="glass-panel p-5 bg-white dark:bg-slate-900 border rounded-2xl">
          <div className="flex items-center space-x-2.5 mb-5 border-b pb-3">
            <BarChart3 size={20} className="text-brand-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Sales vs Procurement</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Summary Cumulative', Sales: summary.totalSalesAmount, Purchases: summary.totalPurchasesAmount }
                ]}
              >
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Sales" fill="#5376ff" radius={[10, 10, 0, 0]} />
                <Bar dataKey="Purchases" fill="#f59e0b" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories count donut chart */}
        <div className="glass-panel p-5 bg-white dark:bg-slate-900 border rounded-2xl">
          <div className="flex items-center space-x-2.5 mb-5 border-b pb-3">
            <PieIcon size={20} className="text-brand-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Stock Division Allocation</h3>
          </div>
          <div className="h-64 flex justify-center">
            {categoryDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No categories mapped</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* General stock trends indicator summary */}
        <div className="glass-panel p-5 bg-white dark:bg-slate-900 border rounded-2xl flex flex-col justify-between">
          <div className="flex items-center space-x-2.5 mb-5 border-b pb-3">
            <LineChart size={20} className="text-brand-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">BI Flow Indicators</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Total Sales Turnover</span>
              <strong className="text-base text-emerald-500">INR {summary.totalSalesAmount.toFixed(2)}</strong>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Total Procurement Expenditure</span>
              <strong className="text-base text-rose-500">INR {summary.totalPurchasesAmount.toFixed(2)}</strong>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Low Stock Warning Thresholds</span>
              <strong className="text-base text-slate-800 dark:text-slate-200">{summary.lowStockProductsCount} alerts active</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
