// Type fixes and utilities

// Fix for csvParser.ts
export interface KPIStageRulesCSVFixed {
  kpi_id: string;
  stage: string;
  weight: string;
  ruleset_text: string;
  input_type?: string; // Make optional
}

// Fix for API headers
export function createHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

// Fix for benchmarks type
import type { AxisKey } from '../types';

export function createEmptyBenchmarks() {
  const empty: Record<AxisKey, number> = {
    GO: 0,
    EC: 0,
    PT: 0,
    PF: 0,
    TO: 0
  };
  
  return {
    peerAvg: empty,
    industryTop: empty,
    target: empty
  };
}