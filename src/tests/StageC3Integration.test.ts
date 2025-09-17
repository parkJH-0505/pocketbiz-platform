/**
 * StageC3Integration.test.ts
 *
 * Stage C-3: Context Integration 통합 테스트
 * BuildupContext, React Hook, UI 컴포넌트의 통합 테스트
 */

import { renderHook, act } from '@testing-library/react';
import { usePhaseTransition } from '../hooks/usePhaseTransition';
import { EventBus, createEvent, PhaseTransitionModule } from '../core/index';
import type { Project, GuideMeetingRecord } from '../types/buildup.types';

// Mock project data
const mockProject: Project = {
  id: 'PRJ-TEST-001',
  title: 'Test Project',
  service_id: 'SVC-TEST-001',
  category: '개발',
  status: 'active',
  phase: 'contract_pending',
  created_from: 'catalog',
  contract: {
    id: 'CNT-TEST-001',
    value: 10000000,
    signed_date: new Date(),
    start_date: new Date(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  timeline: {
    kickoff_date: new Date(),
    phase_updated_at: new Date(),
    phase_updated_by: 'system',
    start_date: new Date(),
    end_date: new Date()
  },
  workstreams: [],
  deliverables: [],
  team: {
    pm: {
      id: 'pm-test',
      name: 'Test PM',
      role: 'Project Manager',
      email: 'pm@test.com',
      company: '포켓컴퍼니'
    },
    members: [],
    client_contact: {
      id: 'client-test',
      name: 'Test Client',
      role: 'CEO',
      email: 'client@test.com',
      company: 'Test Company'
    }
  },
  risks: [],
  meetings: [],
  files: [],
  communication: {
    unread_messages: 0,
    last_activity: new Date()
  }
};

describe('Stage C-3: Context Integration Tests', () => {
  beforeEach(() => {
    // Reset all systems before each test
    EventBus.reset();
    PhaseTransitionModule.reset();
  });

  afterEach(() => {
    // Cleanup after each test
    if (PhaseTransitionModule.getInstance().isAvailable()) {
      PhaseTransitionModule.getInstance().dispose();
    }
  });

  describe('React Hook Integration', () => {
    test('should initialize with correct default state', () => {
      const { result } = renderHook(() => usePhaseTransition());

      expect(result.current.status.isEnabled).toBe(false);
      expect(result.current.status.moduleState).toBe('not_loaded');
      expect(result.current.status.engineAvailable).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should enable phase transition system', async () => {
      const { result } = renderHook(() => usePhaseTransition());

      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      expect(result.current.status.isEnabled).toBe(true);
      expect(result.current.status.moduleState).toBe('loaded');
      expect(result.current.status.engineAvailable).toBe(true);
    });

    test('should determine valid phase transitions', () => {
      const { result } = renderHook(() => usePhaseTransition());

      // Test valid transitions
      expect(result.current.canTransitionTo(mockProject, 'kickoff_ready')).toBe(true);
      expect(result.current.canTransitionTo(mockProject, 'completed')).toBe(false);

      // Test available transitions
      const availableTransitions = result.current.getAvailableTransitions(mockProject);
      expect(availableTransitions).toContain('kickoff_ready');
      expect(availableTransitions).not.toContain('completed');
    });
  });

  describe('Event-Based Phase Transitions', () => {
    test('should handle meeting completed events', async () => {
      const { result } = renderHook(() => usePhaseTransition());

      // Enable the system first
      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      const meetingRecord: GuideMeetingRecord = {
        id: 'MTG-TEST-001',
        type: '킥오프',
        notes: 'Test meeting completed',
        completed: true,
        completedAt: new Date()
      };

      // Trigger meeting completed
      await act(async () => {
        await result.current.triggerMeetingCompleted(mockProject.id, meetingRecord, 'pm-test');
      });

      // Should not throw errors
      expect(result.current.error).toBeNull();
    });

    test('should handle manual phase change requests', async () => {
      const { result } = renderHook(() => usePhaseTransition());

      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      await act(async () => {
        await result.current.requestPhaseChange(
          mockProject.id,
          'contract_pending',
          'kickoff_ready',
          'Manual transition for testing'
        );
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid phase transitions gracefully', async () => {
      const { result } = renderHook(() => usePhaseTransition());

      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      // Try to transition to an invalid phase
      await act(async () => {
        await result.current.requestPhaseChange(
          mockProject.id,
          'contract_pending',
          'invalid_phase',
          'This should fail'
        );
      });

      // Should not crash, but may log errors
      expect(result.current).toBeDefined();
    });

    test('should handle system disable correctly', async () => {
      const { result } = renderHook(() => usePhaseTransition());

      // Enable first
      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      expect(result.current.status.isEnabled).toBe(true);

      // Disable
      act(() => {
        result.current.disablePhaseTransition();
      });

      expect(result.current.status.isEnabled).toBe(false);
    });
  });

  describe('Event Bus Integration', () => {
    test('should emit events correctly through the system', async () => {
      const eventBus = EventBus.getInstance();
      const phaseModule = PhaseTransitionModule.getInstance();

      // Track events
      const receivedEvents: any[] = [];
      eventBus.on('PHASE_CHANGE_REQUEST', (event) => {
        receivedEvents.push(event);
      });

      // Enable system
      phaseModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', true);
      await phaseModule.enable();

      // Create and emit event
      const phaseChangeEvent = createEvent('PHASE_CHANGE_REQUEST', {
        projectId: mockProject.id,
        currentPhase: 'contract_pending',
        targetPhase: 'kickoff_ready',
        reason: 'Integration test',
        requestedBy: 'test-user',
        automatic: false
      }, { source: 'IntegrationTest' });

      await eventBus.emit('PHASE_CHANGE_REQUEST', phaseChangeEvent);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].payload.projectId).toBe(mockProject.id);
    });
  });

  describe('System Health and Status', () => {
    test('should report correct system health', async () => {
      const { result } = renderHook(() => usePhaseTransition());

      // Check initial health
      await act(async () => {
        await result.current.refreshStatus();
      });

      expect(result.current.status).toBeDefined();

      // Enable and check health again
      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      expect(result.current.status.healthy).toBe(true);
      expect(result.current.status.isEnabled).toBe(true);
    });

    test('should handle status refresh without errors', async () => {
      const { result } = renderHook(() => usePhaseTransition());

      await act(async () => {
        await result.current.refreshStatus();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('UI Component Data Flow', () => {
    test('should provide correct data for UI components', () => {
      const { result } = renderHook(() => usePhaseTransition());

      // Test phase transition rules
      const transitions = result.current.getAvailableTransitions(mockProject);
      expect(Array.isArray(transitions)).toBe(true);

      // Test transition validation
      transitions.forEach(phase => {
        expect(result.current.canTransitionTo(mockProject, phase)).toBe(true);
      });
    });

    test('should support project with different phases', () => {
      const { result } = renderHook(() => usePhaseTransition());

      // Test project in different phases
      const projectInProgress = { ...mockProject, phase: 'in_progress' as any };
      const inProgressTransitions = result.current.getAvailableTransitions(projectInProgress);

      expect(inProgressTransitions).toContain('review');
      expect(inProgressTransitions).toContain('on_hold');
      expect(inProgressTransitions).not.toContain('kickoff_ready');
    });
  });
});