import type { BuildupService, ProcessStep, AxisKey, StageType } from '../types/buildup.types';

export async function loadBuildupServices(): Promise<BuildupService[]> {
  try {
    // Use mock data for now - CSV loading will be implemented later
    return getMockServices();
    
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    
    const services: BuildupService[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length !== headers.length) continue;
      
      const service: BuildupService = {
        service_id: values[0],
        category: values[1] as BuildupService['category'],
        name: values[2],
        subtitle: values[3],
        description: values[4],
        target_axis: values[5].split('|') as AxisKey[],
        expected_improvement: parseInt(values[6]),
        target_stage: values[7].split('|') as StageType[],
        duration_weeks: parseInt(values[8]),
        price_base: parseInt(values[9]),
        price_urgent: parseInt(values[10]),
        price_package: parseInt(values[11]),
        provider: values[12] as BuildupService['provider'],
        format: values[13] as BuildupService['format'],
        deliverables: values[14].split('|'),
        process_steps: parseProcessSteps(values[15]),
        portfolio_count: parseInt(values[16]),
        avg_rating: parseFloat(values[17]),
        review_count: parseInt(values[18]),
        completion_rate: parseInt(values[19]),
        status: values[20] as BuildupService['status']
      };
      
      services.push(service);
    }
    
    return services;
  } catch (error) {
    console.error('Failed to load buildup services:', error);
    return getMockServices(); // Fallback to mock data
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseProcessSteps(stepsString: string): ProcessStep[] {
  const steps = stepsString.split('|');
  return steps.map(step => {
    const match = step.match(/(.+)\((.+)\)/);
    if (match) {
      return {
        name: match[1].trim(),
        duration: match[2].trim()
      };
    }
    return {
      name: step.trim(),
      duration: ''
    };
  });
}

// Mock data as fallback
function getMockServices(): BuildupService[] {
  return [
    {
      service_id: 'SRV-001',
      category: '문서작업',
      name: 'IR 피칭덱 전문 컨설팅',
      subtitle: '투자유치를 위한 완벽한 IR덱 제작',
      description: '투자자 관점에서 스타트업의 가치를 효과적으로 전달하는 IR 피칭덱을 제작합니다.',
      target_axis: ['PF'],
      expected_improvement: 20,
      target_stage: ['A2', 'A3', 'A4'],
      duration_weeks: 2,
      price_base: 3000000,
      price_urgent: 4500000,
      price_package: 2700000,
      provider: '포켓',
      format: 'hybrid',
      deliverables: ['IR덱 PPT', '피치 스크립트', 'Q&A 예상문답', '투자자 리스트'],
      process_steps: [
        { name: '비즈니스 분석', duration: '3일' },
        { name: '콘텐츠 기획', duration: '2일' },
        { name: '디자인 작업', duration: '5일' },
        { name: '피드백 반영', duration: '4일' }
      ],
      portfolio_count: 127,
      avg_rating: 4.8,
      review_count: 89,
      completion_rate: 95,
      status: 'active'
    },
    {
      service_id: 'SRV-002',
      category: '개발',
      name: 'MVP 개발 패키지',
      subtitle: '아이디어를 제품으로 구현',
      description: '핵심 기능 중심의 MVP를 개발하여 시장 검증을 빠르게 진행할 수 있도록 지원합니다.',
      target_axis: ['PT'],
      expected_improvement: 25,
      target_stage: ['A1', 'A2', 'A3'],
      duration_weeks: 8,
      price_base: 12000000,
      price_urgent: 18000000,
      price_package: 10800000,
      provider: '포켓',
      format: 'hybrid',
      deliverables: ['MVP 제품', '소스코드', '기술문서', '배포 가이드'],
      process_steps: [
        { name: '기획', duration: '2주' },
        { name: '디자인', duration: '2주' },
        { name: '개발', duration: '3주' },
        { name: '테스트', duration: '1주' }
      ],
      portfolio_count: 42,
      avg_rating: 4.7,
      review_count: 38,
      completion_rate: 90,
      status: 'active'
    },
    {
      service_id: 'SRV-003',
      category: '마케팅',
      name: '디지털 마케팅 전략',
      subtitle: '데이터 기반 통합 마케팅',
      description: '타겟 고객 분석부터 채널별 전략, KPI 설정까지 통합 디지털 마케팅 전략을 수립합니다.',
      target_axis: ['EC', 'PF'],
      expected_improvement: 18,
      target_stage: ['A2', 'A3', 'A4'],
      duration_weeks: 3,
      price_base: 3500000,
      price_urgent: 5250000,
      price_package: 3150000,
      provider: '포켓',
      format: 'online',
      deliverables: ['마케팅 전략서', '채널별 실행안', 'KPI 대시보드', '예산 계획'],
      process_steps: [
        { name: '시장 분석', duration: '1주' },
        { name: '전략 수립', duration: '1주' },
        { name: '실행 계획', duration: '1주' }
      ],
      portfolio_count: 74,
      avg_rating: 4.8,
      review_count: 62,
      completion_rate: 93,
      status: 'active'
    }
  ];
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