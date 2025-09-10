// Type helpers and utilities

import type { AxisKey } from '../types';

// Create empty axis scores
export function createEmptyAxisScores(): Record<AxisKey, number> {
  return {
    GO: 0,
    EC: 0,
    PT: 0,
    PF: 0,
    TO: 0
  };
}

// Type guard for checking if an object has all axis keys
export function isAxisScoreRecord(obj: any): obj is Record<AxisKey, number> {
  const requiredKeys: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  return requiredKeys.every(key => key in obj && typeof obj[key] === 'number');
}

// Fix for API headers
export function createAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}