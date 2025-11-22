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
}

export interface AIResponse {
  summary: string;
  resources: Resource[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}