import React, { useState } from 'react';
import { Download, FileText, Loader, CheckCircle, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useCluster } from '../../contexts/ClusterContext';
import {
  generateGovernmentDoc,
  type CompanyInfo,
  type ApplicationData,
  type GovernmentProgramType
} from '../../utils/governmentDocGenerator';

interface GovernmentDocBuilderProps {
  onClose?: () => void;
  programType?: GovernmentProgramType;
}

export const GovernmentDocBuilder: React.FC<GovernmentDocBuilderProps> = ({
  onClose,
  programType: initialType = 'TIPS'
}) => {
  const { overallScore, axisScores } = useKPIDiagnosis();
  const { cluster } = useCluster();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<GovernmentProgramType>(initialType);

  // 회사 정보
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '포켓비즈 테크',
    registrationNumber: '123-45-67890',
    corporateNumber: '110111-1234567',
    foundedDate: '2023-01-15',
    ceoName: '홍길동',
    address: '서울특별시 강남구 테헤란로 123',
    phone: '02-1234-5678',
    email: 'contact@pocketbiz.co.kr',
    website: 'www.pocketbiz.co.kr',
    businessType: 'IT 서비스업',
    mainProduct: 'SaaS 플랫폼',
    businessDescription: '스타트업의 성장을 돕는 All-in-One 데이터 기반 관리 플랫폼을 제공합니다.',
    targetMarket: '국내 스타트업 3만개 및 중소기업',
    capital: 100000000,
    lastYearRevenue: 500000000,
    currentRevenue: 800000000,
    employees: 15,
    rdStaff: 8,
    patents: 2,
    certifications: ['벤처기업 인증', 'ISO 9001', '기술혁신형 중소기업'],
    techLevel: '세계 최고 수준 대비 85%'
  });

  // 신청 정보
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    programType: selectedProgram,
    programName: getProgramName(selectedProgram),
    applicationDate: new Date(),
    projectTitle: 'AI 기반 스타트업 성장 예측 및 자동화 시스템 개발',
    projectSummary: '머신러닝을 활용하여 스타트업의 성장 궤적을 예측하고, 맞춤형 성장 전략을 자동으로 생성하는 시스템을 개발합니다.',
    projectPeriod: '2024.04 ~ 2026.03 (24개월)',
    requestedAmount: 1000000000,
    totalBudget: 1500000000,
    expectedOutcome: 'AI 기반 성장 예측 정확도 90% 달성, 자동화율 80% 향상',
    employmentPlan: 20,
    salesTarget: 5000000000,
    overallScore,
    axisScores
  });

  function getProgramName(type: GovernmentProgramType): string {
    const names: Record<GovernmentProgramType, string> = {
      'TIPS': 'TIPS 프로그램',
      'R&D': '정부 R&D 과제',
      'VOUCHER': '바우처 지원사업',
      'GLOBAL': '글로벌 진출 지원',
      'FUNDING': '정책자금 지원'
    };
    return names[type];
  }

  const programTemplates: Record<GovernmentProgramType, {
    title: string;
    description: string;
    requiredDocs: string[];
  }> = {
    'TIPS': {
      title: 'TIPS 프로그램',
      description: '기술력을 보유한 창업팀의 글로벌 시장 진출 지원',
      requiredDocs: ['기술사업계획서', '추천기관 추천서', '지식재산권 현황']
    },
    'R&D': {
      title: '정부 R&D 과제',
      description: '핵심 기술 개발을 위한 연구개발 지원',
      requiredDocs: ['연구개발계획서', '연구팀 이력서', '기술성 평가 자료']
    },
    'VOUCHER': {
      title: '바우처 지원사업',
      description: '컨설팅, 마케팅, 디자인 등 경영 지원',
      requiredDocs: ['바우처 사용 계획서', '견적서']
    },
    'GLOBAL': {
      title: '글로벌 진출 지원',
      description: '해외 시장 진출을 위한 마케팅 및 현지화 지원',
      requiredDocs: ['해외 진출 계획서', '타겟 시장 분석']
    },
    'FUNDING': {
      title: '정책자금 지원',
      description: '시설자금, 운전자금 등 정책 금융 지원',
      requiredDocs: ['사업계획서', '자금 사용 계획서', '담보 현황']
    }
  };

  const handleInputChange = (field: keyof CompanyInfo | keyof ApplicationData, value: any) => {
    if (field in companyInfo) {
      setCompanyInfo(prev => ({ ...prev, [field]: value }));
    } else {
      setApplicationData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleProgramChange = (program: GovernmentProgramType) => {
    setSelectedProgram(program);
    setApplicationData(prev => ({
      ...prev,
      programType: program,
      programName: getProgramName(program)
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateGovernmentDoc(companyInfo, {
        ...applicationData,
        programType: selectedProgram
      });

      const url = URL.createObjectURL(blob);
      setGeneratedUrl(url);

      // 자동 다운로드
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getProgramName(selectedProgram)}_신청서_${companyInfo.companyName}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
    } catch (error) {
      console.error('정부지원 서류 생성 실패:', error);
      alert('서류 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary-main" />
              <div>
                <h2 className="text-xl font-bold text-neutral-dark">정부지원 서류 자동 생성</h2>
                <p className="text-sm text-neutral-gray">회사 정보 기반 신청서 자동 작성</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </CardHeader>

        <CardBody className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* 프로그램 선택 */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">프로그램 선택</h3>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(programTemplates) as GovernmentProgramType[]).map(program => (
                  <button
                    key={program}
                    onClick={() => handleProgramChange(program)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      selectedProgram === program
                        ? 'border-primary-main bg-primary-light'
                        : 'border-gray-300 hover:border-primary-main'
                    }`}
                  >
                    <h4 className="font-semibold text-neutral-dark">
                      {programTemplates[program].title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {programTemplates[program].description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 회사 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">회사 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사명
                  </label>
                  <input
                    type="text"
                    value={companyInfo.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    대표자명
                  </label>
                  <input
                    type="text"
                    value={companyInfo.ceoName}
                    onChange={(e) => handleInputChange('ceoName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자등록번호
                  </label>
                  <input
                    type="text"
                    value={companyInfo.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    직원 수
                  </label>
                  <input
                    type="number"
                    value={companyInfo.employees}
                    onChange={(e) => handleInputChange('employees', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* 사업 계획 */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">사업 계획</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업명
                  </label>
                  <input
                    type="text"
                    value={applicationData.projectTitle}
                    onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업 개요
                  </label>
                  <textarea
                    value={applicationData.projectSummary}
                    onChange={(e) => handleInputChange('projectSummary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      신청 금액 (원)
                    </label>
                    <input
                      type="number"
                      value={applicationData.requestedAmount}
                      onChange={(e) => handleInputChange('requestedAmount', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      총 사업비 (원)
                    </label>
                    <input
                      type="number"
                      value={applicationData.totalBudget}
                      onChange={(e) => handleInputChange('totalBudget', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 필요 서류 안내 */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-neutral-dark mb-2">
                {programTemplates[selectedProgram].title} 필요 서류
              </h4>
              <ul className="space-y-1">
                {programTemplates[selectedProgram].requiredDocs.map((doc, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>

            {/* KPI 점수 (자동 입력) */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-neutral-dark mb-2">
                KPI 평가 점수 (자동 입력)
              </h4>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">종합 점수</p>
                  <p className="text-xl font-bold text-primary-main">{overallScore.toFixed(1)}점</p>
                </div>
                {Object.entries(axisScores).map(([axis, score]) => (
                  <div key={axis}>
                    <p className="text-xs text-gray-600">{axis}</p>
                    <p className="text-sm font-semibold">{score.toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardBody>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {generatedUrl && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">생성 완료!</span>
                </div>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  생성중...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  서류 생성
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};