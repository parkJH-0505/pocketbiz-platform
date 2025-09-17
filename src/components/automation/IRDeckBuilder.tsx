import React, { useState } from 'react';
import { Download, FileText, Loader, CheckCircle, Edit3, Save } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useCluster } from '../../contexts/ClusterContext';
import { generateIRDeck, type IRDeckData } from '../../utils/irDeckGenerator';

interface IRDeckBuilderProps {
  onClose?: () => void;
}

export const IRDeckBuilder: React.FC<IRDeckBuilderProps> = ({ onClose }) => {
  const { overallScore, axisScores } = useKPIDiagnosis();
  const { cluster } = useCluster();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<IRDeckData>>({
    companyName: '포켓비즈 테크',
    sector: cluster.sector,
    stage: cluster.stage,
    ceoName: '홍길동',
    teamSize: 15,
    problem: '중소기업의 90%가 데이터 기반 의사결정을 하지 못하고 있습니다. 복잡한 KPI 관리와 성장 전략 수립에 어려움을 겪고 있습니다.',
    solution: '포켓비즈는 AI 기반 자동화 플랫폼으로 KPI 진단, 성장 추천, 실행까지 원스톱으로 제공합니다. 스타트업이 데이터 기반으로 성장할 수 있도록 돕습니다.',
    businessModel: 'B2B SaaS 구독 모델. 월 구독료 + 빌드업 서비스 수수료',
    targetMarket: '국내 스타트업 3만개, 연 시장 규모 1조원',
    competitiveAdvantage: '1) 25개 클러스터별 맞춤형 평가 시스템\n2) 실시간 업계 인텔리전스\n3) 검증된 빌드업 파트너 네트워크',
    monthlyRevenue: 50000000,
    mau: 1500,
    growthRate: 30,
    currentFunding: 500000000,
    runway: 18,
    targetFunding: 3000000000,
    useOfFunds: [
      '개발팀 확충 (40%)',
      '마케팅 및 영업 (30%)',
      '인프라 확장 (20%)',
      '운영자금 (10%)'
    ],
    keyMembers: [
      { name: '김개발', position: 'CTO', experience: '네이버 10년, 카카오 5년' },
      { name: '이영업', position: 'CSO', experience: '삼성전자 8년, 스타트업 3년' },
      { name: '박마케팅', position: 'CMO', experience: '구글코리아 7년' }
    ],
    milestones: [
      { title: 'MVP 출시', date: '2023.06', status: 'completed' as const },
      { title: '1000 고객 달성', date: '2023.12', status: 'completed' as const },
      { title: 'Series A 유치', date: '2024.06', status: 'in-progress' as const },
      { title: '흑자 전환', date: '2024.12', status: 'planned' as const },
      { title: '글로벌 진출', date: '2025.06', status: 'planned' as const }
    ]
  });

  const handleInputChange = (field: keyof IRDeckData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // PDF 생성
      const blob = await generateIRDeck(formData, {
        overallScore,
        axisScores
      });

      // Blob URL 생성
      const url = URL.createObjectURL(blob);
      setGeneratedUrl(url);

      // 자동 다운로드
      const a = document.createElement('a');
      a.href = url;
      a.download = `IR_Deck_${formData.companyName}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
    } catch (error) {
      console.error('IR덱 생성 실패:', error);
      alert('IR덱 생성에 실패했습니다.');
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
                <h2 className="text-xl font-bold text-neutral-dark">IR덱 자동 생성</h2>
                <p className="text-sm text-neutral-gray">KPI 데이터 기반 투자 제안서 생성</p>
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
            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사명
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    대표자명
                  </label>
                  <input
                    type="text"
                    value={formData.ceoName}
                    onChange={(e) => handleInputChange('ceoName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* 비즈니스 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">비즈니스 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    문제 정의
                  </label>
                  <textarea
                    value={formData.problem}
                    onChange={(e) => handleInputChange('problem', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 resize-none"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    솔루션
                  </label>
                  <textarea
                    value={formData.solution}
                    onChange={(e) => handleInputChange('solution', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 resize-none"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* KPI 데이터 (자동 입력) */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">
                KPI 데이터 (자동 입력)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">종합 점수</p>
                  <p className="text-xl font-bold text-primary-main">{overallScore.toFixed(1)}점</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">섹터</p>
                  <p className="text-xl font-bold text-neutral-dark">{cluster.sector}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">단계</p>
                  <p className="text-xl font-bold text-neutral-dark">{cluster.stage}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                {Object.entries(axisScores).map(([axis, score]) => (
                  <div key={axis} className="flex-1">
                    <p className="text-xs text-gray-600">{axis}</p>
                    <p className="text-sm font-semibold">{score.toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 투자 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">투자 정보</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    목표 투자금 (원)
                  </label>
                  <input
                    type="number"
                    value={formData.targetFunding}
                    onChange={(e) => handleInputChange('targetFunding', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    현재 런웨이 (개월)
                  </label>
                  <input
                    type="number"
                    value={formData.runway}
                    onChange={(e) => handleInputChange('runway', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    월 매출 (원)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyRevenue}
                    onChange={(e) => handleInputChange('monthlyRevenue', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!isEditing}
                  />
                </div>
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
            <div className="flex gap-3">
              {!isEditing ? (
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  수정하기
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  저장
                </Button>
              )}
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
                    IR덱 생성
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};