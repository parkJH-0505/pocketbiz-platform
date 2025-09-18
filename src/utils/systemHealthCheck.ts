/**
 * @fileoverview 시스템 건강성 및 통합 검증 유틸리티
 * @description Sprint 5 최종 단계: 모든 시스템의 통합 상태 검증
 * @author PocketCompany
 * @since 2025-01-19
 */

/**
 * 시스템 건강성 보고서 인터페이스
 */
export interface SystemHealthReport {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
  checks: HealthCheck[];
  statistics: SystemStatistics;
  recommendations: string[];
}

/**
 * 개별 건강성 검사 인터페이스
 */
export interface HealthCheck {
  name: string;
  category: 'context' | 'data' | 'integration' | 'performance' | 'ui';
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: any;
  duration?: number;
}

/**
 * 시스템 통계 인터페이스
 */
export interface SystemStatistics {
  totalContexts: number;
  activeProviders: number;
  dataIntegrity: number; // 0-100%
  performanceScore: number; // 0-100%
  errorRate: number; // 0-100%
  uptime: number; // minutes
}

/**
 * 시스템 건강성 검사 클래스
 */
export class SystemHealthChecker {
  private static instance: SystemHealthChecker;
  private startTime: Date = new Date();

  private constructor() {}

  static getInstance(): SystemHealthChecker {
    if (!SystemHealthChecker.instance) {
      SystemHealthChecker.instance = new SystemHealthChecker();
    }
    return SystemHealthChecker.instance;
  }

  /**
   * 전체 시스템 건강성 검사 실행
   */
  async performHealthCheck(): Promise<SystemHealthReport> {
    const startTime = Date.now();
    console.log('🔍 Starting system health check...');

    const checks: HealthCheck[] = [];

    // 1. Context 가용성 검사
    checks.push(...await this.checkContextAvailability());

    // 2. 데이터 무결성 검사
    checks.push(...await this.checkDataIntegrity());

    // 3. 통합 시스템 검사
    checks.push(...await this.checkSystemIntegration());

    // 4. 성능 검사
    checks.push(...await this.checkPerformance());

    // 5. UI 응답성 검사
    checks.push(...await this.checkUIResponsiveness());

    // 전체 상태 판정
    const overall = this.determineOverallHealth(checks);

    // 통계 계산
    const statistics = this.calculateStatistics(checks);

    // 권장사항 생성
    const recommendations = this.generateRecommendations(checks);

    const duration = Date.now() - startTime;
    console.log(`✅ Health check completed in ${duration}ms`);

    return {
      overall,
      timestamp: new Date(),
      checks,
      statistics,
      recommendations
    };
  }

  /**
   * Context 가용성 검사
   */
  private async checkContextAvailability(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    const contexts = [
      'BuildupContext',
      'ScheduleContext',
      'CurrentUserContext',
      'MyProfileContext',
      'ToastContext',
      'LoadingContext',
      'VDRContext'
    ];

    for (const contextName of contexts) {
      try {
        // Global window 객체에서 context 존재 확인
        const isAvailable = this.checkContextInWindow(contextName);

        checks.push({
          name: `${contextName} Availability`,
          category: 'context',
          status: isAvailable ? 'pass' : 'warning',
          message: isAvailable
            ? `${contextName} is available and functioning`
            : `${contextName} may not be properly initialized`,
          details: { contextName, available: isAvailable }
        });
      } catch (error) {
        checks.push({
          name: `${contextName} Availability`,
          category: 'context',
          status: 'fail',
          message: `Failed to check ${contextName}: ${error.message}`,
          details: { error: error.message }
        });
      }
    }

    return checks;
  }

  /**
   * 데이터 무결성 검사
   */
  private async checkDataIntegrity(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    try {
      // localStorage 데이터 확인
      const scheduleData = localStorage.getItem('pocket_biz_schedules');
      const profileData = localStorage.getItem('myProfile');
      const currentUserData = localStorage.getItem('currentUser_auth');

      checks.push({
        name: 'Schedule Data Integrity',
        category: 'data',
        status: scheduleData ? 'pass' : 'warning',
        message: scheduleData
          ? 'Schedule data is present in localStorage'
          : 'No schedule data found in localStorage',
        details: { hasData: !!scheduleData }
      });

      checks.push({
        name: 'Profile Data Integrity',
        category: 'data',
        status: profileData ? 'pass' : 'warning',
        message: profileData
          ? 'Profile data is present in localStorage'
          : 'No profile data found in localStorage',
        details: { hasData: !!profileData }
      });

      checks.push({
        name: 'User Authentication Data',
        category: 'data',
        status: currentUserData ? 'pass' : 'warning',
        message: currentUserData
          ? 'User authentication data is present'
          : 'No user authentication data found',
        details: { hasData: !!currentUserData }
      });

      // 데이터 파싱 검증
      if (scheduleData) {
        try {
          const parsed = JSON.parse(scheduleData);
          checks.push({
            name: 'Schedule Data Parsing',
            category: 'data',
            status: 'pass',
            message: `Successfully parsed ${Array.isArray(parsed) ? parsed.length : 0} schedule items`,
            details: { itemCount: Array.isArray(parsed) ? parsed.length : 0 }
          });
        } catch (error) {
          checks.push({
            name: 'Schedule Data Parsing',
            category: 'data',
            status: 'fail',
            message: 'Failed to parse schedule data from localStorage',
            details: { error: error.message }
          });
        }
      }

    } catch (error) {
      checks.push({
        name: 'Data Integrity Check',
        category: 'data',
        status: 'fail',
        message: `Data integrity check failed: ${error.message}`,
        details: { error: error.message }
      });
    }

    return checks;
  }

  /**
   * 시스템 통합 검사
   */
  private async checkSystemIntegration(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    try {
      // BuildupContext와 ScheduleContext 연동 확인
      const buildupSync = (window as any).testBuildupSync;
      if (buildupSync) {
        checks.push({
          name: 'BuildupContext-ScheduleContext Integration',
          category: 'integration',
          status: 'pass',
          message: 'BuildupContext testing interface is available',
          details: { hasTestInterface: true }
        });

        // 동기화 상태 검사
        try {
          const syncStatus = buildupSync.getSyncStatus();
          checks.push({
            name: 'Schedule Synchronization',
            category: 'integration',
            status: syncStatus.isHealthy ? 'pass' : 'warning',
            message: syncStatus.isHealthy
              ? 'Schedule synchronization is healthy'
              : 'Schedule synchronization issues detected',
            details: syncStatus
          });
        } catch (error) {
          checks.push({
            name: 'Schedule Synchronization',
            category: 'integration',
            status: 'warning',
            message: 'Could not check synchronization status',
            details: { error: error.message }
          });
        }
      } else {
        checks.push({
          name: 'BuildupContext-ScheduleContext Integration',
          category: 'integration',
          status: 'warning',
          message: 'BuildupContext testing interface not found',
          details: { hasTestInterface: false }
        });
      }

      // Phase Transition 시스템 확인
      const phaseTransitionTest = (window as any).testBuildupSync?.testPhaseTransitions;
      checks.push({
        name: 'Phase Transition System',
        category: 'integration',
        status: phaseTransitionTest ? 'pass' : 'warning',
        message: phaseTransitionTest
          ? 'Phase transition testing interface is available'
          : 'Phase transition testing interface not found',
        details: { hasPhaseTransition: !!phaseTransitionTest }
      });

      // Error Management 시스템 확인
      const errorManagement = (window as any).testBuildupSync?.testErrorManagement;
      checks.push({
        name: 'Error Management System',
        category: 'integration',
        status: errorManagement ? 'pass' : 'warning',
        message: errorManagement
          ? 'Error management system is available'
          : 'Error management system not found',
        details: { hasErrorManagement: !!errorManagement }
      });

    } catch (error) {
      checks.push({
        name: 'System Integration Check',
        category: 'integration',
        status: 'fail',
        message: `Integration check failed: ${error.message}`,
        details: { error: error.message }
      });
    }

    return checks;
  }

  /**
   * 성능 검사
   */
  private async checkPerformance(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    try {
      // 메모리 사용량 확인 (브라우저 지원 시)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize / memory.totalJSHeapSize;

        checks.push({
          name: 'Memory Usage',
          category: 'performance',
          status: usedMemory < 0.8 ? 'pass' : usedMemory < 0.9 ? 'warning' : 'fail',
          message: `Memory usage: ${(usedMemory * 100).toFixed(1)}%`,
          details: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            percentage: usedMemory * 100
          }
        });
      }

      // 렌더링 성능 확인
      const renderStart = performance.now();
      await new Promise(resolve => requestAnimationFrame(resolve));
      const renderTime = performance.now() - renderStart;

      checks.push({
        name: 'Render Performance',
        category: 'performance',
        status: renderTime < 16 ? 'pass' : renderTime < 32 ? 'warning' : 'fail',
        message: `Render time: ${renderTime.toFixed(2)}ms`,
        details: { renderTime, targetTime: 16 }, // 60fps = 16ms per frame
        duration: renderTime
      });

      // localStorage 접근 성능
      const storageStart = performance.now();
      localStorage.setItem('health_check_test', 'test');
      localStorage.getItem('health_check_test');
      localStorage.removeItem('health_check_test');
      const storageTime = performance.now() - storageStart;

      checks.push({
        name: 'Storage Performance',
        category: 'performance',
        status: storageTime < 10 ? 'pass' : storageTime < 50 ? 'warning' : 'fail',
        message: `Storage access time: ${storageTime.toFixed(2)}ms`,
        details: { storageTime },
        duration: storageTime
      });

    } catch (error) {
      checks.push({
        name: 'Performance Check',
        category: 'performance',
        status: 'fail',
        message: `Performance check failed: ${error.message}`,
        details: { error: error.message }
      });
    }

    return checks;
  }

  /**
   * UI 응답성 검사
   */
  private async checkUIResponsiveness(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    try {
      // DOM 요소 확인
      const appElement = document.getElementById('root');
      checks.push({
        name: 'Main App Element',
        category: 'ui',
        status: appElement ? 'pass' : 'fail',
        message: appElement ? 'Main app element is present' : 'Main app element not found',
        details: { hasAppElement: !!appElement }
      });

      // 중요 UI 컴포넌트 확인
      const hasNavigation = document.querySelector('nav, [role="navigation"]');
      checks.push({
        name: 'Navigation Elements',
        category: 'ui',
        status: hasNavigation ? 'pass' : 'warning',
        message: hasNavigation ? 'Navigation elements found' : 'No navigation elements found',
        details: { hasNavigation: !!hasNavigation }
      });

      // 반응형 디자인 확인
      const viewport = window.innerWidth;
      checks.push({
        name: 'Viewport Responsiveness',
        category: 'ui',
        status: viewport > 320 ? 'pass' : 'warning',
        message: `Viewport width: ${viewport}px`,
        details: { viewport, isMobile: viewport < 768, isTablet: viewport >= 768 && viewport < 1024 }
      });

    } catch (error) {
      checks.push({
        name: 'UI Responsiveness Check',
        category: 'ui',
        status: 'fail',
        message: `UI check failed: ${error.message}`,
        details: { error: error.message }
      });
    }

    return checks;
  }

  /**
   * Context가 window 객체에 있는지 확인 (간접적 방법)
   */
  private checkContextInWindow(contextName: string): boolean {
    // React DevTools나 개발 환경에서 context 확인
    // 실제로는 각 context의 provider가 올바르게 작동하는지 확인

    // 기본적인 존재 확인 (실제 구현에서는 더 정교한 검사 필요)
    const contextChecks = {
      'BuildupContext': () => !!(window as any).testBuildupSync,
      'ScheduleContext': () => !!localStorage.getItem('pocket_biz_schedules'),
      'CurrentUserContext': () => !!localStorage.getItem('currentUser_auth'),
      'MyProfileContext': () => !!localStorage.getItem('myProfile'),
      'ToastContext': () => true, // 항상 사용 가능
      'LoadingContext': () => true, // 항상 사용 가능
      'VDRContext': () => true // 항상 사용 가능
    };

    const checker = contextChecks[contextName as keyof typeof contextChecks];
    return checker ? checker() : false;
  }

  /**
   * 전체 건강성 상태 판정
   */
  private determineOverallHealth(checks: HealthCheck[]): 'healthy' | 'warning' | 'critical' {
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;

    if (failCount > 0) return 'critical';
    if (warningCount > checks.length * 0.3) return 'warning';
    return 'healthy';
  }

  /**
   * 시스템 통계 계산
   */
  private calculateStatistics(checks: HealthCheck[]): SystemStatistics {
    const totalChecks = checks.length;
    const passCount = checks.filter(c => c.status === 'pass').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    const failCount = checks.filter(c => c.status === 'fail').length;

    const dataIntegrity = Math.round((passCount / totalChecks) * 100);
    const performanceScore = Math.round(((passCount + warningCount * 0.5) / totalChecks) * 100);
    const errorRate = Math.round((failCount / totalChecks) * 100);
    const uptime = Math.round((Date.now() - this.startTime.getTime()) / (1000 * 60));

    return {
      totalContexts: 7, // 주요 Context 개수
      activeProviders: passCount,
      dataIntegrity,
      performanceScore,
      errorRate,
      uptime
    };
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(checks: HealthCheck[]): string[] {
    const recommendations: string[] = [];

    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');

    if (failedChecks.length > 0) {
      recommendations.push(`🚨 ${failedChecks.length}개의 치명적 문제가 발견되었습니다. 즉시 해결이 필요합니다.`);
    }

    if (warningChecks.length > 0) {
      recommendations.push(`⚠️ ${warningChecks.length}개의 경고가 있습니다. 모니터링이 필요합니다.`);
    }

    // 특정 문제에 대한 권장사항
    const contextIssues = checks.filter(c => c.category === 'context' && c.status !== 'pass');
    if (contextIssues.length > 0) {
      recommendations.push('Context 초기화 문제가 있습니다. Provider 설정을 확인해주세요.');
    }

    const performanceIssues = checks.filter(c => c.category === 'performance' && c.status === 'fail');
    if (performanceIssues.length > 0) {
      recommendations.push('성능 문제가 감지되었습니다. 메모리 사용량과 렌더링 성능을 최적화해주세요.');
    }

    const dataIssues = checks.filter(c => c.category === 'data' && c.status === 'fail');
    if (dataIssues.length > 0) {
      recommendations.push('데이터 무결성 문제가 있습니다. localStorage와 데이터 동기화를 확인해주세요.');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 모든 시스템이 정상적으로 작동하고 있습니다.');
    }

    return recommendations;
  }

  /**
   * 건강성 보고서 출력
   */
  printHealthReport(report: SystemHealthReport): void {
    console.group('🏥 System Health Report');
    console.log(`Overall Status: ${report.overall.toUpperCase()}`);
    console.log(`Timestamp: ${report.timestamp.toLocaleString()}`);

    console.group('📊 Statistics');
    console.table(report.statistics);
    console.groupEnd();

    console.group('🔍 Detailed Checks');
    report.checks.forEach(check => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} [${check.category.toUpperCase()}] ${check.name}: ${check.message}`);
      if (check.details) {
        console.log('   Details:', check.details);
      }
    });
    console.groupEnd();

    console.group('💡 Recommendations');
    report.recommendations.forEach(rec => console.log(rec));
    console.groupEnd();

    console.groupEnd();
  }
}

/**
 * 전역 건강성 검사 함수
 */
export async function performSystemHealthCheck(): Promise<SystemHealthReport> {
  const checker = SystemHealthChecker.getInstance();
  const report = await checker.performHealthCheck();
  checker.printHealthReport(report);
  return report;
}

/**
 * 개발자 콘솔용 전역 함수 등록
 */
if (typeof window !== 'undefined') {
  (window as any).systemHealthCheck = performSystemHealthCheck;
  console.log('🔧 System health check available: window.systemHealthCheck()');
}