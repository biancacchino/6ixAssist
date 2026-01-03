import React, { useEffect, useRef, useState, useContext } from "react";
import L from "leaflet";
import { Resource, Coordinate } from "../types";
import { DarkModeContext } from "../App";
import LiveLocationService from "../services/locationService";

interface MapComponentProps {
  resources: Resource[];
  center: Coordinate;
  selectedId?: string;
  onSelectResource: (id: string) => void;
  onLocationUpdate?: (location: Coordinate, neighborhood: string) => void;
}

// Pre-create icons for better performance
const createIcon = (color: string, size: number) =>
  L.divIcon({
    className: "custom-pin",
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-md"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });

const DEFAULT_ICON = createIcon("#ef4444", 30);
const SELECTED_ICON = createIcon("#f59e0b", 40);

const USER_ICON = L.divIcon({
  className: "user-location-icon",
  html: `<div class="relative">
    <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
    <div class="absolute top-0 left-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75"></div>
  </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const MapComponent: React.FC<MapComponentProps> = ({
  resources,
  center,
  selectedId,
  onSelectResource,
  onLocationUpdate,
}) => {
  const { darkMode } = useContext(DarkModeContext);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const [showManualLocationInput, setShowManualLocationInput] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [dropPinMode, setDropPinMode] = useState(false);
  const droppedPinRef = useRef<L.Marker | null>(null);
  // Use ref to always access the latest onLocationUpdate callback
  const onLocationUpdateRef = useRef(onLocationUpdate);
  
  // Keep ref updated
  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map already exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([center.lat, center.lng]);
      return;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: false, // Use DOM for better performance
    }).setView([center.lat, center.lng], 13);
    
    // Store map reference before adding layers
    mapInstanceRef.current = map;
    
    // Ensure map container is properly sized after map is fully initialized
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (map && mapContainerRef.current && mapContainerRef.current.offsetParent !== null) {
        try {
          map.invalidateSize();
        } catch (error) {
          // Silently handle - map might not be fully ready yet
        }
      }
    });

    // Fast-loading tile layer with fallback to prevent grey tiles
    // Use CartoDB as primary (more reliable) with OSM as fallback
    const cartoTiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
      minZoom: 10,
      subdomains: "abcd",
      crossOrigin: 'anonymous',
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 2,
      detectRetina: true,
      // Retry failed tiles
      errorTileUrl: '',
    });

    const osmTiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 10,
      subdomains: "abc",
      crossOrigin: 'anonymous',
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 2,
      detectRetina: true,
      // Retry failed tiles
      errorTileUrl: '',
    });

    // Add primary tile layer
    cartoTiles.addTo(map);
    
    // Set up fallback: if CartoDB fails, switch to OSM
    let fallbackActive = false;
    cartoTiles.on('tileerror', (error: any) => {
      if (!fallbackActive && map.hasLayer(cartoTiles)) {
        console.warn('CartoDB tile error, switching to OSM fallback');
        fallbackActive = true;
        map.removeLayer(cartoTiles);
        osmTiles.addTo(map);
      }
    });
    
    // Also handle OSM errors by retrying
    osmTiles.on('tileerror', () => {
      // OSM tiles will retry automatically, but we can log it
      console.warn('OSM tile load error (will retry)');
    });

    // Live user location marker
    const userMarker = L.marker([center.lat, center.lng], { icon: USER_ICON })
      .addTo(map)
      .bindPopup("📍 Your location");

    // Store user marker reference for updates
    (map as any)._userMarker = userMarker;

    // Store map reference for click handler
    (map as any)._mapRef = map;

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        try {
          const map = mapInstanceRef.current;
          // Clean up click handler
          if ((map as any)._handleMapClick) {
            map.off('click', (map as any)._handleMapClick);
          }
          // Clean up dropped pin
          if (droppedPinRef.current) {
            try {
              map.removeLayer(droppedPinRef.current);
            } catch (e) {
              // Ignore cleanup errors
            }
          }
          // Clean up instruction
          if ((map as any)._dropPinInstruction) {
            try {
              map.removeControl((map as any)._dropPinInstruction);
            } catch (e) {
              // Ignore cleanup errors
            }
          }
          // Remove all layers before removing map
          try {
            map.eachLayer((layer) => {
              try {
                map.removeLayer(layer);
              } catch (e) {
                // Ignore individual layer removal errors
              }
            });
          } catch (e) {
            // Ignore layer iteration errors
          }
          map.remove();
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        } finally {
        mapInstanceRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // We only want to init once. Updates are handled below.

  // Update Center and User Location
  useEffect(() => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      
      // Smoothly fly to new location
      map.flyTo([center.lat, center.lng], 13, {
        duration: 0.5,
      });

      // Update user marker position
      const userMarker = (map as any)._userMarker;
      if (userMarker) {
        userMarker.setLatLng([center.lat, center.lng]);
        // Update popup to show it's the user's location
        userMarker.setPopupContent("📍 Your location");
      }
      
      // Ensure tiles are loaded by invalidating size (safely)
      requestAnimationFrame(() => {
        if (map && mapContainerRef.current && mapContainerRef.current.offsetParent !== null) {
          try {
            map.invalidateSize();
          } catch (error) {
            // Silently handle - map might not be fully ready
          }
        }
      });
    }
  }, [center]);

  // Handle drop pin mode changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    
    // Create click handler that accesses current state
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!dropPinMode) return;

      const clickedLat = e.latlng.lat;
      const clickedLng = e.latlng.lng;

      // Remove existing dropped pin
      if (droppedPinRef.current) {
        map.removeLayer(droppedPinRef.current);
      }

      // Create new pin at clicked location
      const DROPPED_PIN_ICON = L.divIcon({
        className: "dropped-pin-icon",
        html: `<div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 drop-shadow-lg">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const confirmBtnId = `confirm-location-${Date.now()}`;
      
      // Create a container div for the popup content
      const popupContent = L.DomUtil.create('div', 'drop-pin-popup');
      popupContent.innerHTML = `
        <div class="p-2 text-center">
          <div class="font-semibold text-sm mb-2">📍 Selected Location</div>
          <button id="${confirmBtnId}" class="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
            Use This Location
          </button>
        </div>
      `;
      
      const droppedPin = L.marker([clickedLat, clickedLng], { 
        icon: DROPPED_PIN_ICON,
        draggable: true,
      })
        .addTo(map)
        .bindPopup(popupContent)
        .openPopup();
      
      // Prevent map click when clicking inside popup
      L.DomEvent.on(popupContent, 'click', L.DomEvent.stopPropagation);

      // Attach click handler directly to the button element
      // Use a closure to capture the current pin and coordinates
      const handleConfirmClick = async (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        const finalLat = droppedPin.getLatLng().lat;
        const finalLng = droppedPin.getLatLng().lng;
        
        console.log('Drop pin confirmed:', { lat: finalLat, lng: finalLng });
        
        // Use ref to get the latest callback
        const updateCallback = onLocationUpdateRef.current;
        if (updateCallback) {
          try {
            const neighborhood = await LiveLocationService.getNeighborhood(
              finalLat,
              finalLng
            );
            console.log('Calling onLocationUpdate with:', { lat: finalLat, lng: finalLng, neighborhood });
            updateCallback({ lat: finalLat, lng: finalLng }, neighborhood);
          } catch (error) {
            // Still update location even if neighborhood lookup fails
            console.warn("Could not get neighborhood:", error);
            console.log('Calling onLocationUpdate with fallback neighborhood');
            updateCallback({ lat: finalLat, lng: finalLng }, "Toronto");
          }
        } else {
          console.warn('onLocationUpdate callback is not available');
        }
        
        // Remove dropped pin and exit drop pin mode
        if (droppedPinRef.current) {
          map.removeLayer(droppedPinRef.current);
          droppedPinRef.current = null;
        }
        setDropPinMode(false);
        map.getContainer().style.cursor = '';
        
        // Remove instruction
        if ((map as any)._dropPinInstruction) {
          map.removeControl((map as any)._dropPinInstruction);
          (map as any)._dropPinInstruction = null;
        }
        
        // Close popup
        droppedPin.closePopup();
      };
      
      // Attach handler when popup opens
      droppedPin.on('popupopen', () => {
        // Small delay to ensure DOM is fully rendered
        setTimeout(() => {
          const confirmBtn = document.getElementById(confirmBtnId);
          if (confirmBtn) {
            console.log('Attaching click handler to confirm button');
            confirmBtn.addEventListener('click', handleConfirmClick);
          } else {
            console.warn('Confirm button not found with ID:', confirmBtnId);
          }
        }, 50);
      });
      
      // Clean up handler when popup closes
      droppedPin.on('popupclose', () => {
        const confirmBtn = document.getElementById(confirmBtnId);
        if (confirmBtn) {
          confirmBtn.removeEventListener('click', handleConfirmClick);
        }
      });

      // Allow dragging the pin - update popup with new coordinates
      droppedPin.on('dragend', async (e) => {
        const marker = e.target as L.Marker;
        const position = marker.getLatLng();
        // Generate new button ID to avoid conflicts
        const newConfirmBtnId = `confirm-location-${Date.now()}`;
        
        // Create new popup content
        const newPopupContent = L.DomUtil.create('div', 'drop-pin-popup');
        newPopupContent.innerHTML = `
          <div class="p-2 text-center">
            <div class="font-semibold text-sm mb-2">📍 Selected Location</div>
            <button id="${newConfirmBtnId}" class="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
              Use This Location
            </button>
          </div>
        `;
        
        // Update popup content
        droppedPin.setPopupContent(newPopupContent);
        droppedPin.openPopup();
        
        // Prevent map click when clicking inside popup
        L.DomEvent.on(newPopupContent, 'click', L.DomEvent.stopPropagation);
        
        // Create new handler for the dragged pin
        const handleConfirmClickAfterDrag = async (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          
          const finalLat = droppedPin.getLatLng().lat;
          const finalLng = droppedPin.getLatLng().lng;
          
          console.log('Drop pin confirmed (after drag):', { lat: finalLat, lng: finalLng });
          
          const updateCallback = onLocationUpdateRef.current;
          if (updateCallback) {
            try {
              const neighborhood = await LiveLocationService.getNeighborhood(
                finalLat,
                finalLng
              );
              console.log('Calling onLocationUpdate with:', { lat: finalLat, lng: finalLng, neighborhood });
              updateCallback({ lat: finalLat, lng: finalLng }, neighborhood);
            } catch (error) {
              console.warn("Could not get neighborhood:", error);
              console.log('Calling onLocationUpdate with fallback neighborhood');
              updateCallback({ lat: finalLat, lng: finalLng }, "Toronto");
            }
          } else {
            console.warn('onLocationUpdate callback is not available');
          }
          
          if (droppedPinRef.current) {
            map.removeLayer(droppedPinRef.current);
            droppedPinRef.current = null;
          }
          setDropPinMode(false);
          map.getContainer().style.cursor = '';
          
          if ((map as any)._dropPinInstruction) {
            map.removeControl((map as any)._dropPinInstruction);
            (map as any)._dropPinInstruction = null;
          }
          
          // Close popup
          droppedPin.closePopup();
        };
        
        // Attach handler when popup opens after drag
        droppedPin.off('popupopen'); // Remove old handler
        droppedPin.on('popupopen', () => {
          // Small delay to ensure DOM is fully rendered
          setTimeout(() => {
            const confirmBtn = document.getElementById(newConfirmBtnId);
            if (confirmBtn) {
              console.log('Attaching click handler to confirm button (after drag)');
              confirmBtn.addEventListener('click', handleConfirmClickAfterDrag);
            } else {
              console.warn('Confirm button not found with ID (after drag):', newConfirmBtnId);
            }
          }, 50);
        });
        
        // Clean up handler when popup closes
        droppedPin.off('popupclose'); // Remove old handler
        droppedPin.on('popupclose', () => {
          const confirmBtn = document.getElementById(newConfirmBtnId);
          if (confirmBtn) {
            confirmBtn.removeEventListener('click', handleConfirmClickAfterDrag);
          }
        });
      });

      droppedPinRef.current = droppedPin;
    };

    if (dropPinMode) {
      map.getContainer().style.cursor = 'crosshair';
      map.on('click', handleMapClick);
      (map as any)._handleMapClick = handleMapClick;
      
      // Show instruction
      if (!(map as any)._dropPinInstruction) {
        try {
          const instruction = L.control({ position: 'topcenter' });
          instruction.onAdd = () => {
            const div = L.DomUtil.create('div', 'drop-pin-instruction');
            div.innerHTML = `
              <div class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg text-sm font-medium">
                Click on the map to drop a pin, then click "Use This Location"
              </div>
            `;
            return div;
          };
          instruction.addTo(map);
          (map as any)._dropPinInstruction = instruction;
        } catch (error) {
          console.warn('Error adding drop pin instruction:', error);
        }
      }
      
      // Ensure map is properly sized and tiles are loaded (safely)
      requestAnimationFrame(() => {
        if (map && mapContainerRef.current && mapContainerRef.current.offsetParent !== null) {
          try {
            map.invalidateSize();
          } catch (error) {
            // Silently handle - map might not be fully ready
          }
        }
      });
    } else {
      map.getContainer().style.cursor = '';
      // Remove click handler
      if ((map as any)._handleMapClick) {
        map.off('click', (map as any)._handleMapClick);
        (map as any)._handleMapClick = null;
      }
      // Remove instruction
      if ((map as any)._dropPinInstruction) {
        map.removeControl((map as any)._dropPinInstruction);
        (map as any)._dropPinInstruction = null;
      }
      // Remove dropped pin if mode is turned off
      if (droppedPinRef.current) {
        map.removeLayer(droppedPinRef.current);
        droppedPinRef.current = null;
      }
    }
  }, [dropPinMode, onLocationUpdate]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) =>
      (marker as L.Marker).remove()
    );
    markersRef.current = {};

    // Add new markers with performance optimization
    resources.forEach((res) => {
      const isSelected = res.id === selectedId;
      const icon = isSelected ? SELECTED_ICON : DEFAULT_ICON;

      const marker = L.marker([res.lat, res.lng], { icon }).addTo(map)
        .bindPopup(`
          <div class="p-2">
            <div class="font-semibold text-sm">${res.name}</div>
            <div class="text-xs text-gray-600">${res.category}</div>
            <div class="text-xs text-gray-500 mt-1">${res.address}</div>
          </div>
        `);

      marker.on("click", () => {
        onSelectResource(res.id);
      });

      if (isSelected) {
        marker.openPopup();
      }

      markersRef.current[res.id] = marker;
    });
  }, [resources, selectedId, onSelectResource]);

  // Handle location detection
  const handleDetectLocation = async () => {
    if (!LiveLocationService.isSupported()) {
      alert("Location services are not supported on this device.");
      return;
    }

    setIsDetectingLocation(true);
    try {
      const locationService = new LiveLocationService();
      const update = await locationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      if (onLocationUpdate) {
        const neighborhood = await LiveLocationService.getNeighborhood(
          update.position.lat,
          update.position.lng
        );
        onLocationUpdate(update.position, neighborhood);
      }

      // Center map on user location
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([update.position.lat, update.position.lng], 15);
      }
    } catch (error) {
      console.error("Error detecting location:", error);
      alert("Could not detect your location. Please try entering it manually.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Handle manual location entry
  const handleManualLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLocationInput.trim()) return;

    setIsGeocoding(true);
    try {
      const { geocode } = await import("../services/geocodingService");
      const coordinates = await geocode(manualLocationInput.trim());

      if (coordinates) {
        if (onLocationUpdate) {
          try {
            const neighborhood = await LiveLocationService.getNeighborhood(
              coordinates.lat,
              coordinates.lng
            );
            onLocationUpdate(coordinates, neighborhood);
          } catch (neighborhoodError) {
            // Still update location even if neighborhood fails
            console.warn("Could not get neighborhood:", neighborhoodError);
            onLocationUpdate(coordinates, "Toronto");
          }
        }

        // Center map on entered location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coordinates.lat, coordinates.lng], 15);
        }

        setShowManualLocationInput(false);
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
      // Only show alert if it's not a network error (which might be temporary)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        alert(
          "Network error. Please check your internet connection and try again.\n\n" +
          "You can also try:\n" +
          "• Using the 'Drop Pin on Map' option\n" +
          "• A more specific address or intersection"
        );
      } else {
        alert(
          "Error finding location. Please try:\n" +
          "• A more specific address (e.g., '123 Main Street')\n" +
          "• A well-known intersection (e.g., 'Yonge and Dundas')\n" +
          "• Using the 'Drop Pin on Map' option"
        );
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div ref={mapContainerRef} className="w-full h-full z-0 relative">
      {/* Location Control Button - Top Right */}
      <div className="absolute top-4 right-4 z-[1000]">
        {/* Main Location Button */}
        <button
          onClick={() => setShowLocationMenu(!showLocationMenu)}
          className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
            darkMode
              ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
              : "bg-white hover:bg-gray-50 text-slate-700"
          }`}
          title="Location options"
        >
          <svg
            className="w-6 h-6"
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
        </button>

        {/* Location Menu Dropdown */}
        {showLocationMenu && (
          <div
            className={`absolute top-14 right-0 mt-2 rounded-xl shadow-xl border-2 overflow-hidden min-w-[200px] ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Detect Location Option */}
            <button
              onClick={async () => {
                setShowLocationMenu(false);
                await handleDetectLocation();
              }}
              disabled={isDetectingLocation}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-200"
                  : "hover:bg-gray-50 text-gray-700"
              } disabled:opacity-50 disabled:cursor-not-allowed border-b ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              {isDetectingLocation ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              )}
              <span className="font-medium">
                {isDetectingLocation ? "Detecting..." : "Detect Location"}
              </span>
            </button>

            {/* Enter Location Option */}
            <button
              onClick={() => {
                setShowLocationMenu(false);
                setShowManualLocationInput(true);
              }}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-200"
                  : "hover:bg-gray-50 text-gray-700"
              } border-b ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="font-medium">Enter Location</span>
            </button>

            {/* Drop Pin Option */}
            <button
              onClick={() => {
                setShowLocationMenu(false);
                setDropPinMode(!dropPinMode);
              }}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 ${
                dropPinMode
                  ? darkMode
                    ? "bg-indigo-900 text-indigo-200"
                    : "bg-indigo-100 text-indigo-700"
                  : darkMode
                  ? "hover:bg-gray-700 text-gray-200"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              <span className="font-medium">
                {dropPinMode ? "Exit Drop Pin" : "Drop Pin on Map"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Close menu when clicking outside */}
      {showLocationMenu && (
        <div
          className="fixed inset-0 z-[999]"
          onClick={() => setShowLocationMenu(false)}
        />
      )}

      {/* Manual Location Input Modal */}
      {showManualLocationInput && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[2000] p-6">
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
                  Cancel
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
    </div>
  );
};

export default MapComponent;
