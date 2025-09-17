import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationRule
} from '../types/notifications';
import type { AxisKey } from '../types';

// 투자 매칭 데이터 타입
interface InvestmentMatch {
  id: string;
  programName: string;
  matchScore: number;
  deadline: Date;
  investmentStage: string;
  amount: string;
}

// 프로그램 데이터 타입
interface Program {
  id: string;
  name: string;
  deadline: Date;
  matchScore: number;
  type: string;
}

// 알림 생성 엔진
export class NotificationEngine {
  private static instance: NotificationEngine;
  private rules: NotificationRule[] = [];
  private lastNotifications: Map<string, Date> = new Map();

  static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
    }
    return NotificationEngine.instance;
  }

  setRules(rules: NotificationRule[]) {
    this.rules = rules;
  }

  // KPI 기반 알림 생성
  generateKPINotifications(
    currentScores: Record<AxisKey, number>,
    previousScores?: Record<AxisKey, number>
  ): Omit<Notification, 'id' | 'timestamp' | 'status'>[] {
    const notifications: Omit<Notification, 'id' | 'timestamp' | 'status'>[] = [];
    
    Object.entries(currentScores).forEach(([axis, currentScore]) => {
      const axisKey = axis as AxisKey;
      const previousScore = previousScores?.[axisKey] || 0;
      const improvement = currentScore - previousScore;
      
      // 마일스톤 알림
      if (currentScore >= 80 && previousScore < 80) {
        notifications.push({
          type: 'kpi_milestone',
          priority: 'high',
          title: `🎯 ${this.getAxisName(axisKey)} 80점 돌파!`,
          message: `축하합니다! ${this.getAxisName(axisKey)} 영역에서 80점을 달성했습니다. (현재: ${currentScore.toFixed(1)}점)`,
          icon: '🎯',
          color: 'text-green-600',
          actionUrl: '/startup/kpi',
          actionLabel: 'KPI 상세보기',
          data: { axis: axisKey, score: currentScore, milestone: 80 }
        });
      }
      
      if (currentScore >= 90 && previousScore < 90) {
        notifications.push({
          type: 'achievement',
          priority: 'urgent',
          title: `🏆 ${this.getAxisName(axisKey)} 90점 달성!`,
          message: `놀라운 성취입니다! ${this.getAxisName(axisKey)} 영역에서 90점을 달성했습니다.`,
          icon: '🏆',
          color: 'text-yellow-600',
          actionUrl: '/startup/dashboard',
          actionLabel: '대시보드 보기'
        });
      }
      
      // 급격한 개선 알림
      if (improvement >= 15 && previousScores) {
        notifications.push({
          type: 'kpi_milestone',
          priority: 'medium',
          title: `📈 ${this.getAxisName(axisKey)} 크게 향상!`,
          message: `${this.getAxisName(axisKey)} 점수가 ${improvement.toFixed(1)}점 향상되었습니다. (${previousScore.toFixed(1)} → ${currentScore.toFixed(1)})`,
          icon: '📈',
          color: 'text-blue-600',
          actionUrl: '/startup/kpi',
          actionLabel: 'KPI 분석 보기'
        });
      }
      
      // 경고 알림 (점수 하락)
      if (improvement <= -10 && previousScores) {
        notifications.push({
          type: 'alert',
          priority: 'high',
          title: `⚠️ ${this.getAxisName(axisKey)} 점수 하락`,
          message: `주의가 필요합니다. ${this.getAxisName(axisKey)} 점수가 ${Math.abs(improvement).toFixed(1)}점 하락했습니다.`,
          icon: '⚠️',
          color: 'text-red-600',
          actionUrl: '/startup/kpi',
          actionLabel: '개선 방안 보기'
        });
      }
    });
    
    return notifications;
  }
  
  // 투자 매칭 알림 생성
  generateInvestmentNotifications(
    matches: InvestmentMatch[]
  ): Omit<Notification, 'id' | 'timestamp' | 'status'>[] {
    const notifications: Omit<Notification, 'id' | 'timestamp' | 'status'>[] = [];
    
    matches.forEach(match => {
      // 고도 매칭 알림 (90% 이상)
      if (match.matchScore >= 90) {
        notifications.push({
          type: 'investment_match',
          priority: 'urgent',
          title: '🎯 완벽 매칭 발견!',
          message: `${match.programName}과 ${match.matchScore}% 매칭됩니다. 지금 신청하세요!`,
          icon: '🎯',
          color: 'text-purple-600',
          actionUrl: `/startup/matches/${match.id}`,
          actionLabel: '자세히 보기',
          data: { matchId: match.id, score: match.matchScore }
        });
      }
      
      // 높은 매칭 알림 (80-89%)
      else if (match.matchScore >= 80) {
        notifications.push({
          type: 'investment_match',
          priority: 'high',
          title: '💰 높은 매칭 투자 기회',
          message: `${match.programName} (${match.matchScore}% 매칭, ${match.amount})`,
          icon: '💰',
          color: 'text-green-600',
          actionUrl: `/startup/matches/${match.id}`,
          actionLabel: '지원하기'
        });
      }
      
      // 마감일 임박 알림
      const daysUntilDeadline = this.getDaysUntilDate(match.deadline);
      if (daysUntilDeadline <= 7 && match.matchScore >= 70) {
        notifications.push({
          type: 'program_deadline',
          priority: 'urgent',
          title: '⏰ 마감일 임박!',
          message: `${match.programName} 마감까지 ${daysUntilDeadline}일 남았습니다.`,
          icon: '⏰',
          color: 'text-red-600',
          actionUrl: `/startup/matches/${match.id}`,
          actionLabel: '빠른 지원',
          expiresAt: match.deadline
        });
      }
    });
    
    return notifications;
  }
  
  // 프로그램 마감일 알림 생성
  generateDeadlineNotifications(
    programs: Program[]
  ): Omit<Notification, 'id' | 'timestamp' | 'status'>[] {
    const notifications: Omit<Notification, 'id' | 'timestamp' | 'status'>[] = [];
    
    programs.forEach(program => {
      const daysUntilDeadline = this.getDaysUntilDate(program.deadline);
      
      // 1일 남음
      if (daysUntilDeadline === 1) {
        notifications.push({
          type: 'program_deadline',
          priority: 'urgent',
          title: '🚨 마감 하루 전!',
          message: `${program.name} 내일 마감됩니다. 지금 확인하세요!`,
          icon: '🚨',
          color: 'text-red-600',
          actionUrl: `/startup/programs/${program.id}`,
          actionLabel: '바로 지원'
        });
      }
      
      // 3일 남음
      else if (daysUntilDeadline === 3) {
        notifications.push({
          type: 'program_deadline',
          priority: 'high',
          title: '⏰ 마감 3일 전',
          message: `${program.name} 마감까지 3일 남았습니다.`,
          icon: '⏰',
          color: 'text-orange-600',
          actionUrl: `/startup/programs/${program.id}`,
          actionLabel: '준비하기'
        });
      }
      
      // 7일 남음
      else if (daysUntilDeadline === 7) {
        notifications.push({
          type: 'reminder',
          priority: 'medium',
          title: '📋 프로그램 준비 시작',
          message: `${program.name} 마감까지 1주일 남았습니다. 준비를 시작하세요.`,
          icon: '📋',
          color: 'text-blue-600',
          actionUrl: `/startup/programs/${program.id}`,
          actionLabel: '준비 가이드'
        });
      }
    });
    
    return notifications;
  }
  
  // 성취 기반 알림 생성
  generateAchievementNotifications(
    overallScore: number,
    milestones: number[] = [70, 80, 90, 95]
  ): Omit<Notification, 'id' | 'timestamp' | 'status'>[] {
    const notifications: Omit<Notification, 'id' | 'timestamp' | 'status'>[] = [];
    
    milestones.forEach(milestone => {
      if (overallScore >= milestone) {
        const key = `achievement_${milestone}`;
        const lastNotified = this.lastNotifications.get(key);
        const now = new Date();
        
        // 24시간 쿨다운
        if (!lastNotified || (now.getTime() - lastNotified.getTime()) > 86400000) {
          notifications.push({
            type: 'achievement',
            priority: milestone >= 90 ? 'urgent' : 'high',
            title: this.getAchievementTitle(milestone),
            message: this.getAchievementMessage(milestone, overallScore),
            icon: this.getAchievementIcon(milestone),
            color: 'text-yellow-600',
            actionUrl: '/startup/dashboard',
            actionLabel: '성과 보기',
            data: { milestone, score: overallScore }
          });
          
          this.lastNotifications.set(key, now);
        }
      }
    });
    
    return notifications;
  }
  
  // 팀 업데이트 알림 생성
  generateTeamNotifications(
    activeProjects: any[],
    completedProjects: any[]
  ): Omit<Notification, 'id' | 'timestamp' | 'status'>[] {
    const notifications: Omit<Notification, 'id' | 'timestamp' | 'status'>[] = [];
    
    // 프로젝트 완료 알림
    completedProjects.forEach(project => {
      if (this.isRecentlyCompleted(project.completedAt)) {
        notifications.push({
          type: 'team_update',
          priority: 'medium',
          title: '✅ 프로젝트 완료!',
          message: `${project.title} 프로젝트가 완료되었습니다.`,
          icon: '✅',
          color: 'text-green-600',
          actionUrl: `/startup/buildup/projects/${project.id}`,
          actionLabel: '결과 보기'
        });
      }
    });
    
    // 진행 중 프로젝트 마일스톤
    activeProjects.forEach(project => {
      const progress = this.calculateProgress(project);
      
      if (progress >= 75 && !project.milestone75Notified) {
        notifications.push({
          type: 'team_update',
          priority: 'medium',
          title: '🎯 프로젝트 75% 완료',
          message: `${project.title} 프로젝트가 75% 완료되었습니다.`,
          icon: '🎯',
          color: 'text-blue-600',
          actionUrl: `/startup/buildup/projects/${project.id}`,
          actionLabel: '진행 상황 보기'
        });
      }
    });
    
    return notifications;
  }
  
  // 유틸리티 메서드들
  private getAxisName(axis: AxisKey): string {
    const names = {
      GO: '성장·운영',
      EC: '경제성·자본',
      PT: '제품·기술력',
      PF: '증빙·딜레디',
      TO: '팀·조직 역량'
    };
    return names[axis] || axis;
  }
  
  private getDaysUntilDate(date: Date): number {
    const now = new Date();
    const timeDiff = date.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  private getAchievementTitle(milestone: number): string {
    switch (milestone) {
      case 70: return '🌟 성장 궤도 진입!';
      case 80: return '🚀 우수 스타트업!';
      case 90: return '🏆 최우수 스타트업!';
      case 95: return '💎 엘리트 스타트업!';
      default: return '🎉 마일스톤 달성!';
    }
  }
  
  private getAchievementMessage(milestone: number, score: number): string {
    return `축하합니다! 종합 점수 ${score.toFixed(1)}점으로 ${milestone}점 마일스톤을 달성했습니다.`;
  }
  
  private getAchievementIcon(milestone: number): string {
    if (milestone >= 95) return '💎';
    if (milestone >= 90) return '🏆';
    if (milestone >= 80) return '🚀';
    return '🌟';
  }
  
  private isRecentlyCompleted(completedAt: Date): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - completedAt.getTime();
    return timeDiff <= 3600000; // 1시간 이내
  }
  
  private calculateProgress(project: any): number {
    // 프로젝트 진행률 계산 로직
    if (project.phase === 'completed') return 100;
    if (project.phase === 'in_progress') return 50;
    if (project.phase === 'contract_pending') return 25;
    return 0;
  }
}

// 싱글톤 인스턴스 생성
export const notificationEngine = NotificationEngine.getInstance();