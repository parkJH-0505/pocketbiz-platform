/**
 * @fileoverview 브랜치 레이아웃 엔진
 * @description 시간 기반 브랜치 위치 계산, 충돌 감지 및 해결을 담당하는 핵심 엔진
 * @author PocketCompany
 * @since 2025-01-20
 */

import type { ProjectPhase } from '../types/buildup.types';
import type { FeedItem } from '../types/timeline.types';
import type {
  FeedItemWithPosition,
  StagePosition,
  BranchPosition,
  CollisionDetectionResult,
  LayoutEngineResult,
  BranchConnector,
  NodeVisualState,
  TimelineMetrics
} from '../types/branch-timeline.types';

import {
  BRANCH_CONFIGURATIONS,
  BRANCH_LAYOUT_CONFIG,
  COLLISION_PRIORITY_MATRIX,
  DENSITY_ADJUSTMENT_SETTINGS,
  BRANCH_PATH_GENERATORS
} from '../config/branchPositions';

/**
 * 브랜치 레이아웃 엔진 클래스
 * 피드들의 위치를 계산하고 충돌을 해결하는 핵심 로직
 */
export class BranchLayoutEngine {
  private stagePositions: Record<ProjectPhase, StagePosition> = {};
  private occupiedPositions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    feedId: string;
    priority: number;
  }> = [];
  private performanceStartTime: number = 0;

  /**
   * 메인 레이아웃 계산 함수
   * @param feeds 위치를 계산할 피드들
   * @param stageMetrics 각 단계의 위치 및 시간 정보
   * @param viewportHeight 뷰포트 높이
   * @returns 위치가 계산된 피드들과 연결선 정보
   */
  calculateLayout(
    feeds: FeedItem[],
    stageMetrics: Record<ProjectPhase, StagePosition>,
    viewportHeight: number
  ): LayoutEngineResult {
    this.performanceStartTime = performance.now();
    this.stagePositions = stageMetrics;
    this.occupiedPositions = [];

    try {
      // 1. 시간순 정렬 및 검증
      const validatedFeeds = this.validateAndSortFeeds(feeds);

      // 2. 기본 위치 계산
      const feedsWithBasePositions = this.calculateBasePositions(validatedFeeds);

      // 3. 밀도 분석 및 조정
      const densityAdjustedFeeds = this.adjustForDensity(feedsWithBasePositions);

      // 4. 충돌 감지 및 해결
      const { resolvedFeeds, collisionReport } = this.resolveAllCollisions(densityAdjustedFeeds);

      // 5. 시각적 상태 초기화
      const finalFeeds = this.initializeVisualStates(resolvedFeeds);

      // 6. 브랜치 연결선 생성
      const connectors = this.generateBranchConnectors(finalFeeds);

      // 7. 성능 메트릭 계산
      const calculationTime = performance.now() - this.performanceStartTime;

      return {
        positionedFeeds: finalFeeds,
        connectors,
        collisionReport,
        metrics: {
          calculationTime,
          totalNodes: feeds.length,
          adjustedNodes: resolvedFeeds.filter(f => f.branchPosition.isAdjusted).length
        }
      };
    } catch (error) {
      console.error('BranchLayoutEngine calculation failed:', error);
      throw new Error(`Layout calculation failed: ${error}`);
    }
  }

  /**
   * 피드 검증 및 시간순 정렬
   */
  private validateAndSortFeeds(feeds: FeedItem[]): FeedItem[] {
    const validFeeds = feeds.filter(feed => {
      // 기본 검증
      if (!feed.id || !feed.type || !feed.timestamp || !feed.stageId) {
        console.warn('Invalid feed detected:', feed);
        return false;
      }

      // 단계 존재 검증
      if (!this.stagePositions[feed.stageId]) {
        console.warn(`Stage position not found for feed ${feed.id}, stage: ${feed.stageId}`);
        return false;
      }

      return true;
    });

    // 시간순 정렬 (최신순)
    return validFeeds.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * 각 피드의 기본 브랜치 위치 계산
   */
  private calculateBasePositions(feeds: FeedItem[]): FeedItemWithPosition[] {
    return feeds.map(feed => {
      const branchPosition = this.calculateBaseBranchPosition(feed);

      return {
        ...feed,
        branchPosition,
        visualState: this.createInitialVisualState(),
        renderingMeta: {
          inViewport: true, // 초기값, 나중에 업데이트됨
          layer: BRANCH_CONFIGURATIONS[feed.type].priority,
          lastRendered: new Date()
        }
      };
    });
  }

  /**
   * 개별 피드의 기본 브랜치 위치 계산
   */
  private calculateBaseBranchPosition(feed: FeedItem): BranchPosition {
    const stagePos = this.stagePositions[feed.stageId];
    const branchConfig = BRANCH_CONFIGURATIONS[feed.type];

    if (!stagePos) {
      throw new Error(`Stage position not found for stage: ${feed.stageId}`);
    }

    // 시간 기반 Y 위치 계산
    const timeProgress = this.calculateTimeProgress(
      feed.timestamp,
      stagePos.startDate,
      stagePos.endDate
    );

    // 단계 내에서의 Y 위치
    const y = stagePos.startY + (stagePos.endY - stagePos.startY) * timeProgress;

    // 사용자 커스텀 브랜치 길이 적용
    const customOffset = feed.renderingHints?.preferredBranchLength;
    const finalOffsetX = customOffset || branchConfig.offsetX;

    return {
      x: finalOffsetX,
      y: y,
      feedType: feed.type,
      timestamp: feed.timestamp,
      stageId: feed.stageId,
      isAdjusted: false
    };
  }

  /**
   * 시간 진행률 계산 (0.0 ~ 1.0)
   */
  private calculateTimeProgress(
    timestamp: Date,
    stageStart: Date,
    stageEnd: Date
  ): number {
    const total = stageEnd.getTime() - stageStart.getTime();

    // 0으로 나누기 방지
    if (total <= 0) return 0.5;

    const elapsed = timestamp.getTime() - stageStart.getTime();

    // 안전한 범위로 제한 (0.05 ~ 0.95 사이로 클램핑하여 가장자리 방지)
    const rawProgress = elapsed / total;
    return Math.max(0.05, Math.min(0.95, rawProgress));
  }

  /**
   * 밀도 분석 및 조정
   */
  private adjustForDensity(feeds: FeedItemWithPosition[]): FeedItemWithPosition[] {
    // 단계별 피드 밀도 계산
    const stageFeeds = this.groupFeedsByStage(feeds);

    return feeds.map(feed => {
      const stageFeedsCount = stageFeeds[feed.stageId]?.length || 0;
      const densityLevel = this.calculateDensityLevel(stageFeedsCount);

      const adjustment = DENSITY_ADJUSTMENT_SETTINGS.adjustments[densityLevel];

      // 밀도에 따른 위치 조정
      const adjustedPosition = {
        ...feed.branchPosition,
        x: feed.branchPosition.x * adjustment.branchSpacing
      };

      return {
        ...feed,
        branchPosition: adjustedPosition,
        visualState: {
          ...feed.visualState,
          animationDelay: adjustment.animationDelay
        }
      };
    });
  }

  /**
   * 단계별 피드 그룹화
   */
  private groupFeedsByStage(feeds: FeedItemWithPosition[]): Record<ProjectPhase, FeedItemWithPosition[]> {
    return feeds.reduce((acc, feed) => {
      if (!acc[feed.stageId]) {
        acc[feed.stageId] = [];
      }
      acc[feed.stageId].push(feed);
      return acc;
    }, {} as Record<ProjectPhase, FeedItemWithPosition[]>);
  }

  /**
   * 밀도 레벨 계산
   */
  private calculateDensityLevel(feedCount: number): 'sparse' | 'normal' | 'dense' | 'overcrowded' {
    const { thresholds } = DENSITY_ADJUSTMENT_SETTINGS;

    if (feedCount <= thresholds.sparse) return 'sparse';
    if (feedCount <= thresholds.normal) return 'normal';
    if (feedCount <= thresholds.dense) return 'dense';
    return 'overcrowded';
  }

  /**
   * 모든 충돌 감지 및 해결
   */
  private resolveAllCollisions(feeds: FeedItemWithPosition[]): {
    resolvedFeeds: FeedItemWithPosition[];
    collisionReport: LayoutEngineResult['collisionReport'];
  } {
    const resolvedFeeds: FeedItemWithPosition[] = [];
    const collisionCounts = { total: 0, resolved: 0 };
    const unresolvableCollisions: CollisionDetectionResult[] = [];

    for (const feed of feeds) {
      let currentPosition = { ...feed.branchPosition };
      let attemptCount = 0;
      const maxAttempts = 10;

      while (attemptCount < maxAttempts) {
        const collisionResult = this.detectCollision(currentPosition, feed.id);

        if (!collisionResult.hasCollision) {
          // 충돌 없음 - 위치 확정
          this.registerOccupiedPosition(currentPosition, feed.id, feed.type);
          resolvedFeeds.push({
            ...feed,
            branchPosition: {
              ...currentPosition,
              isAdjusted: attemptCount > 0,
              originalPosition: attemptCount > 0 ? feed.branchPosition : undefined
            }
          });

          if (attemptCount > 0) {
            collisionCounts.resolved++;
          }
          break;
        }

        // 충돌 발생 - 위치 조정 시도
        collisionCounts.total++;
        currentPosition = this.adjustPositionForCollision(
          currentPosition,
          collisionResult,
          feed.type
        );

        attemptCount++;
      }

      // 최대 시도 횟수 초과시 강제 배치
      if (attemptCount >= maxAttempts) {
        console.warn(`Could not resolve collision for feed ${feed.id} after ${maxAttempts} attempts`);
        unresolvableCollisions.push({
          hasCollision: true,
          collidingNodes: [],
          recommendedAdjustment: { direction: 'down', distance: 50 },
          severity: 1.0
        });

        this.registerOccupiedPosition(currentPosition, feed.id, feed.type);
        resolvedFeeds.push({
          ...feed,
          branchPosition: {
            ...currentPosition,
            isAdjusted: true,
            originalPosition: feed.branchPosition
          }
        });
      }
    }

    return {
      resolvedFeeds,
      collisionReport: {
        totalCollisions: collisionCounts.total,
        resolvedCollisions: collisionCounts.resolved,
        unresolvableCollisions
      }
    };
  }

  /**
   * 충돌 감지
   */
  private detectCollision(position: BranchPosition, feedId: string): CollisionDetectionResult {
    const nodeRect = this.createNodeRect(position);
    const collidingNodes: string[] = [];

    for (const occupied of this.occupiedPositions) {
      if (occupied.feedId === feedId) continue;

      if (this.isRectOverlapping(nodeRect, occupied)) {
        collidingNodes.push(occupied.feedId);
      }
    }

    const hasCollision = collidingNodes.length > 0;

    return {
      hasCollision,
      collidingNodes,
      recommendedAdjustment: hasCollision
        ? this.calculateRecommendedAdjustment(nodeRect, this.occupiedPositions)
        : { direction: 'down', distance: 0 },
      severity: Math.min(1.0, collidingNodes.length / 3) // 최대 3개 충돌 시 심각도 1.0
    };
  }

  /**
   * 노드 사각형 생성
   */
  private createNodeRect(position: BranchPosition) {
    return {
      x: position.x - BRANCH_LAYOUT_CONFIG.nodeWidth / 2,
      y: position.y - BRANCH_LAYOUT_CONFIG.nodeHeight / 2,
      width: BRANCH_LAYOUT_CONFIG.nodeWidth,
      height: BRANCH_LAYOUT_CONFIG.nodeHeight
    };
  }

  /**
   * 사각형 겹침 검사
   */
  private isRectOverlapping(rect1: any, rect2: any): boolean {
    const threshold = BRANCH_LAYOUT_CONFIG.overlapThreshold;

    return !(
      rect1.x + rect1.width - threshold < rect2.x ||
      rect2.x + rect2.width - threshold < rect1.x ||
      rect1.y + rect1.height - threshold < rect2.y ||
      rect2.y + rect2.height - threshold < rect1.y
    );
  }

  /**
   * 충돌 해결을 위한 위치 조정
   */
  private adjustPositionForCollision(
    position: BranchPosition,
    collisionResult: CollisionDetectionResult,
    feedType: string
  ): BranchPosition {
    const { direction, distance } = collisionResult.recommendedAdjustment;
    const config = BRANCH_CONFIGURATIONS[feedType as keyof typeof BRANCH_CONFIGURATIONS];

    let newPosition = { ...position };

    // 우선순위에 따른 조정 방향 결정
    if (config.priority <= 2) {
      // 높은 우선순위: X축 조정 (더 길게)
      newPosition.x += distance;
    } else {
      // 낮은 우선순위: Y축 조정
      switch (direction) {
        case 'up':
          newPosition.y -= distance;
          break;
        case 'down':
          newPosition.y += distance;
          break;
        case 'left':
          newPosition.x -= distance * 0.5;
          break;
        case 'right':
          newPosition.x += distance * 0.5;
          break;
      }
    }

    return newPosition;
  }

  /**
   * 권장 조정 방향 계산
   */
  private calculateRecommendedAdjustment(
    nodeRect: any,
    occupiedPositions: any[]
  ): { direction: 'up' | 'down' | 'left' | 'right'; distance: number } {
    const spacing = BRANCH_LAYOUT_CONFIG.minBranchSpacing;

    // 기본적으로 아래쪽으로 이동 (시간 흐름 순서 유지)
    return {
      direction: 'down',
      distance: spacing
    };
  }

  /**
   * 점유된 위치 등록
   */
  private registerOccupiedPosition(
    position: BranchPosition,
    feedId: string,
    feedType: string
  ): void {
    const config = BRANCH_CONFIGURATIONS[feedType as keyof typeof BRANCH_CONFIGURATIONS];

    this.occupiedPositions.push({
      x: position.x - BRANCH_LAYOUT_CONFIG.nodeWidth / 2,
      y: position.y - BRANCH_LAYOUT_CONFIG.nodeHeight / 2,
      width: BRANCH_LAYOUT_CONFIG.nodeWidth,
      height: BRANCH_LAYOUT_CONFIG.nodeHeight,
      feedId,
      priority: config.priority
    });
  }

  /**
   * 초기 시각적 상태 생성
   */
  private createInitialVisualState(): NodeVisualState {
    return {
      isHovered: false,
      isExpanded: false,
      isSelected: false,
      animationDelay: 0,
      isVisible: true
    };
  }

  /**
   * 시각적 상태 초기화
   */
  private initializeVisualStates(feeds: FeedItemWithPosition[]): FeedItemWithPosition[] {
    return feeds.map((feed, index) => ({
      ...feed,
      visualState: {
        ...feed.visualState,
        animationDelay: index * 80 // 순차 애니메이션
      }
    }));
  }

  /**
   * 브랜치 연결선 생성
   */
  private generateBranchConnectors(feeds: FeedItemWithPosition[]): BranchConnector[] {
    return feeds.map(feed => {
      const config = BRANCH_CONFIGURATIONS[feed.type];
      const pathGenerator = BRANCH_PATH_GENERATORS[config.branchType];

      // 메인 타임라인에서 시작 (VerticalProgressBar의 오른쪽 가장자리)
      const startX = 60; // 프로그레스바 너비 + 여백
      const endX = feed.branchPosition.x;
      const y = feed.branchPosition.y;

      // 애니메이션 상태 결정
      const animationState = feed.visualState?.isHovered ? 'pulsing' :
                            feed.visualState?.isSelected ? 'drawing' : 'idle';

      return {
        id: `connector-${feed.id}`,
        startPoint: { x: startX, y },
        endPoint: { x: endX, y },
        style: config,
        animationState,
        pathData: pathGenerator(startX, y, endX, y),
        feedId: feed.id
      };
    });
  }

  /**
   * 성능 최적화를 위한 뷰포트 내 피드만 필터링
   */
  filterVisibleFeeds(
    feeds: FeedItemWithPosition[],
    scrollPosition: number,
    viewportHeight: number
  ): FeedItemWithPosition[] {
    const buffer = 100; // 추가 버퍼

    return feeds.filter(feed => {
      const feedY = feed.branchPosition.y;
      return feedY >= scrollPosition - buffer &&
             feedY <= scrollPosition + viewportHeight + buffer;
    });
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const branchLayoutEngine = new BranchLayoutEngine();