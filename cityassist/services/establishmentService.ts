// Comprehensive Establishment Data Service
// Fetches from Toronto Open Data, Google Places, and OpenStreetMap

import { Establishment } from '../types';

const TORONTO_OPEN_DATA_BASE = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action';
const TORONTO_DATASETS = {
  shelters: '21c83b32-d5a8-4106-a54f-010dbe49318f', // Daily Shelter Overnight Service Occupancy & Capacity
  dropIns: 'https://open.toronto.ca/dataset/drop-in-locations/',
  foodBanks: 'https://open.toronto.ca/dataset/food-bank-locations/',
  warmingCentres: 'https://open.toronto.ca/dataset/warming-centres/',
};

// Helper to calculate distance between two coordinates
const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Normalize coordinates - ensure lat/lng are within Toronto bounds
const isInToronto = (lat: number, lng: number): boolean => {
  // Toronto approximate bounds
  return lat >= 43.58 && lat <= 43.85 && lng >= -79.64 && lng <= -79.12;
};

// Fetch shelters from Toronto Open Data
// Note: This will fail with CORS errors in browser - that's expected.
// The app will use alternative data sources (Google Places, OpenStreetMap) instead.
export const fetchTorontoShelters = async (): Promise<Establishment[]> => {
  // Skip in browser environment due to CORS restrictions
  // Toronto Open Data API doesn't allow cross-origin requests from browsers
  if (typeof window !== 'undefined') {
    // Silently return empty array - alternative sources will be used
    return [];
  }
  
  try {
    // Use CORS proxy or direct fetch with proper error handling
    const url = `${TORONTO_OPEN_DATA_BASE}/datastore_search?resource_id=${TORONTO_DATASETS.shelters}&limit=1000`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors', // Explicitly set CORS mode
    });
    
    if (!response.ok) {
      // Return empty array instead of throwing to allow app to continue
      return [];
    }
    
    const data = await response.json();
    const records = data.result?.records || [];
    
    if (!records || records.length === 0) {
      return [];
    }

    return records
      .filter((record: any) => {
        // Filter for valid coordinates
        const lat = parseFloat(record.Y || record.LATITUDE || '0');
        const lng = parseFloat(record.X || record.LONGITUDE || '0');
        return lat !== 0 && lng !== 0 && isInToronto(lat, lng);
      })
      .map((record: any, index: number) => {
        const lat = parseFloat(record.Y || record.LATITUDE || '0');
        const lng = parseFloat(record.X || record.LONGITUDE || '0');
        
        return {
          id: `toronto-shelter-${record._id || index}`,
          name: record.ORGANIZATION_NAME || record.PROGRAM_NAME || 'Shelter',
          address: `${record.ADDRESS_LINE_1 || ''}, Toronto, ON`.trim(),
          latitude: lat,
          longitude: lng,
          lat, // Alias for compatibility
          lng, // Alias for compatibility
          category: 'Shelter',
          source: 'Toronto Open Data' as const,
          lastVerified: new Date().toISOString(),
          hours: '24/7',
          description: `Emergency shelter services. ${record.CAPACITY ? `Capacity: ${record.CAPACITY}` : ''}`,
          phone: record.PHONE_NUMBER || undefined,
          isEmergency: true,
        };
      });
  } catch (error) {
    // CORS errors are expected in browser - silently handle (don't log to console)
    // The app will use alternative data sources (Google Places, OpenStreetMap)
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('Load failed'))) {
      // CORS error - expected in browser, silently return empty array
      // Alternative data sources will be used instead
      return [];
    }
    // Only log non-CORS errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error fetching Toronto shelters (non-CORS):', error);
    }
    return [];
  }
};

// Fetch food banks using Google Places API
export const fetchFoodBanksFromGooglePlaces = async (): Promise<Establishment[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn('Google Places API key not found');
    return [];
  }

  try {
    // Search for food banks in Toronto
    const queries = [
      'food bank Toronto',
      'soup kitchen Toronto',
      'community meal program Toronto',
    ];

    const allResults: Establishment[] = [];
    const seenIds = new Set<string>();

    for (const query of queries) {
      try {
        // Use Places Text Search
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&location=43.6532,-79.3832&radius=50000`
        );

        if (!response.ok) continue;

        const data = await response.json();
        const places = data.results || [];

        for (const place of places) {
          if (seenIds.has(place.place_id)) continue;
          seenIds.add(place.place_id);

          if (!isInToronto(place.geometry.location.lat, place.geometry.location.lng)) {
            continue;
          }

          allResults.push({
            id: `google-${place.place_id}`,
            name: place.name,
            address: place.formatted_address || place.vicinity || '',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            category: 'Food',
            source: 'Google Places' as const,
            lastVerified: new Date().toISOString(),
            description: place.types?.includes('food') ? 'Food bank or meal service' : undefined,
            placeId: place.place_id, // Store place_id for accurate directions
          });
        }
      } catch (error) {
        console.error(`Error fetching ${query}:`, error);
      }
    }

    return allResults;
  } catch (error) {
    console.error('Error fetching from Google Places:', error);
    return [];
  }
};

// Fetch from OpenStreetMap Nominatim as fallback
export const fetchFromOpenStreetMap = async (
  category: 'food bank' | 'soup kitchen' | 'homeless shelter' | 'warming centre' | 'community meal' | 
           'community centre' | 'drop-in centre' | 'clothing bank' | 'employment services' | 
           'housing support' | 'mental health' | 'harm reduction' | 'legal aid' | 'non-profit'
): Promise<Establishment[]> => {
  try {
    const query = `${category} Toronto Ontario Canada`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=50&bounded=1&viewbox=-79.64,43.58,-79.12,43.85`
    );

    if (!response.ok) {
      throw new Error(`OSM API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data
      .filter((item: any) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        return lat && lng && isInToronto(lat, lng);
      })
      .map((item: any, index: number) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        
        // Determine category based on search term
        let establishmentCategory = 'Community';
        if (category.includes('food') || category.includes('meal') || category.includes('soup')) {
          establishmentCategory = 'Food';
        } else if (category.includes('shelter') || category.includes('warming')) {
          establishmentCategory = 'Shelter';
        } else if (category.includes('health') || category.includes('mental')) {
          establishmentCategory = 'Health';
        } else if (category.includes('legal')) {
          establishmentCategory = 'Legal';
        } else if (category.includes('employment') || category.includes('job')) {
          establishmentCategory = 'Community';
        }

        return {
          id: `osm-${item.osm_id || index}`,
          name: item.display_name.split(',')[0] || category,
          address: item.display_name || '',
          latitude: lat,
          longitude: lng,
          lat,
          lng,
          category: establishmentCategory,
          source: 'Externally Sourced' as const,
          lastVerified: new Date().toISOString(),
          description: `${category} in Toronto`,
        };
      });
  } catch (error) {
    console.error(`Error fetching from OSM for ${category}:`, error);
    return [];
  }
};

// Fetch additional non-profit services from Google Places
export const fetchNonProfitServices = async (): Promise<Establishment[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const queries = [
      'community centre Toronto',
      'drop-in centre Toronto',
      'clothing bank Toronto',
      'employment services Toronto',
      'housing support Toronto',
      'mental health services Toronto',
      'harm reduction Toronto',
      'legal aid clinic Toronto',
      'non-profit organization Toronto',
      'social services Toronto',
    ];

    const allResults: Establishment[] = [];
    const seenIds = new Set<string>();

    for (const query of queries) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&location=43.6532,-79.3832&radius=50000`
        );

        if (!response.ok) continue;

        const data = await response.json();
        const places = data.results || [];

        for (const place of places) {
          if (seenIds.has(place.place_id)) continue;
          seenIds.add(place.place_id);

          if (!isInToronto(place.geometry.location.lat, place.geometry.location.lng)) {
            continue;
          }

          // Determine category based on query and place types
          let category = 'Community';
          if (query.includes('food') || query.includes('meal')) category = 'Food';
          else if (query.includes('shelter') || query.includes('housing')) category = 'Shelter';
          else if (query.includes('health') || query.includes('mental')) category = 'Health';
          else if (query.includes('legal')) category = 'Legal';
          else if (query.includes('employment') || query.includes('job')) category = 'Community';
          else if (query.includes('clothing')) category = 'Community';

          allResults.push({
            id: `google-np-${place.place_id}`,
            name: place.name,
            address: place.formatted_address || place.vicinity || '',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            category,
            source: 'Google Places' as const,
            lastVerified: new Date().toISOString(),
            description: `Non-profit service: ${query.replace('Toronto', '').trim()}`,
            placeId: place.place_id, // Store place_id for accurate directions
          });
        }
      } catch (error) {
        console.error(`Error fetching ${query}:`, error);
      }
    }

    return allResults;
  } catch (error) {
    console.error('Error fetching non-profit services:', error);
    return [];
  }
};

// Main function to fetch all establishments
export const fetchAllEstablishments = async (): Promise<Establishment[]> => {
  try {
    console.log('Fetching establishments from all sources...');
    
    // Fetch from Toronto Open Data (primary source)
    const [shelters, foodBanksGoogle, nonProfitServices] = await Promise.all([
      fetchTorontoShelters(),
      fetchFoodBanksFromGooglePlaces(),
      fetchNonProfitServices(),
    ]);

    // If we don't have enough food banks, supplement with OSM
    let foodBanksOSM: Establishment[] = [];
    if (foodBanksGoogle.length < 10) {
      console.log('Supplementing food banks with OSM...');
      const [foodBanks, soupKitchens, meals] = await Promise.all([
        fetchFromOpenStreetMap('food bank'),
        fetchFromOpenStreetMap('soup kitchen'),
        fetchFromOpenStreetMap('community meal'),
      ]);
      foodBanksOSM = [...foodBanks, ...soupKitchens, ...meals];
    }

    // Fetch additional services from OSM
    const [warmingCentres, communityCentres, dropInCentres] = await Promise.all([
      fetchFromOpenStreetMap('warming centre'),
      fetchFromOpenStreetMap('community centre'),
      fetchFromOpenStreetMap('drop-in centre'),
    ]);

    // Combine all results
    const allEstablishments = [
      ...shelters,
      ...foodBanksGoogle,
      ...foodBanksOSM,
      ...warmingCentres,
      ...communityCentres,
      ...dropInCentres,
      ...nonProfitServices,
    ];

    // Remove duplicates based on proximity (within 100m)
    const uniqueEstablishments: Establishment[] = [];
    const seen = new Set<string>();

    for (const establishment of allEstablishments) {
      let isDuplicate = false;
      const key = `${establishment.latitude.toFixed(4)}-${establishment.longitude.toFixed(4)}`;
      
      if (seen.has(key)) {
        isDuplicate = true;
      } else {
        // Check if too close to existing establishment
        for (const existing of uniqueEstablishments) {
          const distance = getDistanceKm(
            establishment.latitude,
            establishment.longitude,
            existing.latitude,
            existing.longitude
          );
          if (distance < 0.1) { // Within 100m
            isDuplicate = true;
            break;
          }
        }
      }

      if (!isDuplicate) {
        seen.add(key);
        uniqueEstablishments.push(establishment);
      }
    }

    console.log(`Fetched ${uniqueEstablishments.length} unique establishments`);
    return uniqueEstablishments;
  } catch (error) {
    console.error('Error fetching all establishments:', error);
    return [];
  }
};

// Search establishments by query
export const searchEstablishments = async (
  query?: string,
  category?: string
): Promise<Establishment[]> => {
  try {
    const all = await fetchAllEstablishments();
    
    if (!query && !category) {
      return all;
    }

    const lowerQuery = query?.toLowerCase() || '';
    
    return all.filter(est => {
      const matchesCategory = !category || est.category.toLowerCase() === category.toLowerCase();
      const matchesQuery = !query || 
        est.name.toLowerCase().includes(lowerQuery) ||
        est.address.toLowerCase().includes(lowerQuery) ||
        est.description?.toLowerCase().includes(lowerQuery);
      
      return matchesCategory && matchesQuery;
    });
  } catch (error) {
    console.error('Error searching establishments:', error);
    return [];
  }
};

// Get establishments near a location
export const getNearbyEstablishments = async (
  lat: number,
  lng: number,
  radiusKm: number = 10
): Promise<Establishment[]> => {
  try {
    const all = await fetchAllEstablishments();
    
    return all
      .filter(est => {
        const distance = getDistanceKm(lat, lng, est.latitude, est.longitude);
        return distance <= radiusKm;
      })
      .sort((a, b) => {
        const distA = getDistanceKm(lat, lng, a.latitude, a.longitude);
        const distB = getDistanceKm(lat, lng, b.latitude, b.longitude);
        return distA - distB;
      });
  } catch (error) {
    console.error('Error getting nearby establishments:', error);
    return [];
  }
};

// Convert Establishment to Resource for backward compatibility
export const establishmentToResource = (est: Establishment): import('../types').Resource => {
  return {
    id: est.id,
    name: est.name,
    category: est.category,
    lat: est.latitude,
    lng: est.longitude,
    address: est.address,
    hours: est.hours || 'Hours vary',
    description: est.description || `${est.category} service in Toronto`,
    phone: est.phone,
    website: est.website,
    isEmergency: est.isEmergency,
    source: est.source,
    placeId: est.placeId, // Preserve place_id for accurate directions
  };
};

