import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { KPIDefinition, KPIResponse, RawValue, AxisKey } from '../types';

interface UseAssessmentReturn {
  // 상태
  assessmentId: string | null;
  kpis: KPIDefinition[];
  responses: Record<string, KPIResponse>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // 액션
  startAssessment: () => Promise<void>;
  saveResponse: (kpiId: string, value: RawValue, status: 'valid' | 'invalid' | 'na') => void;
  submitAssessment: () => Promise<void>;
  loadDraft: () => void;
  saveDraft: () => void;
}

export function useAssessment(sector: string, stage: string): UseAssessmentReturn {
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIDefinition[]>([]);
  const [responses, setResponses] = useState<Record<string, KPIResponse>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // KPI 로드
  useEffect(() => {
    loadKPIs();
  }, [sector, stage]);
  
  // 자동 저장
  useEffect(() => {
    const interval = setInterval(() => {
      if (assessmentId && Object.keys(responses).length > 0) {
        saveDraft();
      }
    }, 30000); // 30초마다
    
    return () => clearInterval(interval);
  }, [assessmentId, responses]);
  
  const loadKPIs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { kpis } = await api.kpi.getKPIs(sector, stage);
      setKpis(kpis);
      
      // 로컬 스토리지에서 임시 저장 데이터 확인
      const draft = loadDraftFromStorage();
      if (draft) {
        setResponses(draft.responses);
        setAssessmentId(draft.assessmentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startAssessment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { assessment_id } = await api.assessment.create();
      setAssessmentId(assessment_id);
      
      // 로컬 스토리지에 저장
      saveDraftToStorage(assessment_id, {});
    } catch (err) {
      setError(err instanceof Error ? err.message : '평가를 시작할 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveResponse = (kpiId: string, value: RawValue, status: 'valid' | 'invalid' | 'na') => {
    const response: KPIResponse = {
      run_id: assessmentId || 'draft',
      kpi_id: kpiId,
      raw: value,
      status,
    };
    
    setResponses(prev => ({
      ...prev,
      [kpiId]: response,
    }));
  };
  
  const submitAssessment = async () => {
    if (!assessmentId) {
      throw new Error('평가 ID가 없습니다');
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      // 응답 데이터 정리
      const responsesToSubmit = Object.values(responses).filter(
        response => response.status !== 'na'
      );
      
      await api.assessment.saveResponses(assessmentId, responsesToSubmit);
      
      // 성공하면 로컬 스토리지 클리어
      clearDraftFromStorage();
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출 중 오류가 발생했습니다');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };
  
  const loadDraft = () => {
    const draft = loadDraftFromStorage();
    if (draft) {
      setAssessmentId(draft.assessmentId);
      setResponses(draft.responses);
    }
  };
  
  const saveDraft = async () => {
    if (!assessmentId) return;
    
    try {
      setIsSaving(true);
      
      // 백엔드에 임시 저장
      await api.assessment.saveResponses(assessmentId, Object.values(responses));
      
      // 로컬 스토리지에도 저장
      saveDraftToStorage(assessmentId, responses);
    } catch (err) {
      console.error('Draft save error:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    assessmentId,
    kpis,
    responses,
    isLoading,
    isSaving,
    error,
    startAssessment,
    saveResponse,
    submitAssessment,
    loadDraft,
    saveDraft,
  };
}

// 로컬 스토리지 헬퍼 함수들
const DRAFT_STORAGE_KEY = 'assessment_draft';

interface DraftData {
  assessmentId: string;
  responses: Record<string, KPIResponse>;
  savedAt: string;
}

function loadDraftFromStorage(): DraftData | null {
  try {
    const data = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load draft:', err);
  }
  return null;
}

function saveDraftToStorage(assessmentId: string, responses: Record<string, KPIResponse>) {
  try {
    const data: DraftData = {
      assessmentId,
      responses,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save draft:', err);
  }
}

function clearDraftFromStorage() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear draft:', err);
  }
}