// Authentication Service
// Simple authentication using localStorage for MVP
// In production, this would use Firebase Auth, Auth0, or similar

import { User } from '../types';

const STORAGE_KEY = '6ixassist_user';
const STORAGE_AUTH_KEY = '6ixassist_auth_token';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

// Get current user from storage
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEY);
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Sign in with email (simple implementation for MVP)
export const signIn = async (email: string): Promise<User> => {
  // In production, this would call an auth API
  // For MVP, we'll create a simple user record
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const user: User = {
    id: userId,
    email: email.toLowerCase().trim(),
    savedEstablishments: [],
    displayName: email.split('@')[0],
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(STORAGE_AUTH_KEY, `token_${userId}`);
  
  return user;
};

// Sign out
export const signOut = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_AUTH_KEY);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

// Get auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_AUTH_KEY);
};

// Update user saved establishments
export const updateUserSavedEstablishments = (establishmentIds: string[]): void => {
  const user = getCurrentUser();
  if (!user) return;

  user.savedEstablishments = establishmentIds;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

// Add saved establishment
export const addSavedEstablishment = (establishmentId: string): void => {
  const user = getCurrentUser();
  if (!user) return;

  if (!user.savedEstablishments.includes(establishmentId)) {
    user.savedEstablishments.push(establishmentId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
};

// Remove saved establishment
export const removeSavedEstablishment = (establishmentId: string): void => {
  const user = getCurrentUser();
  if (!user) return;

  user.savedEstablishments = user.savedEstablishments.filter(id => id !== establishmentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

// Check if establishment is saved
export const isEstablishmentSaved = (establishmentId: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.savedEstablishments.includes(establishmentId);
};

