import type { BuildupService, AxisKey, StageType } from '../types/buildup.types';
import buildupServicesData from '../data/buildupServices.json';

// Load services from JSON file
export async function loadBuildupServices(): Promise<BuildupService[]> {
  try {
    // Load from JSON data file
    return buildupServicesData.services as BuildupService[];
  } catch (error) {
    console.error('Failed to load buildup services:', error);
    return [];
  }
}


// Utility functions for filtering and searching
export function filterServicesByCategory(services: BuildupService[], category: string): BuildupService[] {
  if (!category || category === '전체') return services;
  return services.filter(s => s.category === category);
}

export function filterServicesByAxis(services: BuildupService[], axis: AxisKey[]): BuildupService[] {
  if (!axis || axis.length === 0) return services;
  return services.filter(s => 
    axis.some(a => s.target_axis.includes(a))
  );
}

export function filterServicesByStage(services: BuildupService[], stage: StageType): BuildupService[] {
  if (!stage) return services;
  return services.filter(s => s.target_stage.includes(stage));
}

export function searchServices(services: BuildupService[], query: string): BuildupService[] {
  if (!query) return services;
  const lowercaseQuery = query.toLowerCase();
  return services.filter(s => 
    s.name.toLowerCase().includes(lowercaseQuery) ||
    s.description.toLowerCase().includes(lowercaseQuery) ||
    s.subtitle.toLowerCase().includes(lowercaseQuery)
  );
}

export function sortServicesByRecommendation(
  services: BuildupService[], 
  userAxis: Record<AxisKey, number>
): BuildupService[] {
  return services.sort((a, b) => {
    // Calculate relevance score based on user's weak axes
    const aScore = calculateRelevanceScore(a, userAxis);
    const bScore = calculateRelevanceScore(b, userAxis);
    return bScore - aScore;
  });
}

function calculateRelevanceScore(service: BuildupService, userAxis: Record<AxisKey, number>): number {
  let score = 0;
  
  service.target_axis.forEach(axis => {
    const userScore = userAxis[axis] || 0;
    // Higher score for services targeting user's weak areas (low scores)
    if (userScore < 70) {
      score += (100 - userScore) * service.expected_improvement / 100;
    }
  });
  
  // Bonus for high ratings and completion rate
  score += service.avg_rating * 10;
  score += service.completion_rate / 10;
  
  return score;
}

export function calculateBundleDiscount(cartItems: BuildupService[]): number {
  const totalBase = cartItems.reduce((sum, item) => sum + item.price_base, 0);
  const totalPackage = cartItems.reduce((sum, item) => sum + item.price_package, 0);
  
  if (cartItems.length >= 3) {
    // 20% discount for 3+ items
    return totalBase * 0.2;
  } else if (cartItems.length === 2) {
    // 10% discount for 2 items
    return totalBase * 0.1;
  }
  
  return totalBase - totalPackage;
}

export function getServicesByProvider(services: BuildupService[], provider: '포켓' | '파트너사'): BuildupService[] {
  return services.filter(s => s.provider === provider);
}

export function getTopRatedServices(services: BuildupService[], limit: number = 5): BuildupService[] {
  return [...services]
    .sort((a, b) => b.avg_rating - a.avg_rating)
    .slice(0, limit);
}

export function getPopularServices(services: BuildupService[], limit: number = 5): BuildupService[] {
  return [...services]
    .sort((a, b) => b.review_count - a.review_count)
    .slice(0, limit);
}