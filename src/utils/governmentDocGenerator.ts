import { jsPDF } from 'jspdf';
import type { AxisKey } from '../types';

// 정부지원 프로그램 타입
export type GovernmentProgramType = 'TIPS' | 'R&D' | 'VOUCHER' | 'GLOBAL' | 'FUNDING';

export interface CompanyInfo {
  // 기본 정보
  companyName: string;
  registrationNumber?: string; // 사업자등록번호
  corporateNumber?: string; // 법인등록번호
  foundedDate: string;
  ceoName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;

  // 사업 정보
  businessType: string; // 업종
  mainProduct: string;
  businessDescription: string;
  targetMarket: string;

  // 재무 정보
  capital?: number; // 자본금
  lastYearRevenue?: number; // 전년도 매출
  currentRevenue?: number; // 당해 매출
  employees: number;
  rdStaff?: number; // R&D 인력

  // 기술 정보
  patents?: number; // 특허 수
  certifications?: string[]; // 인증 현황
  techLevel?: string; // 기술 수준
}

export interface ApplicationData {
  programType: GovernmentProgramType;
  programName: string;
  applicationDate: Date;

  // 신청 내용
  projectTitle: string;
  projectSummary: string;
  projectPeriod: string;
  requestedAmount: number;
  totalBudget: number;

  // 기대효과
  expectedOutcome: string;
  employmentPlan?: number;
  salesTarget?: number;

  // KPI 데이터
  overallScore: number;
  axisScores: Record<AxisKey, number>;
}

export class GovernmentDocGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 30;

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  async generate(
    companyInfo: CompanyInfo,
    applicationData: ApplicationData
  ): Promise<Blob> {
    // 프로그램별 템플릿 선택
    switch (applicationData.programType) {
      case 'TIPS':
        this.generateTIPSApplication(companyInfo, applicationData);
        break;
      case 'R&D':
        this.generateRnDApplication(companyInfo, applicationData);
        break;
      case 'VOUCHER':
        this.generateVoucherApplication(companyInfo, applicationData);
        break;
      default:
        this.generateGeneralApplication(companyInfo, applicationData);
    }

    return this.pdf.output('blob');
  }

  private generateTIPSApplication(
    company: CompanyInfo,
    application: ApplicationData
  ) {
    // TIPS 신청서 표지
    this.createCoverPage('TIPS 프로그램 신청서', application.programName);

    // 1. 기업 개요
    this.addPage();
    this.createSection('1. 기업 개요');
    this.addCompanyOverview(company);

    // 2. 사업 계획
    this.addPage();
    this.createSection('2. 사업 계획');
    this.addBusinessPlan(application);

    // 3. 기술 개발 계획
    this.addPage();
    this.createSection('3. 기술 개발 계획');
    this.addTechDevelopmentPlan(company, application);

    // 4. 시장 분석
    this.addPage();
    this.createSection('4. 시장 분석');
    this.addMarketAnalysis(company);

    // 5. 재무 계획
    this.addPage();
    this.createSection('5. 재무 계획');
    this.addFinancialPlan(company, application);

    // 6. KPI 평가
    this.addPage();
    this.createSection('6. 기업 역량 평가');
    this.addKPIAssessment(application);

    // 7. 첨부 서류 목록
    this.addPage();
    this.createSection('7. 첨부 서류 목록');
    this.addAttachmentList('TIPS');
  }

  private generateRnDApplication(
    company: CompanyInfo,
    application: ApplicationData
  ) {
    // R&D 과제 신청서
    this.createCoverPage('정부 R&D 과제 신청서', application.programName);

    // 1. 과제 개요
    this.addPage();
    this.createSection('1. 과제 개요');
    this.addProjectOverview(application);

    // 2. 연구개발 계획
    this.addPage();
    this.createSection('2. 연구개발 계획');
    this.addRnDPlan(company, application);

    // 3. 연구팀 구성
    this.addPage();
    this.createSection('3. 연구팀 구성');
    this.addResearchTeam(company);

    // 4. 예산 계획
    this.addPage();
    this.createSection('4. 예산 계획');
    this.addBudgetPlan(application);

    // 5. 기대 효과
    this.addPage();
    this.createSection('5. 기대 효과');
    this.addExpectedResults(application);

    // 6. 첨부 서류
    this.addAttachmentList('R&D');
  }

  private generateVoucherApplication(
    company: CompanyInfo,
    application: ApplicationData
  ) {
    // 바우처 신청서 (간소화)
    this.createCoverPage('바우처 사업 신청서', application.programName);

    // 1. 신청 기업 정보
    this.addPage();
    this.createSection('1. 신청 기업 정보');
    this.addCompanyBasicInfo(company);

    // 2. 바우처 활용 계획
    this.addPage();
    this.createSection('2. 바우처 활용 계획');
    this.addVoucherPlan(application);

    // 3. 기대 효과
    this.addPage();
    this.createSection('3. 기대 효과');
    this.addSimpleExpectedResults(application);

    // 4. 첨부 서류
    this.addAttachmentList('VOUCHER');
  }

  private generateGeneralApplication(
    company: CompanyInfo,
    application: ApplicationData
  ) {
    // 일반 신청서
    this.createCoverPage('정부지원사업 신청서', application.programName);

    this.addPage();
    this.createSection('1. 신청 기업 정보');
    this.addCompanyBasicInfo(company);

    this.addPage();
    this.createSection('2. 사업 계획');
    this.addBusinessPlan(application);

    this.addPage();
    this.createSection('3. 예산 계획');
    this.addBudgetPlan(application);

    this.addPage();
    this.createSection('4. 기대 효과');
    this.addExpectedResults(application);
  }

  // 섹션별 내용 작성 메서드들
  private createCoverPage(title: string, programName: string) {
    // 로고 위치 (실제로는 이미지 삽입)
    this.pdf.setFillColor(15, 82, 222);
    this.pdf.rect(this.pageWidth / 2 - 20, 40, 40, 10, 'F');

    this.currentY = 80;
    this.pdf.setFontSize(24);
    this.pdf.setTextColor(24, 24, 27);
    this.centerText(title, this.currentY);

    this.currentY += 15;
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(100, 100, 100);
    this.centerText(programName, this.currentY);

    this.currentY = this.pageHeight - 60;
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(24, 24, 27);
    this.centerText('제출일: ' + new Date().toLocaleDateString('ko-KR'), this.currentY);

    this.currentY += 10;
    this.centerText('작성일: ' + new Date().toLocaleDateString('ko-KR'), this.currentY);
  }

  private addCompanyOverview(company: CompanyInfo) {
    const info = [
      ['회사명', company.companyName],
      ['대표자', company.ceoName],
      ['설립일', company.foundedDate],
      ['사업자등록번호', company.registrationNumber || ''],
      ['주소', company.address],
      ['연락처', company.phone],
      ['이메일', company.email],
      ['홈페이지', company.website || ''],
      ['주요 사업', company.mainProduct],
      ['직원 수', `${company.employees}명`],
      ['자본금', company.capital ? `${(company.capital / 100000000).toFixed(1)}억원` : ''],
      ['전년도 매출', company.lastYearRevenue ? `${(company.lastYearRevenue / 100000000).toFixed(1)}억원` : '']
    ];

    this.addTable(info);

    // 사업 개요
    this.currentY += 10;
    this.addSubSection('사업 개요');
    this.addParagraph(company.businessDescription);
  }

  private addCompanyBasicInfo(company: CompanyInfo) {
    const info = [
      ['회사명', company.companyName],
      ['대표자', company.ceoName],
      ['사업자등록번호', company.registrationNumber || ''],
      ['연락처', `${company.phone} / ${company.email}`],
      ['주소', company.address],
      ['직원 수', `${company.employees}명`]
    ];

    this.addTable(info);
  }

  private addBusinessPlan(application: ApplicationData) {
    this.addSubSection('사업명');
    this.addParagraph(application.projectTitle);

    this.addSubSection('사업 개요');
    this.addParagraph(application.projectSummary);

    this.addSubSection('사업 기간');
    this.addParagraph(application.projectPeriod);

    this.addSubSection('신청 금액');
    this.addParagraph(`${(application.requestedAmount / 100000000).toFixed(1)}억원 (총 사업비: ${(application.totalBudget / 100000000).toFixed(1)}억원)`);
  }

  private addTechDevelopmentPlan(company: CompanyInfo, application: ApplicationData) {
    this.addSubSection('기술 개발 목표');
    this.addParagraph(application.projectSummary);

    if (company.patents) {
      this.addSubSection('보유 특허');
      this.addParagraph(`${company.patents}건`);
    }

    if (company.certifications && company.certifications.length > 0) {
      this.addSubSection('인증 현황');
      this.addBulletList(company.certifications);
    }

    if (company.rdStaff) {
      this.addSubSection('R&D 인력');
      this.addParagraph(`${company.rdStaff}명`);
    }
  }

  private addMarketAnalysis(company: CompanyInfo) {
    this.addSubSection('목표 시장');
    this.addParagraph(company.targetMarket);

    this.addSubSection('시장 규모');
    this.addParagraph('국내 시장: 약 1,000억원 (2024년 기준)');
    this.addParagraph('글로벌 시장: 약 10조원 (2024년 기준)');

    this.addSubSection('경쟁 우위');
    this.addBulletList([
      '독자적인 기술력 보유',
      '가격 경쟁력 확보',
      '빠른 시장 진입',
      '강력한 파트너십 네트워크'
    ]);
  }

  private addFinancialPlan(company: CompanyInfo, application: ApplicationData) {
    const financialData = [
      ['구분', '1차년도', '2차년도', '3차년도'],
      ['매출 목표', '10억원', '30억원', '100억원'],
      ['영업이익', '-2억원', '3억원', '15억원'],
      ['고용 계획', '10명', '20명', '50명'],
      ['R&D 투자', '3억원', '5억원', '10억원']
    ];

    this.addTableWithHeaders(financialData);

    this.addSubSection('자금 조달 계획');
    this.addParagraph(`정부 지원금: ${(application.requestedAmount / 100000000).toFixed(1)}억원`);
    this.addParagraph(`자체 부담금: ${((application.totalBudget - application.requestedAmount) / 100000000).toFixed(1)}억원`);
  }

  private addProjectOverview(application: ApplicationData) {
    const overview = [
      ['과제명', application.projectTitle],
      ['연구기간', application.projectPeriod],
      ['총 연구비', `${(application.totalBudget / 100000000).toFixed(1)}억원`],
      ['정부출연금', `${(application.requestedAmount / 100000000).toFixed(1)}억원`],
      ['민간부담금', `${((application.totalBudget - application.requestedAmount) / 100000000).toFixed(1)}억원`]
    ];

    this.addTable(overview);
  }

  private addRnDPlan(company: CompanyInfo, application: ApplicationData) {
    this.addSubSection('연구개발 목표');
    this.addParagraph(application.projectSummary);

    this.addSubSection('연구개발 내용');
    this.addBulletList([
      '핵심 기술 개발',
      '프로토타입 제작',
      '성능 테스트 및 검증',
      '상용화 준비'
    ]);

    this.addSubSection('연구개발 방법');
    this.addParagraph('자체 연구개발 및 산학연 협력을 통한 기술 개발');
  }

  private addResearchTeam(company: CompanyInfo) {
    this.addSubSection('연구책임자');
    this.addParagraph(`${company.ceoName} (대표이사)`);

    this.addSubSection('연구팀 구성');
    const teamData = [
      ['구분', '인원', '역할'],
      ['연구책임자', '1명', '과제 총괄'],
      ['선임연구원', '2명', '핵심 기술 개발'],
      ['연구원', `${(company.rdStaff || 5) - 3}명`, '개발 지원'],
      ['총계', `${company.rdStaff || 5}명`, '']
    ];

    this.addTableWithHeaders(teamData);
  }

  private addBudgetPlan(application: ApplicationData) {
    const budget = [
      ['비목', '금액', '비율'],
      ['인건비', `${(application.totalBudget * 0.4 / 100000000).toFixed(1)}억원`, '40%'],
      ['직접비', `${(application.totalBudget * 0.3 / 100000000).toFixed(1)}억원`, '30%'],
      ['위탁연구비', `${(application.totalBudget * 0.15 / 100000000).toFixed(1)}억원`, '15%'],
      ['간접비', `${(application.totalBudget * 0.15 / 100000000).toFixed(1)}억원`, '15%'],
      ['합계', `${(application.totalBudget / 100000000).toFixed(1)}억원`, '100%']
    ];

    this.addTableWithHeaders(budget);
  }

  private addVoucherPlan(application: ApplicationData) {
    this.addSubSection('바우처 사용 계획');
    this.addParagraph(application.projectSummary);

    this.addSubSection('활용 분야');
    this.addBulletList([
      '기술 개발 지원',
      '마케팅 지원',
      '디자인 개발',
      '인증 획득 지원'
    ]);

    this.addSubSection('신청 금액');
    this.addParagraph(`${(application.requestedAmount / 10000).toFixed(0)}만원`);
  }

  private addExpectedResults(application: ApplicationData) {
    this.addSubSection('기술적 기대효과');
    this.addParagraph(application.expectedOutcome);

    this.addSubSection('경제적 기대효과');
    if (application.salesTarget) {
      this.addParagraph(`매출 목표: ${(application.salesTarget / 100000000).toFixed(1)}억원`);
    }
    if (application.employmentPlan) {
      this.addParagraph(`고용 창출: ${application.employmentPlan}명`);
    }

    this.addSubSection('사회적 기대효과');
    this.addBulletList([
      '산업 경쟁력 강화',
      '일자리 창출',
      '기술 혁신 기여',
      '사회 문제 해결'
    ]);
  }

  private addSimpleExpectedResults(application: ApplicationData) {
    this.addParagraph(application.expectedOutcome);

    if (application.salesTarget) {
      this.addParagraph(`예상 매출 증가: ${(application.salesTarget / 100000000).toFixed(1)}억원`);
    }
    if (application.employmentPlan) {
      this.addParagraph(`예상 고용 창출: ${application.employmentPlan}명`);
    }
  }

  private addKPIAssessment(application: ApplicationData) {
    this.addSubSection('KPI 평가 결과');

    this.pdf.setFontSize(20);
    this.pdf.setTextColor(15, 82, 222);
    this.centerText(`종합 점수: ${application.overallScore.toFixed(1)}점`, this.currentY + 10);

    this.currentY += 20;

    const kpiData = [
      ['평가 축', '점수', '등급'],
      ['Growth & Ops', `${application.axisScores.GO.toFixed(1)}`, this.getGrade(application.axisScores.GO)],
      ['Economics', `${application.axisScores.EC.toFixed(1)}`, this.getGrade(application.axisScores.EC)],
      ['Product & Tech', `${application.axisScores.PT.toFixed(1)}`, this.getGrade(application.axisScores.PT)],
      ['Performance', `${application.axisScores.PF.toFixed(1)}`, this.getGrade(application.axisScores.PF)],
      ['Team & Org', `${application.axisScores.TO.toFixed(1)}`, this.getGrade(application.axisScores.TO)]
    ];

    this.addTableWithHeaders(kpiData);
  }

  private addAttachmentList(programType: string) {
    const commonDocs = [
      '사업자등록증',
      '법인등기부등본',
      '재무제표 (최근 2년)',
      '국세 및 지방세 완납 증명서'
    ];

    const programSpecificDocs: Record<string, string[]> = {
      'TIPS': [
        '기술사업계획서',
        '추천기관 추천서',
        '지식재산권 현황',
        '연구개발 실적 증명서'
      ],
      'R&D': [
        '연구개발계획서',
        '연구팀 이력서',
        '연구시설 및 장비 현황',
        '기술성 평가 자료'
      ],
      'VOUCHER': [
        '바우처 사용 계획서',
        '견적서'
      ]
    };

    this.addSubSection('필수 제출 서류');
    this.addBulletList(commonDocs);

    if (programSpecificDocs[programType]) {
      this.addSubSection('추가 제출 서류');
      this.addBulletList(programSpecificDocs[programType]);
    }
  }

  // 유틸리티 메서드들
  private addPage() {
    this.pdf.addPage();
    this.currentY = 30;
  }

  private createSection(title: string) {
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(24, 24, 27);
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 15;

    // 구분선
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.currentY - 5, this.pageWidth - this.margin, this.currentY - 5);
  }

  private addSubSection(title: string) {
    this.currentY += 8;
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(15, 82, 222);
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 8;
  }

  private addParagraph(text: string) {
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(50, 50, 50);

    const lines = this.pdf.splitTextToSize(text, this.pageWidth - 2 * this.margin);
    lines.forEach((line: string) => {
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 6;
    });
  }

  private addBulletList(items: string[]) {
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(50, 50, 50);

    items.forEach(item => {
      this.pdf.text(`• ${item}`, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
  }

  private addTable(data: string[][]) {
    const cellWidth = (this.pageWidth - 2 * this.margin) / 2;
    const cellHeight = 8;

    data.forEach(row => {
      // 라벨
      this.pdf.setFontSize(11);
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text(row[0], this.margin, this.currentY);

      // 값
      this.pdf.setTextColor(24, 24, 27);
      this.pdf.text(row[1], this.margin + cellWidth, this.currentY);

      this.currentY += cellHeight;
    });
  }

  private addTableWithHeaders(data: string[][]) {
    const cellWidth = (this.pageWidth - 2 * this.margin) / data[0].length;
    const cellHeight = 8;

    // 헤더
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(this.margin, this.currentY - 6, this.pageWidth - 2 * this.margin, cellHeight, 'F');

    this.pdf.setFontSize(11);
    this.pdf.setTextColor(24, 24, 27);
    data[0].forEach((header, index) => {
      this.pdf.text(header, this.margin + index * cellWidth + 2, this.currentY);
    });

    this.currentY += cellHeight;

    // 데이터 행
    this.pdf.setTextColor(50, 50, 50);
    data.slice(1).forEach(row => {
      row.forEach((cell, index) => {
        this.pdf.text(cell, this.margin + index * cellWidth + 2, this.currentY);
      });
      this.currentY += cellHeight;
    });
  }

  private centerText(text: string, y: number) {
    const textWidth = this.pdf.getTextWidth(text);
    const x = (this.pageWidth - textWidth) / 2;
    this.pdf.text(text, x, y);
  }

  private getGrade(score: number): string {
    if (score >= 85) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'D';
  }
}

// 사용 예시
export const generateGovernmentDoc = async (
  companyInfo: CompanyInfo,
  applicationData: ApplicationData
): Promise<Blob> => {
  const generator = new GovernmentDocGenerator();
  return generator.generate(companyInfo, applicationData);
};