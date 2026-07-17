import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, Box, Tags, Warehouse, ScrollText, 
  ArrowLeftRight, FileBarChart2, Settings, History, 
  Menu, X, Sun, Moon, LogOut, Users, UserCheck, BarChart3, ShoppingCart, Layers
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', permission: null },
    { name: 'Products', icon: Box, path: '/products', permission: 'view_products' },
    { name: 'Inventory Balances', icon: Layers, path: '/inventory', permission: 'view_products' },
    { name: 'Categories', icon: Tags, path: '/categories', permission: 'view_categories' },
    { name: 'Warehouses', icon: Warehouse, path: '/warehouses', permission: 'view_warehouses' },
    { name: 'Purchases', icon: ShoppingCart, path: '/purchases', permission: 'view_purchases' },
    { name: 'Sales & Invoices', icon: ScrollText, path: '/sales', permission: 'view_sales' },
    { name: 'Stock Transfers', icon: ArrowLeftRight, path: '/transfers', permission: 'view_transfers' },
    { name: 'Reports', icon: FileBarChart2, path: '/reports', permission: 'view_reports' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics', permission: 'view_reports' },
    { name: 'Suppliers', icon: Users, path: '/suppliers', permission: 'view_suppliers' },
    { name: 'Customers', icon: UserCheck, path: '/customers', permission: 'view_customers' },
    { name: 'Settings', icon: Settings, path: '/settings', permission: 'manage_settings' },
    { name: 'Activity Logs', icon: History, path: '/logs', permission: 'view_logs' },
  ];

  const activeClass = "bg-[#8c7a6b] dark:bg-brand-500 text-white shadow-lg shadow-brand-500/10";
  const inactiveClass = "text-stone-700 dark:text-slate-400 hover:bg-[#ded6c9] dark:hover:bg-slate-800/60 hover:text-stone-900 dark:hover:text-white";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-20 flex flex-col w-64 bg-[#eae4d9] dark:bg-slate-950 border-r border-[#c8bdae] dark:border-slate-800 transform transition-transform duration-300 md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#c8bdae] dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8c7a6b] to-[#b09e8f] dark:from-brand-500 dark:to-indigo-400 flex items-center justify-center text-white font-extrabold text-lg">
              I
            </div>
            <span className="font-extrabold text-xl tracking-tight text-stone-900 dark:text-white">
              InventoryFlow
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => {
            if (item.permission && !hasPermission(item.permission)) return null;
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${isActive ? activeClass : inactiveClass}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#c8bdae] dark:border-slate-800 bg-[#ded6c9]/40 dark:bg-slate-950/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-stone-900 dark:text-slate-200 truncate">{user?.name}</span>
              <span className="text-xs text-stone-600 dark:text-slate-400 truncate">{user?.role}</span>
            </div>
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-lg bg-[#ded6c9] dark:bg-slate-800 border border-[#c8bdae] dark:border-slate-700 text-stone-700 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl border border-[#c8bdae] dark:border-rose-900/30 text-stone-700 dark:text-rose-400 hover:bg-[#ded6c9]/50 dark:hover:bg-rose-950/20 font-medium text-sm transition-all"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-800/30">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 dark:text-slate-300">
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">
              {location.pathname === '/' ? 'Dashboard Overview' : location.pathname.substring(1).replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs px-2.5 py-1 rounded-full font-semibold border border-brand-200/50 dark:border-brand-900/30 bg-brand-50/50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 uppercase">
              {user?.role} Mode
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-50/40 dark:bg-slate-950/30 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
