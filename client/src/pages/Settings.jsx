import React, { useEffect, useState } from 'react';
import customFetch from '../services/customFetch';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, Save, Image, Check } from 'lucide-react';

const Settings = () => {
  const { hasPermission } = useAuth();
  const { changeTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyGST, setCompanyGST] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [themeSetting, setThemeSetting] = useState('light');
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const fetchSettings = async () => {
    try {
      const response = await customFetch.get('/settings');
      if (response.data?.success) {
        const s = response.data.data;
        setCompanyName(s.companyName);
        setCompanyAddress(s.companyAddress || '');
        setCompanyPhone(s.companyPhone || '');
        setCompanyEmail(s.companyEmail || '');
        setCompanyGST(s.companyGST || '');
        setCurrency(s.currency);
        setThemeSetting(s.theme);
        changeTheme(s.theme);
        if (s.companyLogo) {
          setLogoPreview(`http://localhost:5000${s.companyLogo}`);
        }
      }
    } catch (err) {
      setError('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    const formData = new FormData();
    formData.append('companyName', companyName);
    formData.append('companyAddress', companyAddress);
    formData.append('companyPhone', companyPhone);
    formData.append('companyEmail', companyEmail);
    formData.append('companyGST', companyGST);
    formData.append('currency', currency);
    formData.append('theme', themeSetting);
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      const response = await customFetch.put('/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data?.success) {
        setSuccess('System configurations saved successfully!');
        changeTheme(themeSetting);
        fetchSettings();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to save configurations');
    }
  };

  const canManage = hasPermission('manage_settings');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-sans">System Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure company metadata and document parameters</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl border border-emerald-200">
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="glass-panel p-6 bg-white dark:bg-slate-900 border rounded-2xl space-y-6">
        {/* Logo and metadata header */}
        <div className="flex items-center space-x-6 border-b pb-6 border-slate-100 dark:border-slate-800/40">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-950 border overflow-hidden relative group">
            {logoPreview ? (
              <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400"><Image size={28} /></div>
            )}
            
            {canManage && (
              <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span>Upload logo</span>
                <input type="file" onChange={handleLogoChange} accept="image/*" className="hidden" />
              </label>
            )}
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Company Branding Logo</h3>
            <p className="text-xs text-slate-500 max-w-[300px] mt-1">This logo will print automatically at the top of invoice PDFs.</p>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Company Registered Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={!canManage}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
              placeholder="e.g. Acme Corp Ltd"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">GSTIN Tax Registration Code</label>
            <input
              type="text"
              value={companyGST}
              onChange={(e) => setCompanyGST(e.target.value)}
              disabled={!canManage}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none font-mono"
              placeholder="e.g. 29AAAAA0000A1Z5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Official Email</label>
            <input
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              disabled={!canManage}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
              placeholder="contact@acme.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Customer Hotline phone</label>
            <input
              type="text"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              disabled={!canManage}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none"
              placeholder="+91 9999999999"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Full Address</label>
          <textarea
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            disabled={!canManage}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none min-h-[80px]"
            placeholder="Official company office address..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Local Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={!canManage}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-none"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Theme Preference</label>
            <select
              value={themeSetting}
              onChange={(e) => {
                const val = e.target.value;
                setThemeSetting(val);
                changeTheme(val);
              }}
              disabled={!canManage}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-none"
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>
        </div>

        {canManage && (
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="py-3 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Save size={16} />
              <span>Save Configurations</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
