/**
 * @fileoverview 단순 위치 계산기
 * @description BranchLayoutEngine을 대체하는 간단하고 직관적인 위치 계산 로직
 * @author PocketCompany
 * @since 2025-01-20
 */

import type { ProjectPhase } from '../types/buildup.types';
import type { FeedItem } from '../types/timeline.types';
import type {
  FeedItemWithPosition,
  StagePosition,
  BranchPosition,
  BranchConnector,
  NodeVisualState
} from '../types/branch-timeline.types';

import {
  BRANCH_CONFIGURATIONS,
  BRANCH_PATH_GENERATORS
} from '../config/branchPositions';

/**
 * 피드 타입별 X 좌표 (고정값으로 단순화)
 */
// BRANCH_CONFIGURATIONS에서 직접 offsetX 값을 사용하여 중복 제거
const getFeedXPosition = (feedType: FeedType): number => {
  return BRANCH_CONFIGURATIONS[feedType]?.offsetX || 400;
};

/**
 * 단순 위치 계산 결과
 */
export interface SimpleLayoutResult {
  positionedFeeds: FeedItemWithPosition[];
  branchConnectors: BranchConnector[];
}

/**
 * 간단한 위치 계산 함수들
 */
export class SimplePositionCalculator {

  /**
   * 메인 계산 함수 - 복잡한 BranchLayoutEngine 대체
   */
  calculateLayout(
    feeds: FeedItem[],
    stagePositions: Record<ProjectPhase, StagePosition>
  ): SimpleLayoutResult {
    console.log('🧮 SimplePositionCalculator 시작:', {
      feedsCount: feeds.length,
      stagesCount: Object.keys(stagePositions).length
    });

    // 1. 단계별로 피드 그룹핑
    const groupedFeeds = this.groupFeedsByStage(feeds);

    // 2. 각 그룹 내에서 위치 계산
    const positionedFeeds = this.calculatePositionsForGroups(groupedFeeds, stagePositions);

    // 3. 브랜치 연결선 생성
    const branchConnectors = this.generateBranchConnectors(positionedFeeds, stagePositions);

    console.log('✅ 위치 계산 완료:', {
      positionedFeedsCount: positionedFeeds.length,
      connectorsCount: branchConnectors.length
    });

    return {
      positionedFeeds,
      branchConnectors
    };
  }

  /**
   * 단계별로 피드들을 그룹핑
   */
  private groupFeedsByStage(feeds: FeedItem[]): Record<ProjectPhase, FeedItem[]> {
    const grouped: Record<ProjectPhase, FeedItem[]> = {} as Record<ProjectPhase, FeedItem[]>;

    feeds.forEach(feed => {
      const stageId = feed.stageId as ProjectPhase;
      if (!grouped[stageId]) {
        grouped[stageId] = [];
      }
      grouped[stageId].push(feed);
    });

    // 각 그룹 내에서 시간순 정렬
    Object.keys(grouped).forEach(stage => {
      grouped[stage as ProjectPhase].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });

    return grouped;
  }

  /**
   * 그룹별 위치 계산
   */
  private calculatePositionsForGroups(
    groupedFeeds: Record<ProjectPhase, FeedItem[]>,
    stagePositions: Record<ProjectPhase, StagePosition>
  ): FeedItemWithPosition[] {
    const result: FeedItemWithPosition[] = [];

    Object.entries(groupedFeeds).forEach(([stage, stageFeeds]) => {
      const stagePos = stagePositions[stage as ProjectPhase];
      if (!stagePos) {
        console.warn(`⚠️ 단계 위치 정보 없음: ${stage}`);
        return;
      }

      // 단계 내에서 피드들 배치
      const positionedInStage = this.positionFeedsInStage(stageFeeds, stagePos, stage as ProjectPhase);
      result.push(...positionedInStage);
    });

    return result;
  }

  /**
   * 단일 단계 내에서 피드 위치 계산
   */
  private positionFeedsInStage(
    feeds: FeedItem[],
    stagePos: StagePosition,
    stage: ProjectPhase
  ): FeedItemWithPosition[] {
    const result: FeedItemWithPosition[] = [];

    // 타입별로 피드들을 다시 그룹핑
    const byType: Record<string, FeedItem[]> = {};
    feeds.forEach(feed => {
      if (!byType[feed.type]) {
        byType[feed.type] = [];
      }
      byType[feed.type].push(feed);
    });

    // 각 타입별로 위치 계산
    Object.entries(byType).forEach(([type, typeFeeds]) => {
      const baseX = getFeedXPosition(type);

      typeFeeds.forEach((feed, index) => {
        const position = this.calculateSingleFeedPosition(feed, stagePos, baseX, index, typeFeeds.length);
        result.push({
          ...feed,
          branchPosition: position,
          visualState: this.createInitialVisualState(feed.type, index),
          renderingMeta: {
            inViewport: true,
            layer: BRANCH_CONFIGURATIONS[feed.type]?.priority || 3,
            lastRendered: new Date()
          }
        });
      });
    });

    return result;
  }

  /**
   * 개별 피드의 위치 계산 (정확한 시간 기반)
   */
  private calculateSingleFeedPosition(
    feed: FeedItem,
    stagePos: StagePosition,
    baseX: number,
    index: number,
    totalInType: number
  ): BranchPosition {
    // 정확한 시간 기반 Y 위치 계산
    const timeProgress = this.calculateTimeProgress(
      feed.timestamp,
      stagePos.startDate,
      stagePos.endDate
    );

    // 현재 단계의 진행률 (실시간)
    const currentProgress = this.calculateCurrentProgress(
      stagePos.startDate,
      stagePos.endDate
    );

    // 단계 실제 소요 기간 (일)
    const stageDurationDays = this.calculateStageDurationDays(
      stagePos.startDate,
      stagePos.endDate
    );

    // 단계 내에서의 정확한 Y 위치
    const baseY = stagePos.startY + (stagePos.endY - stagePos.startY) * timeProgress;

    // 타입별 충돌 회피를 위한 스마트 오프셋
    const smartOffset = this.calculateSmartOffset(
      totalInType,
      index,
      feed.type,
      stageDurationDays
    );

    const finalY = Math.max(
      stagePos.startY + 10,
      Math.min(stagePos.endY - 10, baseY + smartOffset.y)
    );

    // X 위치: 타입별 기본 위치 + 스마트 오프셋
    const finalX = baseX + smartOffset.x;

    // 우선순위 기반 노드 크기 및 z-index 계산
    const branchConfig = BRANCH_CONFIGURATIONS[feed.type];
    const nodeScale = this.calculateNodeScale(branchConfig.iconSize, branchConfig.priority);
    const zIndex = this.calculateZIndex(branchConfig.priority, feed.timestamp);

    // 디버깅 정보 개선 (좌표 정합성 포함)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📍 ${feed.title} 좌표 정보:`, {
        feedType: feed.type,
        configuredOffsetX: BRANCH_CONFIGURATIONS[feed.type]?.offsetX || 'N/A',
        calculatedX: Math.round(finalX),
        baseX: Math.round(baseX),
        smartOffsetX: Math.round(smartOffset.x),
        finalY: Math.round(finalY),
        baseY: Math.round(baseY),
        smartOffsetY: Math.round(smartOffset.y),
        timeProgress: Math.round(timeProgress * 1000) / 1000,
        nodeScale: Math.round(nodeScale * 100) / 100,
        zIndex,
        stage: feed.stageId,
        timestamp: feed.timestamp.toISOString().split('T')[0]
      });
    }

    return {
      x: finalX,
      y: finalY,
      feedType: feed.type,
      timestamp: feed.timestamp,
      stageId: feed.stageId,
      isAdjusted: smartOffset.x !== 0 || smartOffset.y !== 0,
      originalPosition: smartOffset.x !== 0 || smartOffset.y !== 0 ?
        { x: baseX, y: baseY } : undefined,
      nodeScale,
      zIndex,
      // 향상된 시각적 차별화 정보
      visualEnhancements: {
        shadowIntensity: this.calculateShadowIntensity(branchConfig.priority),
        glowEffect: this.shouldApplyGlow(feed.type),
        pulseAnimation: this.shouldApplyPulse(feed.type, feed.timestamp),
        iconOpacity: this.calculateIconOpacity(branchConfig.priority),
        borderStyle: this.getBorderStyle(feed.type),
        hoverScale: this.getHoverScaleFactor(branchConfig.iconSize)
      }
    };
  }

  /**
   * 스마트 오프셋 계산 (충돌 회피 + 시각적 균형)
   */
  private calculateSmartOffset(
    totalInType: number,
    index: number,
    feedType: string,
    stageDurationDays: number
  ): { x: number; y: number } {
    if (totalInType <= 1) {
      return { x: 0, y: 0 };
    }

    // 단계 기간에 따른 Y 분산 강도 조절
    const durationFactor = Math.min(2, stageDurationDays / 7); // 일주일 기준 정규화
    const ySpacing = 20 * durationFactor; // 기간이 길수록 더 넓게 분산

    // X 분산: 타입별 특성 반영
    const typeXMultiplier = {
      'meeting': 1.2, // 미팅은 더 넓게
      'file': 0.8,    // 파일은 조밀하게
      'comment': 0.6, // 댓글은 가장 조밀하게
      'todo': 1.0,    // 기본
      'progress': 1.5 // 진행률은 가장 넓게
    };

    const xMultiplier = typeXMultiplier[feedType as keyof typeof typeXMultiplier] || 1.0;
    const xSpacing = 15 * xMultiplier;

    // 중심 기준 대칭 배치
    const centerOffset = (totalInType - 1) / 2;

    return {
      x: (index - centerOffset) * xSpacing,
      y: (index - centerOffset) * ySpacing
    };
  }

  /**
   * 시간 진행률 계산 (정확한 시간 기반)
   */
  private calculateTimeProgress(
    timestamp: Date,
    stageStart: Date,
    stageEnd: Date
  ): number {
    const total = stageEnd.getTime() - stageStart.getTime();

    // 단계 기간이 0이거나 음수인 경우 처리
    if (total <= 0) {
      console.warn('⚠️ 단계 기간이 유효하지 않음:', { stageStart, stageEnd });
      return 0.5; // 중간 위치
    }

    const elapsed = timestamp.getTime() - stageStart.getTime();
    const rawProgress = elapsed / total;

    // 실제 시간 기반 정확한 계산 (범위 제한 완화)
    if (rawProgress < 0) {
      // 단계 시작 전: 시작점 근처 배치
      return Math.max(0.05, 0.1 + rawProgress * 0.05);
    } else if (rawProgress > 1) {
      // 단계 종료 후: 끝점 근처 배치
      return Math.min(0.95, 0.9 + (rawProgress - 1) * 0.05);
    } else {
      // 단계 내: 정확한 비례 배치 (여백 최소화)
      return 0.05 + rawProgress * 0.9; // 5% ~ 95% 범위 사용
    }
  }

  /**
   * 현재 시점 기준 진행률 계산 (실시간 반영)
   */
  private calculateCurrentProgress(
    stageStart: Date,
    stageEnd: Date,
    currentTime: Date = new Date()
  ): number {
    const total = stageEnd.getTime() - stageStart.getTime();

    if (total <= 0) return 0;

    const elapsed = currentTime.getTime() - stageStart.getTime();
    return Math.max(0, Math.min(1, elapsed / total));
  }

  /**
   * 단계별 실제 소요 시간 계산 (일 단위)
   */
  private calculateStageDurationDays(
    stageStart: Date,
    stageEnd: Date
  ): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const duration = stageEnd.getTime() - stageStart.getTime();
    return Math.max(1, Math.round(duration / msPerDay));
  }

  /**
   * 브랜치 연결선 생성 (단순화)
   */
  private generateBranchConnectors(
    positionedFeeds: FeedItemWithPosition[],
    stagePositions: Record<ProjectPhase, StagePosition>
  ): BranchConnector[] {
    return positionedFeeds.map(feed => {
      const config = BRANCH_CONFIGURATIONS[feed.type];
      const pathGenerator = BRANCH_PATH_GENERATORS[config.branchType];

      // 시작점: 메인 타임라인 (오른쪽 영역의 왼쪽 가장자리)
      const startX = 0;

      // 노드 카드 너비 (하드코딩 대신 설정값 사용)
      const nodeCardWidth = 220; // TODO: 설정 파일로 이동 예정

      // 끝점: 노드 카드의 왼쪽 가장자리 (transform: translate(-50%, -50%) 고려)
      const endX = feed.branchPosition.x - (nodeCardWidth / 2);
      const endY = feed.branchPosition.y;

      // 스테이지의 중간 지점에서 시작
      const stagePos = stagePositions[feed.stageId];
      const startY = stagePos ? (stagePos.startY + stagePos.endY) / 2 : endY;

      // 패스 생성
      const pathData = pathGenerator(startX, startY, endX, endY);

      return {
        id: `connector-${feed.id}`,
        startPoint: { x: startX, y: startY },
        endPoint: { x: endX, y: endY },
        style: config,
        animationState: 'idle' as const,
        pathData,
        feedId: feed.id
      };
    });
  }

  /**
   * 초기 시각적 상태 생성
   */
  private createInitialVisualState(feedType: FeedType, index: number = 0): NodeVisualState {
    const branchConfig = BRANCH_CONFIGURATIONS[feedType];
    const nodeSize = this.calculateNodeSize(feedType, branchConfig?.iconSize || 'medium');
    const zIndex = this.calculateZIndex(branchConfig?.priority || 3, feedType);

    return {
      isHovered: false,
      isSelected: false,
      isExpanded: false,
      animationDelay: index * 50, // 순차적 애니메이션
      isVisible: true,
      lastInteraction: new Date(),
      nodeSize,
      zIndex,
      colorIntensity: this.calculateColorIntensity(feedType)
    };
  }

  /**
   * 피드 타입별 노드 크기 계산
   */
  private calculateNodeSize(feedType: FeedType, iconSize: 'small' | 'medium' | 'large'): number {
    const baseSizes = {
      small: 12,
      medium: 16,
      large: 20
    };

    const typeMultipliers: Record<FeedType, number> = {
      meeting: 1.3,    // 미팅은 크게
      progress: 1.2,   // 진행률도 크게
      todo: 1.1,       // 할일은 중간
      team: 1.0,       // 팀은 기본
      comment: 0.9,    // 코멘트는 작게
      file: 0.8        // 파일은 가장 작게
    };

    return Math.round(baseSizes[iconSize] * (typeMultipliers[feedType] || 1.0));
  }

  /**
   * 우선순위 기반 z-index 계산
   */
  private calculateZIndex(priority: number, feedType: FeedType): number {
    // 기본 z-index: 1000 - (priority * 100)
    // 같은 우선순위 내에서도 타입별 미세 조정
    const baseZIndex = 1000 - (priority * 100);

    const typeOffsets: Record<FeedType, number> = {
      meeting: 15,     // 미팅이 가장 위
      progress: 10,    // 진행률 업데이트
      todo: 5,         // 할일
      team: 3,         // 팀 활동
      comment: 1,      // 코멘트
      file: 0          // 파일이 가장 아래
    };

    return baseZIndex + (typeOffsets[feedType] || 0);
  }

  /**
   * 피드 타입별 색상 강도 계산
   */
  private calculateColorIntensity(feedType: FeedType): number {
    const intensityMap: Record<FeedType, number> = {
      meeting: 1.0,    // 미팅: 최대 강도
      progress: 0.95,  // 진행률: 거의 최대
      todo: 0.9,       // 할일: 높은 강도
      team: 0.85,      // 팀: 중간 강도
      comment: 0.8,    // 코멘트: 낮은 강도
      file: 0.7        // 파일: 최소 강도
    };

    return intensityMap[feedType] || 0.8;
  }

  /**
   * 우선순위와 아이콘 크기에 따른 노드 스케일 계산
   */
  private calculateNodeScale(iconSize: 'small' | 'medium' | 'large', priority: number): number {
    // 기본 크기 매핑
    const baseSizes = {
      small: 0.8,   // 80% 크기
      medium: 1.0,  // 100% 크기 (기준)
      large: 1.3    // 130% 크기
    };

    // 우선순위 기반 보정 (우선순위 낮을수록 더 크게)
    const priorityMultiplier = Math.max(0.9, Math.min(1.2, 1.4 - (priority * 0.1)));

    return baseSizes[iconSize] * priorityMultiplier;
  }

  /**
   * 우선순위와 시간에 따른 z-index 계산
   */
  private calculateZIndex(priority: number, timestamp: Date): number {
    // 우선순위 기반 기본 z-index (우선순위 낮을수록 높은 z-index)
    const basePriority = Math.max(1, 6 - priority) * 100;

    // 시간 기반 미세 조정 (최근일수록 약간 높게)
    const timeBonus = Math.min(10, Math.floor((Date.now() - timestamp.getTime()) / (24 * 60 * 60 * 1000)));

    return basePriority + timeBonus;
  }

  /**
   * 우선순위 기반 그림자 강도 계산
   */
  private calculateShadowIntensity(priority: number): number {
    // 우선순위가 높을수록(숫자가 낮을수록) 강한 그림자
    switch (priority) {
      case 1: return 1.0; // 최고 우선순위: 진한 그림자
      case 2: return 0.8; // 높은 우선순위: 보통 그림자
      case 3: return 0.6; // 보통 우선순위: 연한 그림자
      case 4: return 0.4; // 낮은 우선순위: 매우 연한 그림자
      default: return 0.2; // 기타: 최소 그림자
    }
  }

  /**
   * 피드 타입별 글로우 효과 적용 여부
   */
  private shouldApplyGlow(feedType: FeedType): boolean {
    // 중요한 피드 타입에만 글로우 효과 적용
    return feedType === 'meeting' || feedType === 'progress';
  }

  /**
   * 최근 피드에 대한 펄스 애니메이션 적용 여부
   */
  private shouldApplyPulse(feedType: FeedType, timestamp: Date): boolean {
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - timestamp.getTime()) / (60 * 60 * 1000);

    // 24시간 이내의 중요한 피드에만 펄스 적용
    return hoursSinceCreated <= 24 && (feedType === 'meeting' || feedType === 'todo' || feedType === 'progress');
  }

  /**
   * 우선순위 기반 아이콘 투명도 계산
   */
  private calculateIconOpacity(priority: number): number {
    // 우선순위가 높을수록 더 선명하게
    return Math.max(0.6, 1.0 - (priority - 1) * 0.1);
  }

  /**
   * 피드 타입별 테두리 스타일
   */
  private getBorderStyle(feedType: FeedType): string {
    switch (feedType) {
      case 'meeting': return 'solid'; // 미팅: 실선
      case 'progress': return 'double'; // 진행률: 이중선
      case 'todo': return 'dashed'; // 할일: 점선
      case 'comment': return 'dotted'; // 코멘트: 도트
      case 'file': return 'solid'; // 파일: 실선
      case 'team': return 'ridge'; // 팀: 릿지
      default: return 'solid';
    }
  }

  /**
   * 아이콘 크기별 호버 확대 배수
   */
  private getHoverScaleFactor(iconSize: 'small' | 'medium' | 'large'): number {
    switch (iconSize) {
      case 'large': return 1.2; // 큰 아이콘: 적게 확대
      case 'medium': return 1.3; // 중간 아이콘: 보통 확대
      case 'small': return 1.5; // 작은 아이콘: 많이 확대
      default: return 1.3;
    }
  }
}

// 싱글톤 인스턴스 생성
export const simplePositionCalculator = new SimplePositionCalculator();

/**
 * 간단한 사용을 위한 헬퍼 함수
 */
export function calculateSimplePositions(
  feeds: FeedItem[],
  stagePositions: Record<ProjectPhase, StagePosition>
): SimpleLayoutResult {
  return simplePositionCalculator.calculateLayout(feeds, stagePositions);
}