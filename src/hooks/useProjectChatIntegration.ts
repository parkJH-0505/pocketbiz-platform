/**
 * 프로젝트와 채팅 시스템 연동을 위한 커스텀 훅
 * BuildupContext와 ChatContext 간의 연동을 관리
 */

import { useEffect } from 'react';
import { useBuildupContext } from '../contexts/BuildupContext';
import { useChatContext } from '../contexts/ChatContext';
import type { Project } from '../types/buildup.types';

export function useProjectChatIntegration() {
  const { projects } = useBuildupContext();
  const { createChatRoomForProject, sendSystemMessage } = useChatContext();

  // 새 프로젝트 감지 및 채팅방 생성
  useEffect(() => {
    // 이미 처리된 프로젝트 ID 저장
    const processedProjects = new Set<string>();

    projects.forEach(project => {
      if (!processedProjects.has(project.id)) {
        // 새 프로젝트에 대한 채팅방 생성
        const chatRoom = createChatRoomForProject(project);
        processedProjects.add(project.id);

        // 프로젝트 단계 변경 시 시스템 메시지 전송
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
          if (message && chatRoom) {
            // 단계 변경 메시지는 별도 처리
            console.log(`Phase change message for ${project.id}: ${message}`);
          }
        }
      }
    });
  }, [projects, createChatRoomForProject, sendSystemMessage]);

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