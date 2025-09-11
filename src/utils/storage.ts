import type { KPIResponse, ClusterInfo } from '../types';

const STORAGE_KEY = 'pocketbiz_assessment_draft';
const RUN_KEY = 'pocketbiz_current_run';
const RUNS_KEY = 'pocketbiz_assessment_runs';

export interface AssessmentDraft {
  responses: Record<string, KPIResponse>;
  lastUpdated: string;
  runId: string;
}

export interface AssessmentRun {
  runId: string;
  cluster: ClusterInfo;
  responses: Record<string, KPIResponse>;
  createdAt: string;
  updatedAt: string;
}

export const assessmentStorage = {
  // Run 관리
  getCurrentRunId: (): string | null => {
    try {
      return localStorage.getItem(RUN_KEY);
    } catch (error) {
      console.error('Failed to get current run ID:', error);
      return null;
    }
  },

  createRun: (cluster: ClusterInfo): string => {
    try {
      const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(RUN_KEY, runId);
      
      const run: AssessmentRun = {
        runId,
        cluster,
        responses: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const runs = JSON.parse(localStorage.getItem(RUNS_KEY) || '{}');
      runs[runId] = run;
      localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
      
      return runId;
    } catch (error) {
      console.error('Failed to create run:', error);
      return `run_${Date.now()}`;
    }
  },

  getResponses: (runId: string): Record<string, KPIResponse> | null => {
    try {
      const runs = JSON.parse(localStorage.getItem(RUNS_KEY) || '{}');
      return runs[runId]?.responses || null;
    } catch (error) {
      console.error('Failed to get responses:', error);
      return null;
    }
  },

  saveResponses: (runId: string, responses: Record<string, KPIResponse>) => {
    try {
      const runs = JSON.parse(localStorage.getItem(RUNS_KEY) || '{}');
      if (runs[runId]) {
        runs[runId].responses = responses;
        runs[runId].updatedAt = new Date().toISOString();
        localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
      }
      return true;
    } catch (error) {
      console.error('Failed to save responses:', error);
      return false;
    }
  },
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