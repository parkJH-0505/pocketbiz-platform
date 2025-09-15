import type { Project } from '../types/buildup.types';

/**
 * 자동 진행률 계산 시스템
 * - Time-based: 날짜 기반 자동 계산
 * - Milestone-based: 마일스톤 완료 기반
 * - Hybrid: 시간 70% + 마일스톤 30% 가중치
 */

export function calculateAutoProgress(project: Project): number {
  const method = project.progress.calculation_method || 'hybrid';

  switch (method) {
    case 'time_based':
      return calculateTimeBasedProgress(project);
    case 'milestone_based':
      return calculateMilestoneBasedProgress(project);
    case 'hybrid':
    default:
      return calculateHybridProgress(project);
  }
}

function calculateTimeBasedProgress(project: Project): number {
  const { start_date, end_date } = project.timeline;
  const now = new Date();

  const totalDuration = end_date.getTime() - start_date.getTime();
  const elapsed = now.getTime() - start_date.getTime();

  // 시간 기반 진행률 (0-100%)
  const timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  // 프로젝트 상태에 따른 조정
  if (project.status === 'completed') return 100;
  if (project.status === 'preparing') return 0;
  if (project.status === 'hold') return project.progress.overall; // 현재 진행률 유지

  return Math.round(timeProgress);
}

function calculateMilestoneBasedProgress(project: Project): number {
  const { milestones_completed, milestones_total } = project.progress;

  if (milestones_total === 0) return 0;
  return Math.round((milestones_completed / milestones_total) * 100);
}

function calculateHybridProgress(project: Project): number {
  // 하이브리드: 시간 70% + 마일스톤 30%
  const timeProgress = calculateTimeBasedProgress(project) * 0.7;
  const milestoneProgress = calculateMilestoneBasedProgress(project) * 0.3;

  // 결과물 제출률도 10% 반영 (보너스)
  const { deliverables_submitted, deliverables_total } = project.progress;
  const deliverableBonus = deliverables_total > 0
    ? (deliverables_submitted / deliverables_total) * 10
    : 0;

  return Math.min(100, Math.round(timeProgress + milestoneProgress + deliverableBonus));
}

// 진행 상태 판단
export function getProgressStatus(progress: number): {
  status: 'on_track' | 'delayed' | 'at_risk' | 'completed';
  color: string;
  message: string;
} {
  if (progress >= 100) {
    return {
      status: 'completed',
      color: 'text-green-600',
      message: '완료'
    };
  }

  // 현재 날짜 기준으로 예상 진행률과 비교
  const now = new Date();
  const dayOfWeek = now.getDay();
  const expectedProgress = (dayOfWeek / 7) * 100; // 주간 기준 예상 진행률

  const difference = progress - expectedProgress;

  if (difference >= -5) {
    return {
      status: 'on_track',
      color: 'text-green-600',
      message: '정상 진행'
    };
  } else if (difference >= -15) {
    return {
      status: 'delayed',
      color: 'text-yellow-600',
      message: '약간 지연'
    };
  } else {
    return {
      status: 'at_risk',
      color: 'text-red-600',
      message: '지연 위험'
    };
  }
}

// PM 대시보드용 벌크 업데이트 헬퍼
export function bulkUpdateProjects(projects: Project[], updates: Map<string, Partial<Project>>): Project[] {
  return projects.map(project => {
    const update = updates.get(project.id);
    if (!update) return project;

    return {
      ...project,
      ...update,
      progress: {
        ...project.progress,
        ...update.progress,
        last_updated: new Date()
      }
    };
  });
}

// 자동 알림 트리거 체크
export function checkAlertTriggers(project: Project): string[] {
  const alerts: string[] = [];
  const now = new Date();

  // 마일스톤 마감 임박 (3일 이내)
  if (project.timeline.next_milestone) {
    const daysUntilMilestone = Math.ceil(
      (project.timeline.next_milestone.due_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilMilestone <= 3 && daysUntilMilestone >= 0) {
      alerts.push(`마일스톤 "${project.timeline.next_milestone.name}" 마감 ${daysUntilMilestone}일 전`);
    }
  }

  // 진행률 지연
  const progressStatus = getProgressStatus(project.progress.overall);
  if (progressStatus.status === 'at_risk') {
    alerts.push('프로젝트 진행 지연 위험');
  }

  // 미팅 임박 (1일 이내)
  project.meetings?.forEach(meeting => {
    const daysUntilMeeting = Math.ceil(
      (meeting.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilMeeting === 1) {
      alerts.push(`내일 ${meeting.title} 예정`);
    } else if (daysUntilMeeting === 0) {
      alerts.push(`오늘 ${meeting.title} 예정`);
    }
  });

  return alerts;
}