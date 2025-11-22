import React from 'react';

const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-red-600 border-4 border-red-700 p-5 mb-6 rounded-xl shadow-lg">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <svg className="h-8 w-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-2xl font-black text-white uppercase tracking-wide">
            Emergency Help Available
          </h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <a href="tel:911" className="block p-4 bg-white rounded-lg hover:bg-red-50 transition-all duration-300 shadow-md hover:shadow-xl active:scale-95">
            <div className="text-3xl font-black text-red-600">🚨 911</div>
            <div className="text-sm font-bold text-red-900 mt-2">Life Threatening Emergency</div>
          </a>
          <a href="tel:988" className="block p-4 bg-white rounded-lg hover:bg-red-50 transition-all duration-300 shadow-md hover:shadow-xl active:scale-95">
            <div className="text-3xl font-black text-red-600">📞 988</div>
            <div className="text-sm font-bold text-red-900 mt-2">Suicide Crisis Helpline (24/7)</div>
          </a>
          <a href="tel:18665312600" className="block p-4 bg-white rounded-lg hover:bg-red-50 transition-all duration-300 shadow-md hover:shadow-xl active:scale-95">
            <div className="text-2xl font-black text-red-600">📞 1-866-531-2600</div>
            <div className="text-sm font-bold text-red-900 mt-2">Mental Health & Addiction</div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmergencyBanner;