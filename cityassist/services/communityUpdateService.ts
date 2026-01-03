// Community Update Service
// Handles community-driven updates for establishments

import { CommunityUpdate, User } from '../types';
import { getCurrentUser } from './authService';

const STORAGE_KEY = '6ixassist_community_updates';

// Get all community updates
export const getAllCommunityUpdates = (): CommunityUpdate[] => {
  try {
    const updatesStr = localStorage.getItem(STORAGE_KEY);
    if (!updatesStr) return [];
    return JSON.parse(updatesStr);
  } catch {
    return [];
  }
};

// Get updates for a specific establishment
export const getEstablishmentUpdates = (establishmentId: string): CommunityUpdate[] => {
  const allUpdates = getAllCommunityUpdates();
  return allUpdates
    .filter(update => update.establishmentId === establishmentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Get most recent update for an establishment
export const getLatestUpdate = (establishmentId: string): CommunityUpdate | null => {
  const updates = getEstablishmentUpdates(establishmentId);
  return updates.length > 0 ? updates[0] : null;
};

// Create a new community update
export const createCommunityUpdate = async (
  establishmentId: string,
  type: 'meals' | 'beds' | 'notes',
  content: string,
  establishmentName?: string
): Promise<CommunityUpdate> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to create updates');
  }

  const update: CommunityUpdate = {
    id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    establishmentId,
    type,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    createdBy: user.id,
    location: establishmentName,
    reporter: user.displayName || user.email.split('@')[0],
    time: 'Just now',
  };

  const allUpdates = getAllCommunityUpdates();
  allUpdates.push(update);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allUpdates));

  return update;
};

// Format time ago
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  return date.toLocaleDateString();
};

// Get all updates with formatted times
export const getAllUpdatesFormatted = (): CommunityUpdate[] => {
  const updates = getAllCommunityUpdates();
  return updates.map(update => ({
    ...update,
    time: formatTimeAgo(update.createdAt),
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Check if update is stale (>24 hours)
export const isUpdateStale = (update: CommunityUpdate): boolean => {
  const updateDate = new Date(update.createdAt);
  const now = new Date();
  const diffHours = (now.getTime() - updateDate.getTime()) / 3600000;
  return diffHours > 24;
};

