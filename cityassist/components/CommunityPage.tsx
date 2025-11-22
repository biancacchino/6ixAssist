import React, { useState, useContext } from 'react';
import { DarkModeContext } from '../App';

interface CommunityUpdate {
  id: string;
  location: string;
  status: string;
  reporter: string;
  time: string;
  type: 'positive' | 'warning' | 'info';
}

const CommunityPage: React.FC = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [activeTab, setActiveTab] = useState<'updates' | 'share'>('updates');
  const [location, setLocation] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [communityUpdates, setCommunityUpdates] = useState<CommunityUpdate[]>([
    {
      id: '1',
      location: 'Daily Bread Food Bank',
      status: 'Short line',
      reporter: '3 people',
      time: '15 mins ago',
      type: 'positive'
    },
    {
      id: '2',
      location: 'Good Shepherd Shelter',
      status: 'Full capacity',
      reporter: '2 people',
      time: '1 hour ago',
      type: 'warning'
    },
    {
      id: '3',
      location: 'Free Legal Clinic',
      status: 'Walk-ins available',
      reporter: '1 person',
      time: '2 hours ago',
      type: 'positive'
    },
    {
      id: '4',
      location: 'North York Community Centre',
      status: 'Hot meals until 6pm',
      reporter: '5 people',
      time: '3 hours ago',
      type: 'info'
    },
  ]);

  // Helper function to determine update type based on content
  const determineUpdateType = (text: string): 'positive' | 'warning' | 'info' => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('full') || lowerText.includes('closed') || lowerText.includes('no') || lowerText.includes('wait')) {
      return 'warning';
    }
    
    if (lowerText.includes('available') || lowerText.includes('open') || lowerText.includes('short') || lowerText.includes('welcome')) {
      return 'positive';
    }
    
    return 'info';
  };

  // Function to add new update
  const addNewUpdate = (locationName: string, statusText: string) => {
    const newUpdate: CommunityUpdate = {
      id: Date.now().toString(),
      location: locationName,
      status: statusText,
      reporter: '1 person',
      time: 'Just now',
      type: determineUpdateType(statusText)
    };
    
    // Add to beginning of array to show most recent first
    setCommunityUpdates(prev => [newUpdate, ...prev]);
    
    // Switch to updates tab to show the new post
    setActiveTab('updates');
  };

  return (
    <div className={`flex flex-col h-full overflow-y-auto transition-colors duration-300 ${
      darkMode 
        ? "bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800"
        : "bg-gradient-to-b from-indigo-50 via-white to-purple-50"
    }`}>

      <div className="w-full max-w-4xl mx-auto px-6 py-8">
        
        {/* Hero */}
        <div className="mb-8">
          <h2 className={`text-3xl md:text-4xl font-semibold mb-3 transition-colors duration-300 ${
            darkMode ? "text-gray-100" : "text-gray-800"
          }`}>
            Real-time updates from real people.
          </h2>
          <p className={`text-lg transition-colors duration-300 ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}>
            Help others by sharing what you know. See what's happening right now.
          </p>
        </div>

        {/* Tabs */}
        <div className={`flex gap-2 mb-8 p-1 rounded-xl border transition-colors duration-300 ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-indigo-50 border-indigo-100"
        }`}>
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-300 ease-out ${
              activeTab === 'updates'
                ? darkMode
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'bg-white text-gray-800 shadow-sm'
                : darkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Live Updates
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-300 ease-out ${
              activeTab === 'share'
                ? darkMode
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'bg-white text-gray-800 shadow-sm'
                : darkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Share Info
          </button>
        </div>

        {/* Updates Tab */}
        {activeTab === 'updates' && (
          <div className="space-y-4">
            {communityUpdates.map((update) => (
              <div
                key={update.id}
                className={`p-5 rounded-2xl border-2 transition-colors duration-300 ${
                  darkMode
                    ? update.type === 'positive'
                      ? 'bg-green-900 border-green-800'
                      : update.type === 'warning'
                      ? 'bg-orange-900 border-orange-800'
                      : 'bg-blue-900 border-blue-800'
                    : update.type === 'positive'
                    ? 'bg-green-50 border-green-200'
                    : update.type === 'warning'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-semibold transition-colors duration-300 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}>{update.location}</h3>
                  <span className={`text-xs transition-colors duration-300 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}>{update.time}</span>
                </div>
                <p className={`text-lg mb-2 transition-colors duration-300 ${
                  darkMode
                    ? update.type === 'positive'
                      ? 'text-green-300'
                      : update.type === 'warning'
                      ? 'text-orange-300'
                      : 'text-blue-300'
                    : update.type === 'positive'
                    ? 'text-green-900'
                    : update.type === 'warning'
                    ? 'text-orange-900'
                    : 'text-blue-900'
                }`}>
                  {update.status}
                </p>
                <p className={`text-sm transition-colors duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}>
                  Reported by {update.reporter}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Share Tab */}
        {activeTab === 'share' && (
          <div className="space-y-6">
            {showSuccess && (
              <div className={`p-4 rounded-2xl border-2 transition-colors duration-300 ${
                darkMode
                  ? "bg-green-900 border-green-700 text-green-300"
                  : "bg-green-50 border-green-200 text-green-800"
              }`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Update shared successfully!</span>
                </div>
              </div>
            )}
            <div className={`rounded-2xl p-6 transition-colors duration-300 ${
              darkMode ? "bg-gray-800" : "bg-gray-50"
            }`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
                Share what you know
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Which location?
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Daily Bread Food Bank"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    What's the update?
                  </label>
                  <textarea
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="e.g., Short line today, walk-ins welcome"
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors duration-300 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!location.trim() || !updateText.trim()) return;
                    
                    setIsPosting(true);
                    
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Add the new update to the live updates
                    addNewUpdate(location.trim(), updateText.trim());
                    
                    // Clear form and show success
                    setLocation('');
                    setUpdateText('');
                    setIsPosting(false);
                    setShowSuccess(true);
                    
                    // Hide success message after 3 seconds
                    setTimeout(() => setShowSuccess(false), 3000);
                  }}
                  disabled={!location.trim() || !updateText.trim() || isPosting}
                  className={`w-full py-4 rounded-xl font-medium transition-all duration-300 ease-out hover:shadow-md active:scale-95 ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
                      : "bg-indigo-500 hover:bg-indigo-700 active:bg-indigo-800 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPosting ? 'Sharing...' : 'Share update'}
                </button>
              </div>
            </div>

            <div className={`rounded-2xl p-6 border-2 transition-colors duration-300 ${
              darkMode
                ? "bg-gray-800 border-gray-600"
                : "bg-purple-50 border-purple-200"
            }`}>
              <div className="flex gap-3">
                <svg className={`w-6 h-6 flex-shrink-0 mt-1 transition-colors duration-300 ${
                  darkMode ? "text-blue-400" : "text-purple-600"
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className={`font-semibold mb-1 transition-colors duration-300 ${
                    darkMode ? "text-white" : "text-purple-900"
                  }`}>Your updates help everyone</h4>
                  <p className={`text-sm transition-colors duration-300 ${
                    darkMode ? "text-gray-300" : "text-purple-800"
                  }`}>
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
