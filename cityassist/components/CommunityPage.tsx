import React, { useState } from 'react';

const CommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'updates' | 'share'>('updates');

  const communityUpdates = [
    {
      location: 'Daily Bread Food Bank',
      status: 'Short line',
      reporter: '3 people',
      time: '15 mins ago',
      type: 'positive'
    },
    {
      location: 'Good Shepherd Shelter',
      status: 'Full capacity',
      reporter: '2 people',
      time: '1 hour ago',
      type: 'warning'
    },
    {
      location: 'Free Legal Clinic',
      status: 'Walk-ins available',
      reporter: '1 person',
      time: '2 hours ago',
      type: 'positive'
    },
    {
      location: 'North York Community Centre',
      status: 'Hot meals until 6pm',
      reporter: '5 people',
      time: '3 hours ago',
      type: 'info'
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-50 via-white to-purple-50 overflow-y-auto">

      <div className="w-full max-w-4xl mx-auto px-6 py-8">
        
        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-3">
            Real-time updates from real people.
          </h2>
          <p className="text-lg text-gray-600">
            Help others by sharing what you know. See what's happening right now.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-indigo-50 p-1 rounded-xl border border-indigo-100">
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ease-out ${
              activeTab === 'updates'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Live Updates
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ease-out ${
              activeTab === 'share'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Share Info
          </button>
        </div>

        {/* Updates Tab */}
        {activeTab === 'updates' && (
          <div className="space-y-4">
            {communityUpdates.map((update, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border-2 ${
                  update.type === 'positive'
                    ? 'bg-green-50 border-green-200'
                    : update.type === 'warning'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{update.location}</h3>
                  <span className="text-xs text-gray-500">{update.time}</span>
                </div>
                <p className={`text-lg mb-2 ${
                  update.type === 'positive'
                    ? 'text-green-900'
                    : update.type === 'warning'
                    ? 'text-orange-900'
                    : 'text-blue-900'
                }`}>
                  {update.status}
                </p>
                <p className="text-sm text-gray-600">
                  Reported by {update.reporter}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Share Tab */}
        {activeTab === 'share' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Share what you know
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Which location?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Daily Bread Food Bank"
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What's the update?
                  </label>
                  <textarea
                    placeholder="e.g., Short line today, walk-ins welcome"
                    rows={3}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button className="w-full py-4 bg-indigo-500 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-medium transition-all duration-200 ease-out hover:shadow-md active:scale-95">
                  Share update
                </button>
              </div>
            </div>

            <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
              <div className="flex gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h4 className="font-semibold text-purple-900 mb-1">Your updates help everyone</h4>
                  <p className="text-sm text-purple-800">
                    Share real-time info about wait times, available services, or closures. 
                    All updates are anonymous and help people in your community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CommunityPage;
