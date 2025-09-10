import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useCluster, getSectorName, getStageName } from '../../contexts/ClusterContext';
import type { SectorType, StageType } from '../../contexts/ClusterContext';
import { CheckCircle2, ArrowRight, Building2, Users, TrendingUp, Rocket, Heart } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { cluster, updateStage } = useCluster();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSector] = useState<SectorType>(cluster.sector);
  const [selectedStage, setSelectedStage] = useState<StageType>(cluster.stage);

  const sectors: { id: SectorType; name: string; icon: any; description: string }[] = [
    { id: 'S-1', name: 'B2B SaaS', icon: Building2, description: '기업용 소프트웨어 서비스' },
    { id: 'S-2', name: 'B2C 플랫폼', icon: Users, description: '소비자 대상 플랫폼 서비스' },
    { id: 'S-3', name: '이커머스', icon: TrendingUp, description: '온라인 상거래 플랫폼' },
    { id: 'S-4', name: '핀테크', icon: Rocket, description: '금융 기술 서비스' },
    { id: 'S-5', name: '헬스케어', icon: Heart, description: '의료 및 건강 관리 서비스' }
  ];

  const stages: { id: StageType; name: string; description: string }[] = [
    { id: 'A-1', name: '아이디어', description: '아이디어 검증 및 팀 구성 단계' },
    { id: 'A-2', name: '창업초기', description: 'MVP 개발 및 초기 고객 확보' },
    { id: 'A-3', name: 'PMF 검증', description: 'Product-Market Fit 검증 단계' },
    { id: 'A-4', name: 'Pre-A', description: '시리즈 A 준비 및 성장 가속화' },
    { id: 'A-5', name: 'Series A+', description: '본격적인 스케일업 단계' }
  ];

  const handleComplete = () => {
    updateStage(selectedStage, 'manual');
    navigate('/startup/assessments');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-light via-white to-white">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-dark mb-4">
            포켓비즈 온보딩
          </h1>
          <p className="text-lg text-neutral-gray">
            귀사의 정보를 입력하고 맞춤형 평가를 시작하세요
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-primary-main text-white' : 'bg-neutral-border text-neutral-gray'
            }`}>
              1
            </div>
            <div className={`w-24 h-1 ${currentStep >= 2 ? 'bg-primary-main' : 'bg-neutral-border'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-primary-main text-white' : 'bg-neutral-border text-neutral-gray'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Step 1: Sector Selection */}
        {currentStep === 1 && (
          <Card>
            <CardHeader
              title="섹터 선택"
              subtitle="귀사가 속한 산업 분야를 선택해주세요 (온보딩 후 변경 불가)"
            />
            <CardBody>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {sectors.map((sector) => {
                  const Icon = sector.icon;
                  const isSelected = selectedSector === sector.id;
                  return (
                    <div
                      key={sector.id}
                      className={`p-4 rounded-lg border-2 cursor-not-allowed opacity-60 ${
                        isSelected
                          ? 'border-primary-main bg-primary-light bg-opacity-10'
                          : 'border-neutral-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon size={24} className={isSelected ? 'text-primary-main' : 'text-neutral-gray'} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-dark">{sector.name}</h3>
                          <p className="text-sm text-neutral-gray mt-1">{sector.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={20} className="text-primary-main" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-accent-blue-light bg-opacity-10 p-4 rounded-lg mb-6">
                <p className="text-sm text-neutral-dark">
                  <strong>참고:</strong> 섹터는 {getSectorName(selectedSector)}로 이미 설정되어 있습니다.
                  변경이 필요한 경우 관리자에게 문의하세요.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep(2)}>
                  다음 단계
                  <ArrowRight size={16} />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Step 2: Stage Selection */}
        {currentStep === 2 && (
          <Card>
            <CardHeader
              title="성장 단계 선택"
              subtitle="현재 귀사의 성장 단계를 선택해주세요 (언제든 변경 가능)"
            />
            <CardBody>
              <div className="space-y-3 mb-6">
                {stages.map((stage) => {
                  const isSelected = selectedStage === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setSelectedStage(stage.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary-main bg-primary-light bg-opacity-10'
                          : 'border-neutral-border hover:border-neutral-gray'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-neutral-dark">
                            {stage.id}: {stage.name}
                          </h3>
                          <p className="text-sm text-neutral-gray mt-1">{stage.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={20} className="text-primary-main" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-secondary-light bg-opacity-10 p-4 rounded-lg mb-6">
                <p className="text-sm text-neutral-dark">
                  <strong>팁:</strong> 성장 단계는 평가 페이지에서 언제든지 변경할 수 있습니다.
                  현재 상황에 가장 가까운 단계를 선택해주세요.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setCurrentStep(1)}>
                  이전
                </Button>
                <Button onClick={handleComplete}>
                  온보딩 완료
                  <CheckCircle2 size={16} />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;