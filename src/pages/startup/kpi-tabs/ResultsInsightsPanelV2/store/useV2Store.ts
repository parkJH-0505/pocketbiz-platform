/**
 * V2 Dashboard Zustand Store
 * 중앙 집중식 상태 관리
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  V2Store,
  AxisKey,
  ComparisonMode,
  SimulationAdjustments,
  Vector3,
  PeerFilters
} from '../types';
import { mockApiEndpoints } from '../utils/mockApi';
import { loadIntegratedData } from '../utils/dataIntegration';
import { createRealtimeSync, type ChangeDetection, type SyncEvent } from '../utils/realTimeSync';
import { aiInsightsEngine, type AIInsight } from '../utils/aiInsights';
import { assessDataQuality, calculateDataQualityLevel } from '../utils/dataQuality';

const initialState = {
  viewState: {
    selectedAxis: null,
    hoveredElement: null,
    expandedCards: [],
    comparisonMode: 'none' as ComparisonMode,
    isLoading: false,
    error: null,
  },
  simulation: {
    isActive: false,
    adjustments: {
      price: 0,
      churn: 0,
      team: 0,
      growth: 0,
    },
    calculatedScore: 0,
    projectedScores: {} as Record<AxisKey, number>,
    impactBreakdown: {} as Record<AxisKey, number>,
    confidence: 0,
    risks: [],
    opportunities: [],
  },
  animation: {
    radarRotation: { x: 0, y: 0, z: 0 },
    isAutoRotating: false,
    particlesActive: true,
    transitionPhase: 'idle' as const,
    animationSpeed: 1,
  },
  data: null,
  peerData: null,

  // 실시간 데이터 감지 상태
  realTimeMonitoring: {
    isEnabled: false,
    lastUpdate: null,
    changeHistory: [],
    detectionThreshold: 2, // 최소 감지 임계값
    updateInterval: 5000, // 5초마다 체크
    activeChanges: new Map(),
    alertQueue: [],
  },
};

export const useV2Store = create<V2Store>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ========== View Actions ==========
      setSelectedAxis: (axis) =>
        set((state) => {
          state.viewState.selectedAxis = axis;
          state.animation.transitionPhase = 'transitioning';

          // 축 선택시 자동 회전 중지
          if (axis) {
            state.animation.isAutoRotating = false;
          }
        }),

      setHoveredElement: (element) =>
        set((state) => {
          state.viewState.hoveredElement = element;
        }),

      toggleCard: (cardId) =>
        set((state) => {
          const index = state.viewState.expandedCards.indexOf(cardId);
          if (index > -1) {
            state.viewState.expandedCards.splice(index, 1);
          } else {
            state.viewState.expandedCards.push(cardId);
          }
        }),

      setComparisonMode: (mode) =>
        set((state) => {
          state.viewState.comparisonMode = mode;
          state.animation.transitionPhase = 'transitioning';
        }),

      // ========== Simulation Actions ==========
      updateSimulation: (key, value) =>
        set((state) => {
          state.simulation.adjustments[key] = value;
          state.simulation.isActive = true;

          // 즉시 피드백을 위한 임시 계산
          const baseScore = state.data?.current.overall || 68;
          const impact = {
            price: value * 0.3,
            churn: value * -0.2,
            team: value * 0.15,
            growth: value * 0.25,
          };

          state.simulation.calculatedScore = Math.min(
            100,
            Math.max(0, baseScore + impact[key])
          );
        }),

      runSimulation: async () => {
        set((state) => {
          state.viewState.isLoading = true;
        });

        try {
          const adjustments = get().simulation.adjustments;
          const response = await mockApiEndpoints.simulate(adjustments);

          set((state) => {
            state.simulation.projectedScores = response.projected;
            state.simulation.calculatedScore = response.overall;
            state.simulation.confidence = response.confidence;
            state.simulation.risks = response.risks;
            state.simulation.opportunities = response.opportunities;
            state.viewState.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.viewState.error = '시뮬레이션 실행 중 오류가 발생했습니다';
            state.viewState.isLoading = false;
          });
        }
      },

      resetSimulation: () =>
        set((state) => {
          state.simulation = initialState.simulation;
        }),

      // 실시간 동기화 관련 메서드 추가
      updateScores: (scores, overall) =>
        set((state) => {
          if (state.data) {
            state.data.current.scores = scores;
            state.data.current.overall = overall;
          }
        }),

      setSimulationResult: (result) =>
        set((state) => {
          if (result) {
            state.simulation.projectedScores = result.projected || {};
            state.simulation.confidence = result.confidence || 0;
            state.simulation.risks = result.risks || [];
            state.simulation.opportunities = result.opportunities || [];
          }
        }),

      loadFromSync: (syncData) =>
        set((state) => {
          if (syncData.data) state.data = syncData.data;
          if (syncData.simulation) state.simulation = { ...state.simulation, ...syncData.simulation };
          if (syncData.viewState) state.viewState = { ...state.viewState, ...syncData.viewState };
        }),

      exportForSync: () => {
        const state = get();
        return {
          data: state.data,
          simulation: state.simulation,
          viewState: {
            selectedAxis: state.viewState.selectedAxis,
            comparisonMode: state.viewState.comparisonMode
          },
          timestamp: Date.now()
        };
      },

      // ========== 실시간 데이터 감지 Actions ==========
      enableRealTimeMonitoring: () =>
        set((state) => {
          state.realTimeMonitoring.isEnabled = true;
          state.realTimeMonitoring.lastUpdate = Date.now();
        }),

      disableRealTimeMonitoring: () =>
        set((state) => {
          state.realTimeMonitoring.isEnabled = false;
        }),

      updateDetectionThreshold: (threshold) =>
        set((state) => {
          state.realTimeMonitoring.detectionThreshold = threshold;
        }),

      updateInterval: (interval) =>
        set((state) => {
          state.realTimeMonitoring.updateInterval = interval;
        }),

      addChangeDetection: (change) =>
        set((state) => {
          const changeId = `${change.axis}-${Date.now()}`;
          state.realTimeMonitoring.activeChanges.set(changeId, {
            ...change,
            id: changeId,
            timestamp: Date.now(),
            severity: Math.abs(change.oldValue - change.newValue) > state.realTimeMonitoring.detectionThreshold ? 'high' : 'medium'
          });

          // 변경 이력에 추가 (최대 50개 유지)
          state.realTimeMonitoring.changeHistory.push({
            ...change,
            id: changeId,
            timestamp: Date.now()
          });

          if (state.realTimeMonitoring.changeHistory.length > 50) {
            state.realTimeMonitoring.changeHistory.shift();
          }

          // 중요한 변경사항은 알림 큐에 추가
          if (Math.abs(change.oldValue - change.newValue) > state.realTimeMonitoring.detectionThreshold) {
            state.realTimeMonitoring.alertQueue.push({
              id: changeId,
              type: 'data-change',
              axis: change.axis,
              message: `${change.axis} 축에서 ${Math.abs(change.oldValue - change.newValue).toFixed(1)}점 변화 감지`,
              timestamp: Date.now(),
              severity: 'high',
              actionRequired: true
            });
          }
        }),

      removeChangeDetection: (changeId) =>
        set((state) => {
          state.realTimeMonitoring.activeChanges.delete(changeId);
        }),

      clearAlertQueue: () =>
        set((state) => {
          state.realTimeMonitoring.alertQueue = [];
        }),

      removeAlert: (alertId) =>
        set((state) => {
          state.realTimeMonitoring.alertQueue = state.realTimeMonitoring.alertQueue.filter(
            alert => alert.id !== alertId
          );
        }),

      updateLastCheckTime: () =>
        set((state) => {
          state.realTimeMonitoring.lastUpdate = Date.now();
        }),

      saveScenario: (name) => {
        const scenario = {
          id: Date.now().toString(),
          name,
          adjustments: get().simulation.adjustments,
          score: get().simulation.calculatedScore,
          timestamp: new Date().toISOString(),
        };

        // localStorage에 저장
        const scenarios = JSON.parse(
          localStorage.getItem('v2_scenarios') || '[]'
        );
        scenarios.push(scenario);
        localStorage.setItem('v2_scenarios', JSON.stringify(scenarios));

        console.log('Scenario saved:', scenario);
      },

      loadScenario: (id) => {
        const scenarios = JSON.parse(
          localStorage.getItem('v2_scenarios') || '[]'
        );
        const scenario = scenarios.find((s: any) => s.id === id);

        if (scenario) {
          set((state) => {
            state.simulation.adjustments = scenario.adjustments;
            state.simulation.calculatedScore = scenario.score;
            state.simulation.isActive = true;
          });
        }
      },

      // ========== Animation Actions ==========
      setRotation: (rotation) =>
        set((state) => {
          state.animation.radarRotation = {
            ...state.animation.radarRotation,
            ...rotation,
          };
        }),

      toggleAutoRotate: () =>
        set((state) => {
          state.animation.isAutoRotating = !state.animation.isAutoRotating;
        }),

      toggleParticles: () =>
        set((state) => {
          state.animation.particlesActive = !state.animation.particlesActive;
        }),

      // ========== Data Actions ==========
      loadData: async (contextData?: any) => {
        set((state) => {
          state.viewState.isLoading = true;
        });

        try {
          // 통합 데이터 로더 사용 (Context 데이터 우선, Mock 데이터 폴백)
          const integratedData = await loadIntegratedData(contextData);

          set((state) => {
            state.data = integratedData;
            state.viewState.isLoading = false;
            state.animation.transitionPhase = 'entering';
          });

          console.log('✅ V2 Store data loaded:', integratedData);
        } catch (error) {
          set((state) => {
            state.viewState.error = '데이터 로딩 실패';
            state.viewState.isLoading = false;
          });
          console.error('❌ V2 Store data loading failed:', error);
        }
      },

      loadPeerData: async (filters) => {
        try {
          const peerData = await mockApiEndpoints.getPeerData(filters);

          set((state) => {
            state.peerData = peerData;
          });
        } catch (error) {
          console.error('Failed to load peer data:', error);
        }
      },

      refreshData: async () => {
        await get().loadData();
        await get().loadPeerData();
      },

      // 직접 데이터 설정 (Context 연동용)
      setData: (data) =>
        set((state) => {
          state.data = data;
        }),

      // ========== Error Handling Actions ==========
      setError: (error) =>
        set((state) => {
          state.viewState.error = error;
        }),

      clearError: () =>
        set((state) => {
          state.viewState.error = null;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.viewState.isLoading = loading;
        }),

      // ========== Real-time Sync & AI Actions ==========
      syncState: {
        isActive: false,
        lastUpdate: null,
        changeHistory: [],
        insights: [],
        dataQuality: null,
        syncManager: null
      },

      startRealTimeSync: () => {
        const state = get();
        if (state.syncState.isActive) return;

        const realtimeSync = createRealtimeSync({
          enabled: true,
          interval: 30000, // 30초
          retryAttempts: 3
        });

        // 데이터 업데이트 리스너
        realtimeSync.onDataUpdate((payload) => {
          const { data, changes, confidence } = payload;

          set((state) => {
            state.data = data;
            state.syncState.lastUpdate = new Date();
            state.syncState.changeHistory = [
              ...state.syncState.changeHistory.slice(-9), // 최근 10개만 유지
              {
                timestamp: new Date(),
                changes,
                confidence
              }
            ];
          });

          // AI 인사이트 생성 트리거
          get().generateAIInsights();
        });

        // 점수 변경 리스너
        realtimeSync.onScoreChange((change) => {
          console.log('📊 Score changed:', change);

          // 중요한 변화인 경우 사용자에게 알림
          if (change.magnitude > 10) {
            set((state) => {
              state.viewState.error = null; // 긍정적 변화는 에러 메시지 클리어
            });
          }
        });

        realtimeSync.start();

        set((state) => {
          state.syncState.isActive = true;
          state.syncState.syncManager = realtimeSync;
        });

        console.log('🚀 Real-time sync started for V2 Dashboard');
      },

      stopRealTimeSync: () => {
        const state = get();
        if (state.syncState.syncManager) {
          state.syncState.syncManager.stop();
        }

        set((state) => {
          state.syncState.isActive = false;
          state.syncState.syncManager = null;
        });

        console.log('⏹️ Real-time sync stopped');
      },

      generateAIInsights: async () => {
        try {
          const state = get();

          if (!state.data?.current.scores) return;

          // 이전 점수 가져오기
          const previousScores = state.data.previous?.scores;

          // 데이터 품질 평가
          const mockResponses = {}; // 실제로는 KPI Context에서 가져올 것
          const dataQuality = assessDataQuality(
            mockResponses,
            state.data.current.scores,
            {
              lastSaved: state.syncState.lastUpdate
            }
          );

          // AI 인사이트 생성
          const insights = await aiInsightsEngine.generateInsights(
            state.data.current.scores,
            previousScores,
            {
              industry: 'tech',
              stage: 'growth',
              dataQuality,
              responses: mockResponses
            }
          );

          set((state) => {
            state.syncState.insights = insights;
            state.syncState.dataQuality = dataQuality;
          });

          console.log('🧠 AI insights generated:', insights.length);

        } catch (error) {
          console.error('❌ AI insights generation failed:', error);
        }
      },

      getLatestInsights: () => {
        return get().syncState.insights.slice(0, 5); // 최신 5개
      },

      getDataQualityScore: () => {
        const dataQuality = get().syncState.dataQuality;
        if (!dataQuality) return null;

        return calculateDataQualityLevel(dataQuality);
      },

      getSyncStatus: () => {
        const state = get();
        return {
          isActive: state.syncState.isActive,
          lastUpdate: state.syncState.lastUpdate,
          changeCount: state.syncState.changeHistory.length,
          insightCount: state.syncState.insights.length
        };
      },

      // 히스토리 데이터 관리
      getChangeHistory: () => {
        return get().syncState.changeHistory;
      },

      clearHistory: () => {
        set((state) => {
          state.syncState.changeHistory = [];
        });
      },
    })),
    {
      name: 'v2-dashboard-store',
      version: 2, // 버전 업데이트
    }
  )
);