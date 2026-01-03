// Geocoding Service - Convert addresses/intersections to coordinates
import { Coordinate } from '../types';

// Normalize intersection input - handles various formats
const normalizeIntersection = (input: string): string => {
  let normalized = input.trim();
  
  // Don't normalize if it looks like a full address (has numbers)
  if (/^\d+/.test(normalized)) {
    return normalized;
  }
  
  // Handle common intersection formats:
  // "Yonge and Dundas" -> "Yonge Street and Dundas Street"
  // "Yonge & Dundas" -> "Yonge Street and Dundas Street"
  // "Yonge/Dundas" -> "Yonge Street and Dundas Street"
  // "Yonge at Dundas" -> "Yonge Street and Dundas Street"
  
  // Replace common separators with "and"
  normalized = normalized.replace(/\s*[&/|]\s*/gi, ' and ');
  normalized = normalized.replace(/\s+at\s+/gi, ' and ');
  normalized = normalized.replace(/\s+@\s+/gi, ' and ');
  
  // If it contains "and", it's likely an intersection
  if (normalized.toLowerCase().includes(' and ')) {
    const parts = normalized.split(/\s+and\s+/i);
    if (parts.length === 2) {
      const street1 = parts[0].trim();
      const street2 = parts[1].trim();
      
      // Don't add "Street" if it already has a suffix (Avenue, Road, etc.)
      const streetSuffixes = ['street', 'st', 'avenue', 'ave', 'road', 'rd', 'drive', 'dr', 
                              'boulevard', 'blvd', 'court', 'ct', 'crescent', 'cres', 'way', 'wy',
                              'lane', 'ln', 'place', 'pl', 'circle', 'cir', 'parkway', 'pkwy'];
      const hasSuffix1 = streetSuffixes.some(s => street1.toLowerCase().endsWith(s));
      const hasSuffix2 = streetSuffixes.some(s => street2.toLowerCase().endsWith(s));
      
      // Only add "Street" if neither has a suffix and they're short (likely street names)
      if (!hasSuffix1 && !hasSuffix2 && street1.length < 20 && street2.length < 20) {
        const normalized1 = `${street1} Street`;
        const normalized2 = `${street2} Street`;
        return `${normalized1} and ${normalized2}`;
      }
      
      return `${street1} and ${street2}`;
    }
  }
  
  return normalized;
};

// Geocode an address or intersection in Toronto
export const geocodeAddress = async (address: string): Promise<Coordinate | null> => {
  try {
    // Normalize the input for better results
    const normalized = normalizeIntersection(address);
    
    // Try original input first, then normalized versions
    const queries = [
      `${address}, Toronto, Ontario, Canada`, // Try original first
      `${normalized}, Toronto, Ontario, Canada`,
      `${normalized}, Toronto, ON, Canada`,
      normalized.includes(' and ') ? `${normalized}, Toronto` : `${normalized}, Toronto, Ontario`,
      `${address}, Toronto, ON, Canada`, // Try original with different format
    ];

    for (let i = 0; i < queries.length; i++) {
      try {
        // Add delay between requests to avoid rate limiting (except first request)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const query = queries[i];
        const encodedQuery = encodeURIComponent(query);
        
        // Nominatim requires a User-Agent header and has rate limiting
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=5&addressdetails=1&bounded=1&viewbox=-79.64,43.58,-79.12,43.85`,
          {
            headers: {
              'User-Agent': '6ixAssist/1.0 (Toronto Community Resource Finder)',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          console.warn(`Nominatim API returned status: ${response.status}`, errorText);
          // If rate limited, wait longer before next attempt
          if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          continue;
        }

        const data = await response.json();
        
        if (!data || data.length === 0) {
          continue;
        }

        // Find the best match (prefer results in Toronto)
        for (const result of data) {
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);

          // Check if coordinates are valid numbers
          if (isNaN(lat) || isNaN(lng)) {
            continue;
          }

          // Validate coordinates are in Toronto (with some buffer)
          if (lat >= 43.55 && lat <= 43.88 && lng >= -79.67 && lng <= -79.09) {
            console.log(`Successfully geocoded "${address}" to ${lat}, ${lng}`);
            return { lat, lng };
          }
        }
      } catch (error) {
        console.warn(`Geocoding attempt ${i + 1} failed for query: ${queries[i]}`, error);
        // Continue to next query
        continue;
      }
    }

    console.warn(`Could not geocode address: "${address}"`);
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

// Geocode using Google Places API if available (more accurate)
export const geocodeAddressGoogle = async (address: string): Promise<Coordinate | null> => {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return null; // Fall back to OSM
  }

  try {
    // Normalize the input
    const normalized = normalizeIntersection(address);
    
    // Try multiple query formats
    const queries = [
      `${normalized}, Toronto, ON, Canada`,
      `${normalized}, Toronto, Ontario, Canada`,
      normalized.includes(' and ') ? `${normalized}, Toronto` : `${normalized}, Toronto, ON`,
    ];

    for (const query of queries) {
      try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=${apiKey}&region=ca&bounds=43.58,-79.64|43.85,-79.12`
        );

        if (!response.ok) continue;

        const data = await response.json();
        
        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
          continue;
        }

        // Find the best match in Toronto
        for (const result of data.results) {
          const location = result.geometry.location;
          const lat = location.lat;
          const lng = location.lng;

          // Validate coordinates are in Toronto
          if (lat >= 43.58 && lat <= 43.85 && lng >= -79.64 && lng <= -79.12) {
            return { lat, lng };
          }
        }
      } catch (error) {
        console.warn(`Google geocoding attempt failed for query: ${query}`, error);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error geocoding with Google:', error);
    return null;
  }
};

// Main geocoding function - tries Google first, falls back to OSM
export const geocode = async (address: string): Promise<Coordinate | null> => {
  // Try Google first if available
  const googleResult = await geocodeAddressGoogle(address);
  if (googleResult) {
    return googleResult;
  }

  // Fall back to OSM
  return geocodeAddress(address);
};

