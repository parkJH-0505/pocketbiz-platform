import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBuildupContext } from './BuildupContext';
import { useKPIDiagnosis } from './KPIDiagnosisContext';

export interface VDRDocument {
  id: string;
  name: string;
  path: string;
  size: number;
  uploadDate: Date;
  lastModified: Date;
  category: 'buildup_deliverable' | 'kpi_report' | 'vdr_upload' | 'contract' | 'ir_deck' | 'business_plan' | 'financial' | 'marketing';
  source: 'buildup' | 'kpi' | 'manual' | 'dataroom';
  projectId?: string;
  projectName?: string;
  visibility: 'private' | 'team' | 'investors' | 'public';
  isRepresentative?: boolean;
  sharedSessions?: SharedSession[];
  tags?: string[];
  description?: string;
}

export interface SharedSession {
  id: string;
  name: string;
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
  link: string;
  documentIds: string[];
  accessLog?: AccessLog[];
}

interface AccessLog {
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface RepresentativeDoc {
  type: 'ir_deck' | 'business_plan' | 'financial' | 'marketing';
  label: string;
  documentId?: string;
}

interface VDRContextType {
  documents: VDRDocument[];
  sharedSessions: SharedSession[];
  representativeDocs: RepresentativeDoc[];
  aggregateDocuments: () => Promise<void>;
  uploadDocument: (file: File, category: VDRDocument['category']) => Promise<void>;
  updateDocumentVisibility: (docId: string, visibility: VDRDocument['visibility']) => void;
  setRepresentativeDocument: (docId: string, type: RepresentativeDoc['type']) => void;
  createShareSession: (name: string, documentIds: string[], expiresAt?: Date) => Promise<string>;
  getShareSession: (sessionId: string) => SharedSession | undefined;
  deleteDocument: (docId: string) => Promise<void>;
  searchDocuments: (query: string) => VDRDocument[];
  getDocumentsByCategory: (category: VDRDocument['category']) => VDRDocument[];
  loading: boolean;
}

const VDRContext = createContext<VDRContextType | undefined>(undefined);

export const useVDRContext = () => {
  const context = useContext(VDRContext);
  if (!context) {
    throw new Error('useVDRContext must be used within VDRProvider');
  }
  return context;
};

export const VDRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<VDRDocument[]>([]);
  const [sharedSessions, setSharedSessions] = useState<SharedSession[]>([]);
  const [loading, setLoading] = useState(false);
  const { projects } = useBuildupContext();
  const { savedAssessments } = useKPIDiagnosis();

  const representativeDocs: RepresentativeDoc[] = [
    { type: 'ir_deck', label: 'IR Deck' },
    { type: 'business_plan', label: '사업계획서' },
    { type: 'financial', label: '재무제표' },
    { type: 'marketing', label: '마케팅 지표' }
  ];

  // 모든 소스에서 문서 자동 집계
  const aggregateDocuments = async () => {
    setLoading(true);
    try {
      const aggregatedDocs: VDRDocument[] = [];

      // 빌드업 프로젝트 문서
      projects?.forEach(project => {
        if (project.deliverables) {
          project.deliverables?.forEach(deliverable => {
            aggregatedDocs.push({
              id: `buildup-${project.id}-${deliverable.id}`,
              name: deliverable.name,
              path: `/companies/buildup/projects/${project.id}/${deliverable.name}`,
              size: 1048576, // Mock size
              uploadDate: new Date(deliverable.uploadDate || Date.now()),
              lastModified: new Date(deliverable.uploadDate || Date.now()),
              category: 'buildup_deliverable',
              source: 'buildup',
              projectId: project.id,
              projectName: project.title,
              visibility: 'team',
              tags: project.tags
            });
          });
        }
      });

      // KPI 진단 보고서
      savedAssessments?.forEach(assessment => {
        aggregatedDocs.push({
          id: `kpi-${assessment.id}`,
          name: `KPI_진단보고서_${new Date(assessment.completedAt || Date.now()).toLocaleDateString('ko-KR').replace(/\./g, '')}.pdf`,
          path: `/companies/kpi/reports/${assessment.id}.pdf`,
          size: 2097152, // Mock size
          uploadDate: new Date(assessment.completedAt || Date.now()),
          lastModified: new Date(assessment.completedAt || Date.now()),
          category: 'kpi_report',
          source: 'kpi',
          visibility: 'private',
          description: `KPI 진단 결과: 총점 ${assessment.overallScore || 0}점`
        });
      });

      // 기존 VDR 업로드 문서 (localStorage에서 가져오기)
      const storedDocs = localStorage.getItem('vdr_documents');
      if (storedDocs) {
        const parsedDocs = JSON.parse(storedDocs);
        aggregatedDocs.push(...parsedDocs.map((doc: any) => ({
          ...doc,
          uploadDate: new Date(doc.uploadDate),
          lastModified: new Date(doc.lastModified)
        })));
      }

      setDocuments(aggregatedDocs);
    } catch (error) {
      console.error('Failed to aggregate documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 시 문서 집계
  useEffect(() => {
    aggregateDocuments();
  }, [projects, savedAssessments]);

  // 문서 업로드
  const uploadDocument = async (file: File, category: VDRDocument['category']) => {
    const newDoc: VDRDocument = {
      id: `upload-${Date.now()}`,
      name: file.name,
      path: `/companies/vdr/uploads/${file.name}`,
      size: file.size,
      uploadDate: new Date(),
      lastModified: new Date(),
      category,
      source: 'manual',
      visibility: 'private'
    };

    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    
    // localStorage에 저장
    const manualDocs = updatedDocs.filter(d => d.source === 'manual');
    localStorage.setItem('vdr_documents', JSON.stringify(manualDocs));
  };

  // 문서 공개 범위 업데이트
  const updateDocumentVisibility = (docId: string, visibility: VDRDocument['visibility']) => {
    setDocuments(docs => 
      docs.map(doc => doc.id === docId ? { ...doc, visibility } : doc)
    );
  };

  // 대표 문서 설정
  const setRepresentativeDocument = (docId: string, type: RepresentativeDoc['type']) => {
    setDocuments(docs => 
      docs.map(doc => {
        if (doc.id === docId) {
          return { ...doc, isRepresentative: !doc.isRepresentative, category: type };
        }
        // 같은 타입의 다른 대표 문서 해제
        if (doc.category === type && doc.isRepresentative && doc.id !== docId) {
          return { ...doc, isRepresentative: false };
        }
        return doc;
      })
    );
  };

  // 공유 세션 생성
  const createShareSession = async (name: string, documentIds: string[], expiresAt?: Date): Promise<string> => {
    const sessionId = Math.random().toString(36).substr(2, 9);
    const shareLink = `https://pocketbiz.com/share/${sessionId}`;
    
    const newSession: SharedSession = {
      id: sessionId,
      name,
      createdAt: new Date(),
      expiresAt,
      accessCount: 0,
      link: shareLink,
      documentIds,
      accessLog: []
    };

    setSharedSessions(prev => [...prev, newSession]);
    
    // 공유된 문서에 세션 정보 추가
    setDocuments(docs => 
      docs.map(doc => {
        if (documentIds.includes(doc.id)) {
          const sessions = doc.sharedSessions || [];
          return {
            ...doc,
            sharedSessions: [...sessions, newSession]
          };
        }
        return doc;
      })
    );

    // 클립보드에 링크 복사
    await navigator.clipboard.writeText(shareLink);
    
    return shareLink;
  };

  // 공유 세션 조회
  const getShareSession = (sessionId: string) => {
    return sharedSessions.find(session => session.id === sessionId);
  };

  // 문서 삭제
  const deleteDocument = async (docId: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== docId));
  };

  // 문서 검색
  const searchDocuments = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(lowercaseQuery) ||
      doc.description?.toLowerCase().includes(lowercaseQuery) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  // 카테고리별 문서 조회
  const getDocumentsByCategory = (category: VDRDocument['category']) => {
    return documents.filter(doc => doc.category === category);
  };

  const value: VDRContextType = {
    documents,
    sharedSessions,
    representativeDocs,
    aggregateDocuments,
    uploadDocument,
    updateDocumentVisibility,
    setRepresentativeDocument,
    createShareSession,
    getShareSession,
    deleteDocument,
    searchDocuments,
    getDocumentsByCategory,
    loading
  };

  return (
    <VDRContext.Provider value={value}>
      {children}
    </VDRContext.Provider>
  );
};