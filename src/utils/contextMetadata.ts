/**
 * contextMetadata.ts
 *
 * Context 메타데이터 관리 유틸리티
 * Context의 버전, 의존성, 상태 등을 체계적으로 관리
 */

import type { ContextMetadata, KnownContextNames } from '../types/contextBridge.types';

/**
 * 알려진 Context들의 메타데이터 정의
 */
export const CONTEXT_METADATA: Record<KnownContextNames, Partial<ContextMetadata>> = {
  toast: {
    name: 'toast',
    version: '1.0.0',
    description: 'Toast 알림 시스템',
    dependencies: []
  },
  schedule: {
    name: 'schedule',
    version: '1.0.0',
    description: '일정 관리 시스템',
    dependencies: ['toast']
  },
  buildup: {
    name: 'buildup',
    version: '1.0.0',
    description: '빌드업 프로젝트 관리',
    dependencies: ['toast', 'schedule']
  },
  chat: {
    name: 'chat',
    version: '1.0.0',
    description: '채팅 시스템',
    dependencies: ['toast', 'currentUser']
  },
  calendar: {
    name: 'calendar',
    version: '1.0.0',
    description: '캘린더 시스템',
    dependencies: ['schedule']
  },
  userProfile: {
    name: 'userProfile',
    version: '1.0.0',
    description: '사용자 프로필 관리',
    dependencies: []
  },
  notification: {
    name: 'notification',
    version: '1.0.0',
    description: '알림 시스템',
    dependencies: ['toast', 'currentUser']
  },
  vdr: {
    name: 'vdr',
    version: '1.0.0',
    description: 'VDR 문서 관리',
    dependencies: ['userProfile']
  },
  cluster: {
    name: 'cluster',
    version: '1.0.0',
    description: '클러스터 분석',
    dependencies: []
  },
  kpiDiagnosis: {
    name: 'kpiDiagnosis',
    version: '1.0.0',
    description: 'KPI 진단 시스템',
    dependencies: ['cluster']
  },
  applicationProgress: {
    name: 'applicationProgress',
    version: '1.0.0',
    description: '신청 진행 상황',
    dependencies: []
  },
  industryIntel: {
    name: 'industryIntel',
    version: '1.0.0',
    description: '산업 인텔리전스',
    dependencies: []
  },
  growthTracking: {
    name: 'growthTracking',
    version: '1.0.0',
    description: '성장 추적',
    dependencies: []
  },
  recommendation: {
    name: 'recommendation',
    version: '1.0.0',
    description: '추천 시스템',
    dependencies: ['userProfile']
  },
  meetingNotes: {
    name: 'meetingNotes',
    version: '1.0.0',
    description: '미팅 노트 관리',
    dependencies: ['schedule']
  },
  currentUser: {
    name: 'currentUser',
    version: '1.0.0',
    description: '현재 사용자 정보',
    dependencies: ['userProfile']
  },
  myProfile: {
    name: 'myProfile',
    version: '1.0.0',
    description: '내 프로필',
    dependencies: ['currentUser']
  },
  userDocument: {
    name: 'userDocument',
    version: '1.0.0',
    description: '사용자 문서 관리',
    dependencies: ['userProfile']
  },
  loading: {
    name: 'loading',
    version: '1.0.0',
    description: '로딩 상태 관리',
    dependencies: []
  }
};

/**
 * Context 의존성 그래프 생성
 */
export class ContextDependencyGraph {
  private dependencies: Map<string, Set<string>> = new Map();
  private dependents: Map<string, Set<string>> = new Map();

  constructor() {
    this.buildGraph();
  }

  /**
   * 의존성 그래프 구축
   */
  private buildGraph() {
    Object.entries(CONTEXT_METADATA).forEach(([name, metadata]) => {
      const deps = metadata.dependencies || [];

      // Dependencies 설정
      this.dependencies.set(name, new Set(deps));

      // Dependents 설정 (역방향)
      deps.forEach(dep => {
        if (!this.dependents.has(dep)) {
          this.dependents.set(dep, new Set());
        }
        this.dependents.get(dep)!.add(name);
      });
    });
  }

  /**
   * Context의 의존성 가져오기
   */
  getDependencies(contextName: string): string[] {
    return Array.from(this.dependencies.get(contextName) || []);
  }

  /**
   * Context에 의존하는 다른 Context들 가져오기
   */
  getDependents(contextName: string): string[] {
    return Array.from(this.dependents.get(contextName) || []);
  }

  /**
   * 초기화 순서 계산 (의존성 기반)
   */
  getInitializationOrder(): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);

      // 먼저 의존성들을 방문
      const deps = this.getDependencies(name);
      deps.forEach(dep => visit(dep));

      // 그 다음 자신을 추가
      result.push(name);
    };

    // 모든 Context를 방문
    Object.keys(CONTEXT_METADATA).forEach(name => visit(name));

    return result;
  }

  /**
   * 순환 의존성 검사
   */
  hasCircularDependency(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (name: string): boolean => {
      visited.add(name);
      recursionStack.add(name);

      const deps = this.getDependencies(name);
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) return true;
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }

      recursionStack.delete(name);
      return false;
    };

    for (const name of Object.keys(CONTEXT_METADATA)) {
      if (!visited.has(name)) {
        if (hasCycle(name)) return true;
      }
    }

    return false;
  }

  /**
   * 의존성 트리 시각화 (콘솔용)
   */
  printDependencyTree() {
    console.group('🌳 Context Dependency Tree');

    const printed = new Set<string>();

    const printNode = (name: string, indent: string = '', isLast: boolean = true) => {
      if (printed.has(name)) {
        console.log(`${indent}${isLast ? '└─' : '├─'} ${name} (already shown)`);
        return;
      }

      printed.add(name);
      console.log(`${indent}${isLast ? '└─' : '├─'} ${name}`);

      const deps = this.getDependencies(name);
      const newIndent = indent + (isLast ? '   ' : '│  ');

      deps.forEach((dep, index) => {
        printNode(dep, newIndent, index === deps.length - 1);
      });
    };

    // 의존성이 없는 루트 Context들부터 시작
    const roots = Object.keys(CONTEXT_METADATA).filter(
      name => this.getDependencies(name).length === 0
    );

    roots.forEach((root, index) => {
      console.log(`\n📦 ${root} (root)`);
      const dependents = this.getDependents(root);
      dependents.forEach((dep, i) => {
        printNode(dep, '', i === dependents.length - 1);
      });
    });

    console.groupEnd();
  }
}

/**
 * 메타데이터 유효성 검증
 */
export function validateMetadata(metadata: Partial<ContextMetadata>): boolean {
  if (!metadata.name) {
    console.error('Metadata validation failed: name is required');
    return false;
  }

  if (!metadata.version) {
    console.warn(`Metadata for "${metadata.name}": version is recommended`);
  }

  if (metadata.dependencies) {
    const invalidDeps = metadata.dependencies.filter(
      dep => !(dep in CONTEXT_METADATA)
    );

    if (invalidDeps.length > 0) {
      console.error(`Invalid dependencies for "${metadata.name}":`, invalidDeps);
      return false;
    }
  }

  return true;
}

/**
 * 메타데이터 병합
 */
export function mergeMetadata(
  base: Partial<ContextMetadata>,
  override: Partial<ContextMetadata>
): ContextMetadata {
  const now = new Date();

  return {
    name: override.name || base.name || 'unknown',
    version: override.version || base.version || '1.0.0',
    description: override.description || base.description,
    dependencies: [...(base.dependencies || []), ...(override.dependencies || [])],
    isReady: override.isReady ?? base.isReady ?? false,
    registeredAt: base.registeredAt || now,
    lastUpdated: now
  };
}

/**
 * Context 상태 요약
 */
export function getContextSummary(name: string): string {
  const metadata = CONTEXT_METADATA[name as KnownContextNames];

  if (!metadata) {
    return `Unknown context: ${name}`;
  }

  const deps = metadata.dependencies || [];
  const depGraph = new ContextDependencyGraph();
  const dependents = depGraph.getDependents(name);

  return `
Context: ${metadata.name}
Version: ${metadata.version}
Description: ${metadata.description}
Dependencies: ${deps.length > 0 ? deps.join(', ') : 'None'}
Depended by: ${dependents.length > 0 ? dependents.join(', ') : 'None'}
  `.trim();
}

// 싱글톤 인스턴스
export const contextDependencyGraph = new ContextDependencyGraph();

// 개발 환경에서 전역 노출
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__contextDependencyGraph__ = contextDependencyGraph;
  (window as any).__printContextTree__ = () => contextDependencyGraph.printDependencyTree();
}

export default {
  CONTEXT_METADATA,
  ContextDependencyGraph,
  validateMetadata,
  mergeMetadata,
  getContextSummary,
  contextDependencyGraph
};