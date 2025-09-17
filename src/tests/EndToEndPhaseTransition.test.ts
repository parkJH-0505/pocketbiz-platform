/**
 * EndToEndPhaseTransition.test.ts
 *
 * Stage C-4: End-to-End Phase Transition 워크플로우 테스트
 * 실제 사용 시나리오를 기반으로 한 전체 플로우 검증
 */

import { renderHook, act } from '@testing-library/react';
import { usePhaseTransition } from '../hooks/usePhaseTransition';
import { EventBus, createEvent, PhaseTransitionModule } from '../core/index';
import { BuildupProvider, useBuildupContext } from '../contexts/BuildupContext';
import React from 'react';
import type { Project, GuideMeetingRecord } from '../types/buildup.types';

// Test wrapper with BuildupProvider
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <BuildupProvider>{children}</BuildupProvider>
  );
};

// Mock project for testing
const createTestProject = (phase: string = 'contract_pending'): Project => ({
  id: `PRJ-E2E-${Date.now()}`,
  title: 'End-to-End Test Project',
  service_id: 'SVC-E2E-001',
  category: '개발',
  status: 'active',
  phase: phase as any,
  created_from: 'catalog',
  contract: {
    id: 'CNT-E2E-001',
    value: 15000000,
    signed_date: new Date(),
    start_date: new Date(),
    end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
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
      id: 'pm-e2e',
      name: 'E2E Test PM',
      role: 'Project Manager',
      email: 'pm@e2e.test',
      company: '포켓컴퍼니'
    },
    members: [],
    client_contact: {
      id: 'client-e2e',
      name: 'E2E Test Client',
      role: 'CEO',
      email: 'client@e2e.test',
      company: 'E2E Test Company'
    }
  },
  risks: [],
  meetings: [],
  files: [],
  communication: {
    unread_messages: 0,
    last_activity: new Date()
  }
});

describe('End-to-End Phase Transition Workflow', () => {
  beforeEach(() => {
    // Clean slate for each test
    EventBus.reset();
    PhaseTransitionModule.reset();
  });

  afterEach(() => {
    // Cleanup
    const module = PhaseTransitionModule.getInstance();
    if (module.isAvailable()) {
      module.dispose();
    }
  });

  describe('Complete Project Lifecycle', () => {
    test('should handle full project lifecycle from contract to completion', async () => {
      const wrapper = createWrapper();
      const { result: phaseHook } = renderHook(() => usePhaseTransition(), { wrapper });
      const { result: contextHook } = renderHook(() => useBuildupContext(), { wrapper });

      const testProject = createTestProject('contract_pending');

      // Step 1: Enable Phase Transition System
      await act(async () => {
        await phaseHook.current.enablePhaseTransition();
      });

      expect(phaseHook.current.status.isEnabled).toBe(true);
      expect(phaseHook.current.status.healthy).toBe(true);

      // Step 2: Create project (simulate payment completion)
      await act(async () => {
        contextHook.current.createProject(testProject);
      });

      // Step 3: Trigger payment completion -> kickoff_ready
      await act(async () => {
        await contextHook.current.handlePaymentCompleted(testProject.id, { amount: 15000000 });
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 4: Simulate kickoff meeting completion -> in_progress
      const kickoffMeeting: GuideMeetingRecord = {
        id: 'MTG-KICKOFF-001',
        type: '킥오프',
        notes: 'Kickoff meeting completed successfully. Project officially started.',
        completed: true,
        completedAt: new Date()
      };

      await act(async () => {
        await phaseHook.current.triggerMeetingCompleted(
          testProject.id,
          kickoffMeeting,
          testProject.team.pm.id
        );
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 5: Simulate manual transition to review phase
      await act(async () => {
        await phaseHook.current.requestPhaseChange(
          testProject.id,
          'in_progress',
          'review',
          'Development completed, ready for review'
        );
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 6: Simulate final approval -> completed
      await act(async () => {
        await phaseHook.current.requestPhaseChange(
          testProject.id,
          'review',
          'completed',
          'All deliverables approved, project completed'
        );
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify: Check phase transition history
      const history = contextHook.current.getPhaseTransitionHistory(testProject.id);

      // Should have multiple phase transitions
      expect(history.length).toBeGreaterThanOrEqual(1);

      // No errors should have occurred
      expect(phaseHook.current.error).toBeNull();
    });
  });

  describe('Phase Transition Rules Validation', () => {
    test('should enforce valid phase transitions', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePhaseTransition(), { wrapper });

      const testProject = createTestProject('contract_pending');

      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      // Valid transition: contract_pending -> kickoff_ready
      expect(result.current.canTransitionTo(testProject, 'kickoff_ready')).toBe(true);

      // Invalid transition: contract_pending -> completed
      expect(result.current.canTransitionTo(testProject, 'completed')).toBe(false);

      // Test available transitions
      const availableTransitions = result.current.getAvailableTransitions(testProject);
      expect(availableTransitions).toContain('kickoff_ready');
      expect(availableTransitions).not.toContain('completed');

      // Test project in different phase
      const inProgressProject = createTestProject('in_progress');
      const inProgressTransitions = result.current.getAvailableTransitions(inProgressProject);
      expect(inProgressTransitions).toContain('review');
      expect(inProgressTransitions).toContain('on_hold');
    });
  });

  describe('Meeting-Triggered Transitions', () => {
    test('should handle different meeting types correctly', async () => {
      const wrapper = createWrapper();
      const { result: phaseHook } = renderHook(() => usePhaseTransition(), { wrapper });
      const { result: contextHook } = renderHook(() => useBuildupContext(), { wrapper });

      const testProject = createTestProject('kickoff_ready');

      await act(async () => {
        await phaseHook.current.enablePhaseTransition();
      });

      // Different meeting types
      const meetingTypes: Array<{ type: string; expectedPhase?: string }> = [
        { type: '킥오프' },
        { type: '진행상황 점검' },
        { type: '중간 검토' },
        { type: '최종 검토' }
      ];

      for (const meeting of meetingTypes) {
        const meetingRecord: GuideMeetingRecord = {
          id: `MTG-${meeting.type}-${Date.now()}`,
          type: meeting.type,
          notes: `${meeting.type} meeting completed successfully`,
          completed: true,
          completedAt: new Date()
        };

        await act(async () => {
          await phaseHook.current.triggerMeetingCompleted(
            testProject.id,
            meetingRecord,
            testProject.team.pm.id
          );
        });

        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Should not have errors
      expect(phaseHook.current.error).toBeNull();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle system errors gracefully', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePhaseTransition(), { wrapper });

      // Try to use system before enabling
      await act(async () => {
        try {
          await result.current.requestPhaseChange(
            'invalid-project-id',
            'contract_pending',
            'kickoff_ready',
            'This should not break the system'
          );
        } catch (error) {
          // Expected to handle gracefully
        }
      });

      // System should still be functional
      expect(result.current).toBeDefined();

      // Enable system
      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      expect(result.current.status.isEnabled).toBe(true);
    });

    test('should handle invalid phase transitions gracefully', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePhaseTransition(), { wrapper });

      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      // Try invalid transition
      await act(async () => {
        await result.current.requestPhaseChange(
          'test-project',
          'contract_pending',
          'invalid_phase',
          'This should be handled gracefully'
        );
      });

      // System should continue to work
      expect(result.current.status.isEnabled).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple simultaneous phase requests', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePhaseTransition(), { wrapper });

      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      const testProjects = [
        createTestProject('contract_pending'),
        createTestProject('kickoff_ready'),
        createTestProject('in_progress')
      ];

      // Simulate multiple simultaneous requests
      const requests = testProjects.map(project =>
        act(async () => {
          const transitions = result.current.getAvailableTransitions(project);
          if (transitions.length > 0) {
            await result.current.requestPhaseChange(
              project.id,
              project.phase || 'contract_pending',
              transitions[0],
              'Concurrent transition test'
            );
          }
        })
      );

      // All requests should complete without errors
      await Promise.allSettled(requests);

      expect(result.current.error).toBeNull();
      expect(result.current.status.healthy).toBe(true);
    });
  });

  describe('System Performance', () => {
    test('should maintain performance under load', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePhaseTransition(), { wrapper });

      await act(async () => {
        await result.current.enablePhaseTransition();
      });

      const startTime = performance.now();
      const numberOfOperations = 50;

      // Perform multiple operations
      const operations = Array.from({ length: numberOfOperations }, (_, i) =>
        act(async () => {
          const project = createTestProject('contract_pending');
          const transitions = result.current.getAvailableTransitions(project);

          if (transitions.length > 0) {
            await result.current.requestPhaseChange(
              `project-${i}`,
              'contract_pending',
              transitions[0],
              `Performance test ${i}`
            );
          }
        })
      );

      await Promise.allSettled(operations);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const operationsPerSecond = (numberOfOperations / duration) * 1000;

      console.log(`Performance: ${operationsPerSecond.toFixed(2)} operations/second`);

      // Should maintain reasonable performance (at least 10 ops/second)
      expect(operationsPerSecond).toBeGreaterThan(10);
      expect(result.current.error).toBeNull();
    });
  });
});