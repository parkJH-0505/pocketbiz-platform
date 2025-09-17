/**
 * 프로젝트와 채팅 시스템 연동을 위한 커스텀 훅
 * BuildupContext와 ChatContext 간의 연동을 관리
 */

import { useEffect, useRef, useMemo } from 'react';
import { useBuildupContext } from '../contexts/BuildupContext';
import { useChatContext } from '../contexts/ChatContext';
import type { Project } from '../types/buildup.types';

export function useProjectChatIntegration() {
  const { projects } = useBuildupContext();
  const { createChatRoomForProject, sendSystemMessage } = useChatContext();

  // 이미 처리된 프로젝트 ID를 useRef로 관리 (리렌더링 방지)
  const processedProjectsRef = useRef<Set<string>>(new Set());

  // 프로젝트 ID 목록을 memoize하여 불필요한 리렌더링 방지
  const projectIds = useMemo(() => projects.map(p => p.id), [projects.length]);

  // 새 프로젝트 감지 및 채팅방 생성
  useEffect(() => {
    let hasChanges = false;

    projects.forEach(project => {
      if (!processedProjectsRef.current.has(project.id)) {
        // 새 프로젝트에 대한 채팅방 생성
        try {
          createChatRoomForProject(project);
          processedProjectsRef.current.add(project.id);
          hasChanges = true;

          // 프로젝트 단계 변경 시 시스템 메시지 전송 (console.log만)
          if (project.phase && project.phase !== 'contract_pending') {
            const phaseMessages: Record<string, string> = {
              contract_signed: '계약이 완료되어 프로젝트가 시작됩니다!',
              planning: '기획 단계가 시작되었습니다. PM이 요구사항을 정리하고 있습니다.',
              design: '디자인 단계로 진입했습니다. 시안 작업이 진행됩니다.',
              execution: '실행 단계가 시작되었습니다. 본격적인 개발/제작이 진행됩니다.',
              review: '검토 단계입니다. 최종 점검이 진행됩니다.',
              completed: '프로젝트가 성공적으로 완료되었습니다!'
            };

            const message = phaseMessages[project.phase];
            if (message) {
              // 단계 변경 메시지는 console.log만 수행 (실제 메시지 전송은 하지 않음)
              console.log(`Phase change message for ${project.id}: ${message}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to create chat room for project ${project.id}:`, error);
        }
      }
    });

    // 실제로 변경사항이 있을 때만 로그 출력
    if (hasChanges) {
      console.log(`Processed ${processedProjectsRef.current.size} projects for chat integration`);
    }
  }, [projectIds.length]);

  // 프로젝트 단계 변경 감지 함수
  const notifyPhaseChange = (
    projectId: string,
    oldPhase: string,
    newPhase: string
  ) => {
    const phaseLabels: Record<string, string> = {
      contract_pending: '계약중',
      contract_signed: '계약완료',
      planning: '기획',
      design: '설계',
      execution: '실행',
      review: '검토',
      completed: '완료'
    };

    const message = `프로젝트 단계가 [${phaseLabels[oldPhase]}]에서 [${phaseLabels[newPhase]}]로 변경되었습니다.`;

    sendSystemMessage(`room-${projectId}`, message, {
      systemEventType: 'phase_change',
      oldPhase,
      newPhase
    });
  };

  return {
    notifyPhaseChange
  };
}