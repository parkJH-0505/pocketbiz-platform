/**
 * Project Change Detection 테스트
 * Phase 1: 동기화 성능 최적화 검증
 */

import { renderHook, act } from '@testing-library/react';
import { useProjectChangeDetection, mergeChangeSets, summarizeChanges } from '../projectChangeDetection';
import type { Project } from '../../types/buildup.types';

describe('Phase 1: 프로젝트 변경 감지 성능 테스트', () => {
  // 테스트용 프로젝트 데이터 생성
  const createMockProject = (id: string, title: string): Project => ({
    id,
    title,
    description: `${title} 프로젝트`,
    status: 'active',
    phase: 'planning',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 0,
    team: {
      pm: { id: 'pm1', name: 'PM', email: 'pm@test.com' },
      members: []
    },
    meetings: [],
    deliverables: [],
    risks: [],
    updates: []
  });

  describe('변경 감지 정확도', () => {
    it('새로운 프로젝트 추가를 정확히 감지해야 함', () => {
      const { result } = renderHook(() => useProjectChangeDetection());

      const initialProjects: Project[] = [
        createMockProject('p1', 'Project 1'),
        createMockProject('p2', 'Project 2')
      ];

      const updatedProjects: Project[] = [
        ...initialProjects,
        createMockProject('p3', 'Project 3')
      ];

      // 초기 상태 설정
      act(() => {
        result.current.detectChanges(initialProjects);
      });

      // 변경사항 감지
      const changes = act(() => result.current.detectChanges(updatedProjects));

      expect(changes.added).toHaveLength(1);
      expect(changes.added[0].id).toBe('p3');
      expect(changes.modified).toHaveLength(0);
      expect(changes.removed).toHaveLength(0);
    });

    it('프로젝트 수정을 정확히 감지해야 함', () => {
      const { result } = renderHook(() => useProjectChangeDetection());

      const project1 = createMockProject('p1', 'Project 1');
      const initialProjects: Project[] = [project1];

      // 초기 상태 설정
      act(() => {
        result.current.detectChanges(initialProjects);
      });

      // 프로젝트 수정
      const modifiedProject = {
        ...project1,
        title: 'Modified Project 1',
        progress: 50
      };

      const changes = act(() => result.current.detectChanges([modifiedProject]));

      expect(changes.modified).toHaveLength(1);
      expect(changes.modified[0].id).toBe('p1');
      expect(changes.added).toHaveLength(0);
      expect(changes.removed).toHaveLength(0);
    });

    it('프로젝트 삭제를 정확히 감지해야 함', () => {
      const { result } = renderHook(() => useProjectChangeDetection());

      const initialProjects: Project[] = [
        createMockProject('p1', 'Project 1'),
        createMockProject('p2', 'Project 2')
      ];

      // 초기 상태 설정
      act(() => {
        result.current.detectChanges(initialProjects);
      });

      // 프로젝트 삭제
      const updatedProjects = [initialProjects[0]];
      const changes = act(() => result.current.detectChanges(updatedProjects));

      expect(changes.removed).toHaveLength(1);
      expect(changes.removed[0]).toBe('p2');
      expect(changes.added).toHaveLength(0);
      expect(changes.modified).toHaveLength(0);
    });
  });

  describe('성능 최적화 검증', () => {
    it('JSON.stringify보다 빠른 성능을 보여야 함', () => {
      const { result } = renderHook(() => useProjectChangeDetection());

      // 대량 프로젝트 생성 (100개)
      const projects = Array.from({ length: 100 }, (_, i) =>
        createMockProject(`p${i}`, `Project ${i}`)
      );

      // JSON.stringify 방식 성능 측정
      const jsonStart = performance.now();
      const snapshot1 = JSON.stringify(projects);
      const snapshot2 = JSON.stringify(projects);
      const jsonComparison = snapshot1 === snapshot2;
      const jsonEnd = performance.now();
      const jsonTime = jsonEnd - jsonStart;

      // 새로운 변경 감지 방식 성능 측정
      const detectStart = performance.now();
      act(() => {
        result.current.detectChanges(projects);
        result.current.detectChanges(projects); // 동일한 데이터로 다시 실행
      });
      const detectEnd = performance.now();
      const detectTime = detectEnd - detectStart;

      console.log(`JSON.stringify 시간: ${jsonTime}ms`);
      console.log(`변경 감지 시간: ${detectTime}ms`);
      console.log(`성능 개선: ${((jsonTime - detectTime) / jsonTime * 100).toFixed(2)}%`);

      // 새로운 방식이 더 빠르거나 최소한 비슷해야 함
      expect(detectTime).toBeLessThanOrEqual(jsonTime * 1.1); // 10% 마진
    });

    it('메모리 효율성: 캐시 크기가 적절히 관리되어야 함', () => {
      const { result } = renderHook(() => useProjectChangeDetection());

      // 100개 프로젝트 처리
      const projects = Array.from({ length: 100 }, (_, i) =>
        createMockProject(`p${i}`, `Project ${i}`)
      );

      act(() => {
        result.current.detectChanges(projects);
      });

      // 캐시 크기 확인
      const cacheSize = result.current.getCacheSize();
      expect(cacheSize).toBe(100);

      // 캐시 초기화
      act(() => {
        result.current.resetCache();
      });

      expect(result.current.getCacheSize()).toBe(0);
    });
  });

  describe('배치 변경 감지', () => {
    it('배치 처리로 여러 변경사항을 효율적으로 처리해야 함', async () => {
      const { result } = renderHook(() => useProjectChangeDetection({
        batchDelay: 100
      }));

      const initialProjects = [createMockProject('p1', 'Project 1')];
      const updatedProjects1 = [...initialProjects, createMockProject('p2', 'Project 2')];
      const updatedProjects2 = [...updatedProjects1, createMockProject('p3', 'Project 3')];

      // 초기 설정
      act(() => {
        result.current.detectChanges(initialProjects);
      });

      // 여러 변경사항 연속 발생
      const promise1 = act(() => result.current.detectChangesBatched(updatedProjects1));
      const promise2 = act(() => result.current.detectChangesBatched(updatedProjects2));

      // 배치 처리 대기
      const [batch1, batch2] = await Promise.all([promise1, promise2]);

      // 배치로 처리되어야 함
      expect(batch1.length).toBeGreaterThan(0);
      expect(batch2.length).toBeGreaterThan(0);
    });
  });

  describe('유틸리티 함수', () => {
    it('변경사항 병합이 정확해야 함', () => {
      const change1 = {
        added: [createMockProject('p1', 'Project 1')],
        modified: [],
        removed: [],
        timestamp: new Date()
      };

      const change2 = {
        added: [createMockProject('p2', 'Project 2')],
        modified: [createMockProject('p1', 'Modified Project 1')],
        removed: [],
        timestamp: new Date()
      };

      const merged = mergeChangeSets([change1, change2]);

      expect(merged.added).toHaveLength(2);
      expect(merged.modified).toHaveLength(0); // p1은 added에 이미 있으므로 modified에서 제외
      expect(merged.removed).toHaveLength(0);
    });

    it('변경사항 요약이 정확해야 함', () => {
      const changes = {
        added: [createMockProject('p1', 'P1'), createMockProject('p2', 'P2')],
        modified: [createMockProject('p3', 'P3')],
        removed: ['p4'],
        timestamp: new Date()
      };

      const summary = summarizeChanges(changes);
      expect(summary).toBe('프로젝트 변경: 2개 추가, 1개 수정, 1개 삭제');
    });

    it('변경사항이 없을 때 적절한 메시지를 반환해야 함', () => {
      const changes = {
        added: [],
        modified: [],
        removed: [],
        timestamp: new Date()
      };

      const summary = summarizeChanges(changes);
      expect(summary).toBe('변경 사항 없음');
    });
  });

  describe('성능 벤치마크', () => {
    it('1000개 프로젝트 처리 시 100ms 이내여야 함', () => {
      const { result } = renderHook(() => useProjectChangeDetection());

      const projects = Array.from({ length: 1000 }, (_, i) =>
        createMockProject(`p${i}`, `Project ${i}`)
      );

      const start = performance.now();
      act(() => {
        result.current.detectChanges(projects);
      });
      const end = performance.now();

      const processingTime = end - start;
      console.log(`1000개 프로젝트 처리 시간: ${processingTime}ms`);

      expect(processingTime).toBeLessThan(100);
    });
  });
});