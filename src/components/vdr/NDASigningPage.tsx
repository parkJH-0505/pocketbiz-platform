import React, { useState, useEffect } from 'react';
import {
  FileSignature,
  Shield,
  User,
  Building,
  Mail,
  Calendar,
  Check,
  AlertCircle,
  Download,
  Clock,
  ChevronRight
} from 'lucide-react';

interface NDASigningPageProps {
  sessionId: string;
  templateId: string;
  companyName?: string;
  deadline?: Date;
  customMessage?: string;
  onSignComplete: (signature: NDASignatureData) => void;
  onCancel: () => void;
}

interface NDASignatureData {
  name: string;
  email: string;
  company: string;
  title?: string;
  signedAt: Date;
  ipAddress?: string;
  agreementText: string;
}

const NDASigningPage: React.FC<NDASigningPageProps> = ({
  sessionId,
  templateId,
  companyName = '포켓전자(주)',
  deadline,
  customMessage,
  onSignComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<'review' | 'sign' | 'complete'>('review');
  const [signerInfo, setSignerInfo] = useState({
    name: '',
    email: '',
    company: '',
    title: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureText, setSignatureText] = useState('');

  // NDA 템플릿 내용 (실제로는 templateId에 따라 동적으로 로드)
  const getNdaContent = () => {
    const templates: Record<string, { title: string; content: string }> = {
      standard: {
        title: '표준 비밀유지계약서',
        content: `
본 비밀유지계약서("본 계약")는 ${new Date().toLocaleDateString('ko-KR')} 일자로
${companyName}("공개당사자")와 아래 서명한 당사자("수령당사자") 간에 체결됩니다.

1. 비밀정보의 정의
"비밀정보"란 공개당사자가 수령당사자에게 제공하는 모든 기술, 사업, 재무 관련 정보를 의미합니다.

2. 비밀유지 의무
수령당사자는 비밀정보를 엄격히 비밀로 유지하며, 공개당사자의 사전 서면 동의 없이
제3자에게 공개하지 않을 것에 동의합니다.

3. 사용 제한
수령당사자는 비밀정보를 오직 공개당사자가 승인한 목적으로만 사용할 것에 동의합니다.

4. 반환 의무
공개당사자의 요청 시, 수령당사자는 모든 비밀정보를 즉시 반환하거나 폐기합니다.

5. 유효기간
본 계약의 효력은 서명일로부터 3년간 지속됩니다.
        `
      },
      'standard-en': {
        title: 'Standard Non-Disclosure Agreement',
        content: `
This Non-Disclosure Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString('en-US')}
between ${companyName} ("Disclosing Party") and the undersigned party ("Receiving Party").

1. Definition of Confidential Information
"Confidential Information" means all technical, business, and financial information
provided by the Disclosing Party to the Receiving Party.

2. Confidentiality Obligations
The Receiving Party agrees to maintain the Confidential Information in strict confidence
and not disclose it to any third party without the prior written consent of the Disclosing Party.

3. Use Restrictions
The Receiving Party agrees to use the Confidential Information solely for the purpose
approved by the Disclosing Party.

4. Return of Information
Upon request, the Receiving Party shall promptly return or destroy all Confidential Information.

5. Term
This Agreement shall remain in effect for three (3) years from the date of signature.
        `
      },
      mutual: {
        title: '상호 비밀유지계약서',
        content: `
본 상호 비밀유지계약서는 양 당사자 간의 상호 정보 교환에 대한 비밀유지를 규정합니다.

1. 양 당사자는 상호 간에 교환되는 모든 비밀정보를 보호할 의무가 있습니다.

2. 각 당사자는 상대방의 비밀정보를 자신의 비밀정보와 동일한 수준으로 보호합니다.

3. 본 계약은 양 당사자 모두에게 동등한 권리와 의무를 부여합니다.
        `
      }
    };

    return templates[templateId] || templates.standard;
  };

  const ndaContent = getNdaContent();

  const handleSign = async () => {
    if (!agreedToTerms || !signatureText || !signerInfo.name || !signerInfo.email || !signerInfo.company) {
      alert('모든 필수 정보를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const signatureData: NDASignatureData = {
        name: signerInfo.name,
        email: signerInfo.email,
        company: signerInfo.company,
        title: signerInfo.title,
        signedAt: new Date(),
        ipAddress: '127.0.0.1', // 실제로는 서버에서 가져옴
        agreementText: ndaContent.content
      };

      await onSignComplete(signatureData);
      setCurrentStep('complete');
    } catch (error) {
      console.error('NDA 서명 실패:', error);
      alert('서명 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 기한 확인
  const isExpired = deadline && new Date() > deadline;

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">서명 기한 만료</h2>
          <p className="text-gray-600 mb-6">
            NDA 서명 기한이 만료되었습니다. 문서 공유자에게 문의해주세요.
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSignature className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">비밀유지계약서 서명</h1>
                <p className="text-sm text-gray-500">{companyName}</p>
              </div>
            </div>
            {deadline && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>서명 기한: {new Date(deadline).toLocaleDateString('ko-KR')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 진행 단계 표시 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2">
          <div className={`flex items-center gap-2 ${currentStep === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-white'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">계약서 검토</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'sign' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'sign' ? 'bg-blue-600 text-white' :
              currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">정보 입력 및 서명</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'
            }`}>
              3
            </div>
            <span className="text-sm font-medium">완료</span>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {currentStep === 'review' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            {customMessage && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{customMessage}</p>
              </div>
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-4">{ndaContent.title}</h2>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {ndaContent.content.trim()}
              </pre>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => setCurrentStep('sign')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                다음 단계
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'sign' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">서명 정보 입력</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  이름 *
                </label>
                <input
                  type="text"
                  value={signerInfo.name}
                  onChange={(e) => setSignerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="홍길동"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  이메일 *
                </label>
                <input
                  type="email"
                  value={signerInfo.email}
                  onChange={(e) => setSignerInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-1" />
                    회사명 *
                  </label>
                  <input
                    type="text"
                    value={signerInfo.company}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="ABC 회사"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    직책 (선택)
                  </label>
                  <input
                    type="text"
                    value={signerInfo.title}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="대표이사"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileSignature className="w-4 h-4 inline mr-1" />
                  전자 서명 (이름 입력) *
                </label>
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="위 이름과 동일하게 입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                  required
                />
                {signatureText && signatureText !== signerInfo.name && (
                  <p className="text-sm text-orange-600 mt-1">
                    서명이 이름과 일치하지 않습니다
                  </p>
                )}
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
                />
                <span className="text-sm text-gray-700">
                  본인은 위 비밀유지계약서의 내용을 충분히 검토하였으며,
                  이에 동의하고 법적 구속력이 있는 서명을 제출합니다.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep('review')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                이전 단계
              </button>
              <button
                onClick={handleSign}
                disabled={!agreedToTerms || !signatureText || signatureText !== signerInfo.name || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    서명 중...
                  </>
                ) : (
                  <>
                    <FileSignature className="w-4 h-4" />
                    서명 완료
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">서명이 완료되었습니다</h2>
            <p className="text-gray-600 mb-6">
              NDA 서명이 성공적으로 완료되었습니다.<br />
              이제 공유된 문서에 접근할 수 있습니다.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>서명자:</strong> {signerInfo.name}</p>
                <p><strong>이메일:</strong> {signerInfo.email}</p>
                <p><strong>회사:</strong> {signerInfo.company}</p>
                <p><strong>서명 일시:</strong> {new Date().toLocaleString('ko-KR')}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                서명된 NDA 다운로드
              </button>
              <button
                onClick={() => window.location.href = `/vdr/session/${sessionId}`}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                문서 보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NDASigningPage;