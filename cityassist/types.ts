export interface Coordinate {
  lat: number;
  lng: number;
}

export enum ResourceCategory {
  FOOD = 'Food',
  SHELTER = 'Shelter',
  LEGAL = 'Legal',
  HEALTH = 'Health',
  COMMUNITY = 'Community',
  CRISIS = 'Crisis',
}

// Legacy Resource interface for backward compatibility
export interface Resource {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  hours: string;
  description: string;
  phone?: string;
  website?: string;
  isEmergency?: boolean;
  source?: string; // e.g., "Toronto Open Data"
  placeId?: string; // Google Places place_id for accurate directions
}

// New Establishment model matching requirements
export interface Establishment {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  source: 'Toronto Open Data' | 'Google Places' | 'OSM' | 'Externally Sourced';
  lastVerified: string; // ISO date string
  hours?: string;
  description?: string;
  phone?: string;
  website?: string;
  isEmergency?: boolean;
  placeId?: string; // Google Places place_id for accurate directions
  // Additional fields for compatibility
  lat?: number; // Alias for latitude
  lng?: number; // Alias for longitude
}

// Community Update model
export interface CommunityUpdate {
  id: string;
  establishmentId: string;
  type: 'meals' | 'beds' | 'notes';
  content: string;
  createdAt: string; // ISO date string
  createdBy: string; // User ID
  // Additional fields for display
  location?: string; // Establishment name for display
  reporter?: string; // User display name
  time?: string; // Human-readable time
}

// User model
export interface User {
  id: string;
  email: string;
  savedEstablishments: string[]; // Array of establishment IDs
  displayName?: string;
}

export interface AIResponse {
  summary: string;
  resources: Resource[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}