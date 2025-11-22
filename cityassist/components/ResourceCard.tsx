import React, { useState } from "react";
import { Resource } from "../types";

interface ResourceCardProps {
  resource: Resource;
  isSelected: boolean;
  onClick: () => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isSelected,
  onClick,
}) => {
  const [showContribute, setShowContribute] = useState(false);
  const [crowdStatus, setCrowdStatus] = useState<"busy" | "light" | null>(null);
  const [isSaved, setIsSaved] = useState(() => {
    const saved = localStorage.getItem("savedResources");
    if (!saved) return false;
    const savedList = JSON.parse(saved);
    return savedList.some((r: Resource) => r.id === resource.id);
  });

  const handleCrowdReport = (status: "busy" | "light") => {
    setCrowdStatus(status);
    // TODO: Send to backend/database
    console.log(`Reported ${resource.name} as ${status}`);
  };

  const handleReportClosure = () => {
    // TODO: Send closure report
    console.log(`Reported ${resource.name} as closed`);
    alert("Thank you! We'll verify this update.");
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const saved = localStorage.getItem("savedResources");
    let savedList: Resource[] = saved ? JSON.parse(saved) : [];

    if (isSaved) {
      savedList = savedList.filter((r) => r.id !== resource.id);
    } else {
      savedList.push(resource);
    }

    localStorage.setItem("savedResources", JSON.stringify(savedList));
    setIsSaved(!isSaved);

    // Trigger custom event for other components to update
    window.dispatchEvent(new Event("savedResourcesChanged"));
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all duration-300 ease-out cursor-pointer mb-3 relative overflow-hidden ${
        isSelected
          ? "bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500"
          : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
      } ${resource.isEmergency ? "border-l-4 border-l-red-500" : ""}`}
    >
      {/* Source Badge (Open Data) */}
      {resource.source && (
        <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-bl-lg">
          Source: {resource.source}
        </div>
      )}

      <div className="flex justify-between items-start pr-6">
        <h3
          className={`font-bold ${
            resource.isEmergency ? "text-red-700" : "text-slate-900"
          }`}
        >
          {resource.name}
        </h3>
        <button
          onClick={toggleSave}
          className="transition-all duration-200 ease-out hover:scale-110 active:scale-95"
          title={isSaved ? "Remove from saved" : "Save this resource"}
        >
          <svg
            className={`w-6 h-6 ${
              isSaved ? "text-amber-500" : "text-gray-400 hover:text-amber-500"
            }`}
            fill={isSaved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isSaved ? "0" : "2"}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-1 mb-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
            resource.isEmergency
              ? "bg-red-100 text-red-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {resource.category}
        </span>
        {crowdStatus && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              crowdStatus === "busy"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {crowdStatus === "busy" ? "😓 Busy" : "✅ Light"}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-600 mt-2 leading-snug">
        {resource.description}
      </p>

      <div className="mt-3 flex flex-col gap-1 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>{resource.hours}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
          <span>{resource.address}</span>
        </div>
        {resource.phone && (
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              ></path>
            </svg>
            <a
              href={`tel:${resource.phone.replace(/-/g, "")}`}
              className="hover:text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {resource.phone}
            </a>
          </div>
        )}
      </div>

      {isSelected && (
        <>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${resource.lat},${resource.lng}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            Get Directions
          </a>

          {/* Community Contribution Section */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContribute(!showContribute);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              Help keep this updated
            </button>

            {showContribute && (
              <div
                className="mt-3 space-y-2"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs text-slate-600 font-medium">
                  How busy is it right now?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCrowdReport("light")}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all ${
                      crowdStatus === "light"
                        ? "bg-green-100 border-green-300 text-green-700"
                        : "bg-white border-slate-300 text-slate-600 hover:border-green-300"
                    }`}
                  >
                    ✅ Light
                  </button>
                  <button
                    onClick={() => handleCrowdReport("busy")}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all ${
                      crowdStatus === "busy"
                        ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                        : "bg-white border-slate-300 text-slate-600 hover:border-yellow-300"
                    }`}
                  >
                    😓 Busy
                  </button>
                </div>
                <button
                  onClick={handleReportClosure}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-300 text-slate-600 hover:border-red-300 hover:text-red-600 transition-all"
                >
                  🚫 Report as Closed
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ResourceCard;
