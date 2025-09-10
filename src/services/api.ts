// API 설정 및 기본 함수들
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// 토큰 관리
let authToken: string | null = localStorage.getItem('authToken');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

// 공통 fetch 함수
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API 요청 실패');
  }
  
  return response.json();
}

// API 엔드포인트들
export const api = {
  // 인증
  auth: {
    async register(data: {
      email: string;
      password: string;
      companyName: string;
      sector: string;
      stage: string;
    }) {
      return apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    async login(email: string, password: string) {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (response.token) {
        setAuthToken(response.token);
      }
      
      return response;
    },
    
    async logout() {
      setAuthToken(null);
    },
    
    async getProfile() {
      return apiFetch('/auth/profile');
    },
  },
  
  // KPI 관리
  kpi: {
    async getKPIs(sector: string, stage: string) {
      return apiFetch(`/kpis?sector=${sector}&stage=${stage}`);
    },
    
    async getKPIById(kpiId: string) {
      return apiFetch(`/kpis/${kpiId}`);
    },
  },
  
  // 평가 관리
  assessment: {
    async create() {
      return apiFetch('/assessments', {
        method: 'POST',
      });
    },
    
    async saveResponses(assessmentId: string, responses: any[]) {
      return apiFetch(`/assessments/${assessmentId}/responses`, {
        method: 'PUT',
        body: JSON.stringify({ responses }),
      });
    },
    
    async getResults(assessmentId: string) {
      return apiFetch(`/assessments/${assessmentId}/results`);
    },
    
    async getHistory(companyId?: string) {
      const query = companyId ? `?company_id=${companyId}` : '';
      return apiFetch(`/assessments/history${query}`);
    },
  },
  
  // 벤치마킹
  benchmark: {
    async getIndustryAverage(sector: string, stage: string) {
      return apiFetch(`/benchmarks/industry/${sector}/${stage}`);
    },
  },
  
  // 리포트
  report: {
    async generatePDF(assessmentId: string, options = {}) {
      return apiFetch('/reports/pdf', {
        method: 'POST',
        body: JSON.stringify({
          assessment_id: assessmentId,
          include_benchmarks: true,
          include_insights: true,
          include_action_plan: true,
          ...options,
        }),
      });
    },
  },
  
  // 관리자 API
  admin: {
    async createKPI(kpiData: any) {
      return apiFetch('/admin/kpis', {
        method: 'POST',
        body: JSON.stringify(kpiData),
      });
    },
    
    async updateKPI(kpiId: string, kpiData: any) {
      return apiFetch(`/admin/kpis/${kpiId}`, {
        method: 'PUT',
        body: JSON.stringify(kpiData),
      });
    },
    
    async deleteKPI(kpiId: string) {
      return apiFetch(`/admin/kpis/${kpiId}`, {
        method: 'DELETE',
      });
    },
    
    async getStatistics() {
      return apiFetch('/admin/statistics');
    },
  },
};