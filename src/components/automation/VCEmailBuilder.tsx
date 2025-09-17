import React, { useState, useEffect } from 'react';
import { Mail, Send, Download, Copy, Filter, Plus, X, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useCluster } from '../../contexts/ClusterContext';
import {
  generateVCEmail,
  generateBulkEmails,
  saveEmailAsText,
  vcDatabase,
  type VCInfo,
  type CompanyData,
  type EmailTone,
  type EmailLength
} from '../../utils/vcEmailGenerator';

interface VCEmailBuilderProps {
  onClose?: () => void;
}

export const VCEmailBuilder: React.FC<VCEmailBuilderProps> = ({ onClose }) => {
  const { overallScore, axisScores } = useKPIDiagnosis();
  const { cluster } = useCluster();

  // 회사 정보 상태
  const [companyData, setCompanyData] = useState<CompanyData>({
    companyName: '포켓비즈 테크',
    ceoName: '홍길동',
    sector: 'B2B SaaS',
    description: '스타트업의 성장을 돕는 All-in-One 데이터 기반 관리 플랫폼',
    traction: '3만개 스타트업 고객 확보, MRR $50K 달성',
    revenue: '$600K',
    growth: '300%',
    teamSize: 15,
    uniqueValue: '우리는 스타트업 성장의 모든 단계를 자동화하고 데이터 기반 의사결정을 가능하게 합니다.',
    askAmount: '$3M',
    website: 'www.pocketbiz.co.kr',
    linkedin: 'linkedin.com/company/pocketbiz'
  });

  // 이메일 설정
  const [emailTone, setEmailTone] = useState<EmailTone>('casual');
  const [emailLength, setEmailLength] = useState<EmailLength>('medium');
  
  // VC 선택
  const [selectedVCs, setSelectedVCs] = useState<VCInfo[]>([]);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  
  // 생성된 이메일
  const [generatedEmails, setGeneratedEmails] = useState<Map<string, any>>(new Map());
  const [currentVC, setCurrentVC] = useState<VCInfo | null>(null);
  const [previewEmail, setPreviewEmail] = useState<any>(null);

  // 필터링된 VC 리스트
  const filteredVCs = vcDatabase.filter(vc => {
    if (filterStage !== 'all' && vc.investmentStage !== filterStage) return false;
    if (filterArea !== 'all' && !vc.focusAreas.includes(filterArea)) return false;
    return true;
  });

  // 모든 포커스 영역 추출
  const allFocusAreas = Array.from(
    new Set(vcDatabase.flatMap(vc => vc.focusAreas))
  );

  // VC 선택/해제
  const toggleVC = (vc: VCInfo) => {
    setSelectedVCs(prev => {
      const isSelected = prev.some(v => v.email === vc.email);
      if (isSelected) {
        return prev.filter(v => v.email !== vc.email);
      } else {
        return [...prev, vc];
      }
    });
  };

  // 선택된 VC가 있을 때 첫 번째 VC의 이메일 미리보기
  useEffect(() => {
    if (selectedVCs.length > 0 && !currentVC) {
      setCurrentVC(selectedVCs[0]);
      const template = generateVCEmail(
        companyData,
        selectedVCs[0],
        { overallScore, axisScores },
        emailTone,
        emailLength
      );
      setPreviewEmail(template);
    }
  }, [selectedVCs, currentVC, companyData, overallScore, axisScores, emailTone, emailLength]);

  // 이메일 생성
  const handleGenerateEmails = () => {
    const emails = generateBulkEmails(
      companyData,
      selectedVCs,
      { overallScore, axisScores },
      emailTone,
      emailLength
    );
    setGeneratedEmails(emails);
    
    // 첫 번째 이메일 미리보기
    if (selectedVCs.length > 0) {
      setCurrentVC(selectedVCs[0]);
      setPreviewEmail(emails.get(selectedVCs[0].email));
    }
  };

  // 이메일 복사
  const copyEmail = () => {
    if (previewEmail) {
      const content = `Subject: ${previewEmail.subject}\n\n${previewEmail.body}`;
      navigator.clipboard.writeText(content);
      alert('이메일이 클립보드에 복사되었습니다.');
    }
  };

  // 이메일 다운로드
  const downloadEmail = () => {
    if (previewEmail && currentVC) {
      const blob = saveEmailAsText(previewEmail, currentVC.name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VC_Email_${currentVC.firm.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // 모든 이메일 다운로드
  const downloadAllEmails = () => {
    generatedEmails.forEach((template, email) => {
      const vc = selectedVCs.find(v => v.email === email);
      if (vc) {
        const blob = saveEmailAsText(template, vc.name);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VC_Email_${vc.firm.replace(/\s+/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary-main" />
              <div>
                <h2 className="text-xl font-bold text-neutral-dark">VC 콜드메일 생성기</h2>
                <p className="text-sm text-neutral-gray">개인화된 투자 제안 이메일 자동 생성</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </CardHeader>

        <CardBody className="flex-1 overflow-hidden">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* 왼쪽: VC 선택 및 설정 */}
            <div className="col-span-4 space-y-4 overflow-y-auto pr-2">
              {/* 회사 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-dark mb-3">회사 정보</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="회사명"
                    value={companyData.companyName}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="대표자명"
                    value={companyData.ceoName}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, ceoName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="ARR"
                      value={companyData.revenue}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, revenue: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="성장률"
                      value={companyData.growth}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, growth: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="투자 요청 금액"
                    value={companyData.askAmount}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, askAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* 이메일 설정 */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-dark mb-3">이메일 스타일</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600">톤</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(['formal', 'casual', 'enthusiastic'] as EmailTone[]).map(tone => (
                        <button
                          key={tone}
                          onClick={() => setEmailTone(tone)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            emailTone === tone
                              ? 'bg-primary-main text-white border-primary-main'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-main'
                          }`}
                        >
                          {tone === 'formal' ? '공식적' : tone === 'casual' ? '캐주얼' : '열정적'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">길이</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(['short', 'medium', 'long'] as EmailLength[]).map(length => (
                        <button
                          key={length}
                          onClick={() => setEmailLength(length)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            emailLength === length
                              ? 'bg-primary-main text-white border-primary-main'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-main'
                          }`}
                        >
                          {length === 'short' ? '짧게' : length === 'medium' ? '보통' : '길게'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* VC 필터 */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-dark mb-3">VC 필터</h3>
                <div className="space-y-2">
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">모든 투자 단계</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B">Series B</option>
                  </select>
                  <select
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">모든 포커스 영역</option>
                    {allFocusAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* VC 리스트 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-dark">
                    VC 선택 ({selectedVCs.length}개)
                  </h3>
                  <button
                    onClick={() => setSelectedVCs(filteredVCs)}
                    className="text-xs text-primary-main hover:underline"
                  >
                    전체 선택
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredVCs.map(vc => {
                    const isSelected = selectedVCs.some(v => v.email === vc.email);
                    return (
                      <div
                        key={vc.email}
                        onClick={() => toggleVC(vc)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-main bg-primary-light'
                            : 'border-gray-300 hover:border-primary-main'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm text-neutral-dark">{vc.name}</p>
                            <p className="text-xs text-gray-600">{vc.firm}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {vc.investmentStage} · {vc.ticketSize}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-primary-main rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 오른쪽: 이메일 미리보기 */}
            <div className="col-span-8 flex flex-col h-full">
              {selectedVCs.length > 0 ? (
                <>
                  {/* VC 탭 */}
                  {generatedEmails.size > 0 && (
                    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                      {selectedVCs.map(vc => (
                        <button
                          key={vc.email}
                          onClick={() => {
                            setCurrentVC(vc);
                            setPreviewEmail(generatedEmails.get(vc.email));
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                            currentVC?.email === vc.email
                              ? 'bg-primary-main text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {vc.name} ({vc.firm})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 이메일 내용 */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 overflow-y-auto">
                    {previewEmail ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Subject</p>
                          <p className="font-semibold text-neutral-dark">{previewEmail.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">To</p>
                          <p className="text-sm text-gray-700">
                            {currentVC?.name} &lt;{currentVC?.email}&gt;
                          </p>
                        </div>
                        <div className="border-t pt-4">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                            {previewEmail.body}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <p>이메일을 생성하려면 아래 '이메일 생성' 버튼을 클릭하세요</p>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      {generatedEmails.size > 0 && (
                        <>
                          <button
                            onClick={copyEmail}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            복사
                          </button>
                          <button
                            onClick={downloadEmail}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            다운로드
                          </button>
                          <button
                            onClick={downloadAllEmails}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            전체 다운로드 ({selectedVCs.length}개)
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={handleGenerateEmails}
                      className="px-6 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      이메일 생성 ({selectedVCs.length}개)
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">왼쪽에서 VC를 선택해주세요</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};