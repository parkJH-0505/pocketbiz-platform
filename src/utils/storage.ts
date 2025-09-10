import type { KPIResponse } from '../types';

const STORAGE_KEY = 'pocketbiz_assessment_draft';

export interface AssessmentDraft {
  responses: Record<string, KPIResponse>;
  lastUpdated: string;
  runId: string;
}

export const assessmentStorage = {
  // 임시 저장
  saveDraft: (responses: Record<string, KPIResponse>, runId: string = 'current') => {
    try {
      const draft: AssessmentDraft = {
        responses,
        lastUpdated: new Date().toISOString(),
        runId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    }
  },

  // 임시 저장 불러오기
  loadDraft: (): AssessmentDraft | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      
      const draft = JSON.parse(saved) as AssessmentDraft;
      
      // 24시간 이상 지난 데이터는 무시
      const lastUpdated = new Date(draft.lastUpdated);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  },

  // 임시 저장 삭제
  clearDraft: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear draft:', error);
      return false;
    }
  },

  // 진행률 계산
  calculateProgress: (responses: Record<string, KPIResponse>, totalKPIs: number) => {
    const validResponses = Object.values(responses).filter(r => r.status !== 'invalid');
    const percentage = totalKPIs > 0 ? (validResponses.length / totalKPIs) * 100 : 0;
    
    return {
      completed: validResponses.length,
      total: totalKPIs,
      percentage: Math.round(percentage * 10) / 10 // 소수점 한자리까지
    };
  }
};