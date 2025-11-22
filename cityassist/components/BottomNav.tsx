import React from "react";

interface BottomNavProps {
  currentPath: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPath }) => {
  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const isActive = (path: string) => {
    const cleanPath = currentPath.replace(/^#/, "");
    if (path === "/") {
      return cleanPath === "" || cleanPath === "/";
    }
    return cleanPath.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-indigo-200 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ease-out active:scale-95 ${
            isActive("/") ? "text-indigo-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="text-xl mb-1">🏠</span>
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => navigate("/map")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ease-out active:scale-95 ${
            isActive("/map") ? "text-indigo-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="text-xl mb-1">🗺️</span>
          <span className="text-xs font-medium">Map</span>
        </button>

        <button
          onClick={() => navigate("/community")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ease-out active:scale-95 ${
            isActive("/community") ? "text-indigo-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="text-xl mb-1">💬</span>
          <span className="text-xs font-medium">Community</span>
        </button>

        <button
          onClick={() => navigate("/saved")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ease-out active:scale-95 ${
            isActive("/saved") ? "text-indigo-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="text-xl mb-1">⭐</span>
          <span className="text-xs font-medium">Saved</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
