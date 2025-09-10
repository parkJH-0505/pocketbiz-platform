import type { AxisKey } from '../types';

export function getAxisColor(axis: string): string {
  const colors: Record<string, string> = {
    GO: 'bg-axis-GO-light text-axis-GO-main',
    EC: 'bg-axis-EC-light text-axis-EC-main',
    PT: 'bg-axis-PT-light text-axis-PT-main',
    PF: 'bg-axis-PF-light text-axis-PF-main',
    TO: 'bg-axis-TO-light text-axis-TO-main',
  };
  return colors[axis] || 'bg-neutral-light text-neutral-gray';
}

export function getAxisBorderColor(axis: string): string {
  const colors: Record<string, string> = {
    GO: 'border-axis-GO-main',
    EC: 'border-axis-EC-main',
    PT: 'border-axis-PT-main',
    PF: 'border-axis-PF-main',
    TO: 'border-axis-TO-main',
  };
  return colors[axis] || 'border-neutral-gray';
}

export function getAxisBgColor(axis: string): string {
  const colors: Record<string, string> = {
    GO: 'bg-axis-GO-main',
    EC: 'bg-axis-EC-main',
    PT: 'bg-axis-PT-main',
    PF: 'bg-axis-PF-main',
    TO: 'bg-axis-TO-main',
  };
  return colors[axis] || 'bg-neutral-gray';
}

export function getAxisTextColor(axis: string): string {
  const colors: Record<string, string> = {
    GO: 'text-axis-GO-main',
    EC: 'text-axis-EC-main',
    PT: 'text-axis-PT-main',
    PF: 'text-axis-PF-main',
    TO: 'text-axis-TO-main',
  };
  return colors[axis] || 'text-neutral-gray';
}

export function getAxisLightBgColor(axis: string): string {
  const colors: Record<string, string> = {
    GO: 'bg-axis-GO-light',
    EC: 'bg-axis-EC-light',
    PT: 'bg-axis-PT-light',
    PF: 'bg-axis-PF-light',
    TO: 'bg-axis-TO-light',
  };
  return colors[axis] || 'bg-neutral-light';
}
