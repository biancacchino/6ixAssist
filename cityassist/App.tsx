import React, { useState, useEffect, createContext } from "react";
import { Coordinate } from "./types";
import { DEFAULT_CENTER } from "./constants";
import LiveLocationService, {
  LocationUpdate,
} from "./services/locationService";
import LandingPage from "./components/LandingPage";
import ResultsPage from "./components/ResultsPage";
import CommunityPage from "./components/CommunityPage";
import SavedPage from "./components/SavedPage";
import SettingsPage from "./components/SettingsPage";
import EventsPage from "./components/EventsPage";
import AnnouncementsPage from "./components/AnnouncementsPage";
import InfoHelpPage from "./components/InfoHelpPage";
import AnnouncementBanner from "./components/AnnouncementBanner";
import SideNav from "./components/SideNav";

export const DarkModeContext = createContext<{
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}>({
  darkMode: false,
  setDarkMode: () => {},
});

const App: React.FC = () => {
  const [userLocation, setUserLocation] = useState<Coordinate>(DEFAULT_CENTER);
  const [locationAccuracy, setLocationAccuracy] = useState<number>(0);
  const [neighborhood, setNeighborhood] = useState<string>("Toronto");
  const [isLocationLive, setIsLocationLive] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState(() => {
    // Always start at home page
    const hash = window.location.hash;
    if (!hash || hash === "#" || hash === "#/") {
      window.location.hash = "";
      return "";
    }
    return hash;
  });
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationPermission, setLocationPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true" ? true : false; // Default to light mode
  });
  const [showManualLocationInput, setShowManualLocationInput] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const locationService = new LiveLocationService();

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // Handle location updates
  const handleLocationUpdate = async (update: LocationUpdate) => {
    setUserLocation(update.position);
    setLocationAccuracy(update.accuracy);
    setIsLocationLive(true);

    // Get neighborhood name
    try {
      const neighborhoodName = await LiveLocationService.getNeighborhood(
        update.position.lat,
        update.position.lng
      );
      setNeighborhood(neighborhoodName);
    } catch (error) {
      console.warn("Error getting neighborhood:", error);
    }
  };

  // Check location permission and start live tracking
  useEffect(() => {
    const initializeLocation = async () => {
      if (!LiveLocationService.isSupported()) {
        setLocationPermission("denied");
        return;
      }

      try {
        const permission = await LiveLocationService.checkPermission();
        setLocationPermission(permission);

        if (permission === "granted") {
          // Get initial position
          const initialUpdate = await locationService.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          });

          await handleLocationUpdate(initialUpdate);

          // Start live tracking
          locationService.startWatching(handleLocationUpdate, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000, // Update every minute
          });

          setShowLocationPrompt(false);
        } else if (permission === "prompt") {
          setShowLocationPrompt(true);
        }
      } catch (error) {
        console.warn("Location initialization failed:", error);
        setLocationPermission("denied");
      }
    };

    initializeLocation();

    // Cleanup on unmount
    return () => {
      locationService.stopWatching(handleLocationUpdate);
    };
  }, []);

  const getUserLocation = async () => {
    try {
      const update = await LiveLocationService.requestPermission();
      setLocationPermission("granted");
      await handleLocationUpdate(update);

      // Start live tracking after permission granted
      locationService.startWatching(handleLocationUpdate, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      });

      setShowLocationPrompt(false);
    } catch (error) {
      console.warn("Geolocation denied or failed:", error);
      setLocationPermission("denied");
      setShowLocationPrompt(false);
    }
  };

  const handleEnableLocation = () => {
    getUserLocation();
  };

  const handleSkipLocation = () => {
    setShowLocationPrompt(false);
    setLocationPermission("denied");
  };

  const handleManualLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLocationInput.trim()) return;

    setIsGeocoding(true);
    try {
      const { geocode } = await import("./services/geocodingService");
      const coordinates = await geocode(manualLocationInput.trim());
      
      if (coordinates) {
        setUserLocation(coordinates);
        setLocationAccuracy(100); // Approximate accuracy for geocoded addresses
        setIsLocationLive(true);
        
        // Get neighborhood
        try {
          const neighborhoodName = await LiveLocationService.getNeighborhood(
            coordinates.lat,
            coordinates.lng
          );
          setNeighborhood(neighborhoodName);
        } catch (error) {
          console.warn("Error getting neighborhood:", error);
          setNeighborhood("Toronto"); // Fallback
        }
        
        setShowManualLocationInput(false);
        setShowLocationPrompt(false);
        setManualLocationInput("");
      } else {
        alert(
          "Could not find that location. Please try:\n" +
          "• A more specific address (e.g., '123 Main Street')\n" +
          "• A well-known intersection (e.g., 'Yonge and Dundas')\n" +
          "• A neighborhood name (e.g., 'Downtown Toronto')"
        );
      }
    } catch (error) {
      console.error("Error geocoding:", error);
      alert(
        "Error finding location. Please check your internet connection and try again.\n\n" +
        "You can also try:\n" +
        "• Using the 'Detect Location' button\n" +
        "• Dropping a pin on the map"
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  // Listen for hash changes to handle routing
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Simple routing logic
  const cleanPath = currentPath.replace(/^#/, "");
  const isMap = cleanPath.startsWith("/map");
  const isCommunity = cleanPath.startsWith("/community");
  const isSaved = cleanPath.startsWith("/saved");
  const isSettings = cleanPath.startsWith("/settings");
  const isEvents = cleanPath.startsWith("/events");
  const isAnnouncements = cleanPath.startsWith("/announcements");
  const isInfoHelp = cleanPath.startsWith("/help");

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      <div
        className={`h-screen w-full font-sans flex transition-colors duration-300 ${
          darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-slate-900"
        }`}
      >
        {/* Location Permission Popup */}
        {showLocationPrompt && !showManualLocationInput && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div
              className={`rounded-3xl p-8 max-w-md w-full transition-colors duration-300 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="text-center">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    darkMode ? "bg-indigo-900" : "bg-indigo-100"
                  }`}
                >
                  <svg
                    className={`w-8 h-8 transition-colors duration-300 ${
                      darkMode ? "text-indigo-300" : "text-indigo-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h2
                  className={`text-2xl font-semibold mb-3 transition-colors duration-300 ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Enable your location?
                </h2>
                <p
                  className={`mb-6 transition-colors duration-300 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  We'll show you resources near you. This helps you find help
                  faster.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleEnableLocation}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-medium transition-all duration-300 ease-out hover:shadow-md active:scale-95"
                  >
                    Enable location
                  </button>
                  <button
                    onClick={() => setShowManualLocationInput(true)}
                    className={`w-full py-4 rounded-xl font-medium transition-all duration-300 ease-out active:scale-95 ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-200"
                        : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700"
                    }`}
                  >
                    Enter address or intersection
                  </button>
                  <button
                    onClick={handleSkipLocation}
                    className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ease-out active:scale-95 text-sm ${
                      darkMode
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Location Input */}
        {showManualLocationInput && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div
              className={`rounded-3xl p-8 max-w-md w-full transition-colors duration-300 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
            <div className="text-center mb-6">
              <h2
                className={`text-2xl font-semibold mb-3 transition-colors duration-300 ${
                  darkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Enter your location
              </h2>
              <p
                className={`text-sm transition-colors duration-300 mb-2 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Enter an address or intersection
              </p>
              <div
                className={`text-xs space-y-1 mt-3 ${
                  darkMode ? "text-gray-500" : "text-gray-500"
                }`}
              >
                <p className="font-medium">Examples:</p>
                <div className="flex flex-col gap-1 items-center">
                  <span>📍 "Yonge and Dundas"</span>
                  <span>📍 "123 Main Street"</span>
                  <span>📍 "Queen & Spadina"</span>
                  <span>📍 "Bloor at Bathurst"</span>
                </div>
              </div>
            </div>
            <form onSubmit={handleManualLocationSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={manualLocationInput}
                  onChange={(e) => setManualLocationInput(e.target.value)}
                  placeholder="e.g., Yonge and Dundas, or 123 Main St"
                  className={`w-full px-4 py-3 pr-10 rounded-xl border-2 outline-none transition-all duration-300 ${
                    darkMode
                      ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:border-indigo-400"
                      : "border-indigo-200 bg-white text-gray-900 placeholder-gray-500 focus:border-indigo-500"
                  }`}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg
                    className={`w-5 h-5 ${
                      darkMode ? "text-gray-400" : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>
              <div
                className={`text-xs px-2 ${
                  darkMode ? "text-gray-500" : "text-gray-500"
                }`}
              >
                <p>💡 Tip: You can use "and", "&", "/", or "at" for intersections</p>
              </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualLocationInput(false);
                      setManualLocationInput("");
                    }}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ease-out active:scale-95 ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-200"
                        : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700"
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!manualLocationInput.trim() || isGeocoding}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-medium transition-all duration-300 ease-out hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeocoding ? "Finding..." : "Find Location"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Side Navigation */}
        <SideNav currentPath={currentPath} />

        {/* Main Content */}
        <div className="main-content-area flex-1 md:ml-64 overflow-hidden flex flex-col transition-all duration-300 ease-out">
          {/* Announcement Banner */}
          <AnnouncementBanner />

          <div className="flex-1 overflow-hidden">
            {isMap ? (
              <ResultsPage 
                userLocation={userLocation}
                onLocationUpdate={(location, neighborhoodName) => {
                  setUserLocation(location);
                  setNeighborhood(neighborhoodName);
                  setIsLocationLive(true);
                  setLocationAccuracy(100);
                }}
              />
            ) : isCommunity ? (
              <CommunityPage />
            ) : isSaved ? (
              <SavedPage />
            ) : isSettings ? (
              <SettingsPage />
            ) : isEvents ? (
              <EventsPage />
            ) : isAnnouncements ? (
              <AnnouncementsPage />
            ) : isInfoHelp ? (
              <InfoHelpPage />
            ) : (
              <LandingPage
                userLocation={userLocation}
                neighborhood={neighborhood}
                isLocationLive={isLocationLive}
                locationAccuracy={locationAccuracy}
                onLocationUpdate={(location, neighborhoodName) => {
                  setUserLocation(location);
                  setNeighborhood(neighborhoodName);
                  setIsLocationLive(true);
                  setLocationAccuracy(100);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </DarkModeContext.Provider>
  );
};

export default App;
