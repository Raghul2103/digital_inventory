import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
      <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 mb-6">
        <ShieldAlert size={64} />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">404 - Page Not Found</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
        The page you are looking for does not exist or you do not have permission to view it.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-lg shadow-brand-500/20 transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
