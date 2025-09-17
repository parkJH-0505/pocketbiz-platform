import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { AxisKey } from '../types';

export interface IRDeckData {
  // 회사 정보
  companyName: string;
  sector: string;
  stage: string;
  foundedDate?: string;
  website?: string;

  // 팀 정보
  ceoName?: string;
  teamSize?: number;
  keyMembers?: Array<{
    name: string;
    position: string;
    experience: string;
  }>;

  // 비즈니스
  problem: string;
  solution: string;
  businessModel: string;
  targetMarket: string;
  competitiveAdvantage: string;

  // 성과 지표
  overallScore: number;
  axisScores: Record<AxisKey, number>;
  monthlyRevenue?: number;
  mau?: number;
  growthRate?: number;

  // 재무
  currentFunding?: number;
  runway?: number;
  targetFunding?: number;
  useOfFunds?: string[];

  // 로드맵
  milestones: Array<{
    title: string;
    date: string;
    status: 'completed' | 'in-progress' | 'planned';
  }>;
}

export class IRDeckGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 40;
  private primaryColor = [15, 82, 222]; // RGB for primary-main
  private textColor = [24, 24, 27]; // RGB for neutral-dark

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  async generate(data: IRDeckData): Promise<Blob> {
    // 폰트 설정
    this.setupFonts();

    // 1. 타이틀 슬라이드
    this.createTitleSlide(data);

    // 2. 문제 정의
    this.createProblemSlide(data);

    // 3. 솔루션
    this.createSolutionSlide(data);

    // 4. 비즈니스 모델
    this.createBusinessModelSlide(data);

    // 5. 시장 기회
    this.createMarketSlide(data);

    // 6. 성과 지표
    this.createMetricsSlide(data);

    // 7. KPI 점수
    this.createKPISlide(data);

    // 8. 팀 소개
    this.createTeamSlide(data);

    // 9. 재무 계획
    this.createFinancialSlide(data);

    // 10. 로드맵
    this.createRoadmapSlide(data);

    // 11. 투자 제안
    this.createInvestmentSlide(data);

    // 12. 연락처
    this.createContactSlide(data);

    // PDF 생성
    return this.pdf.output('blob');
  }

  private setupFonts() {
    // 한글 폰트 지원을 위한 설정 (실제로는 폰트 파일 필요)
    this.pdf.setFont('helvetica');
  }

  private createTitleSlide(data: IRDeckData) {
    this.currentY = this.pageHeight / 2 - 30;

    // 배경색
    this.pdf.setFillColor(...this.primaryColor);
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // 회사명
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(48);
    this.centerText(data.companyName, this.currentY);

    // 태그라인
    this.currentY += 20;
    this.pdf.setFontSize(20);
    this.centerText('Investor Relations Deck', this.currentY);

    // 날짜
    this.currentY += 15;
    this.pdf.setFontSize(14);
    const date = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long'
    });
    this.centerText(date, this.currentY);

    // 섹터 & 단계
    this.currentY = this.pageHeight - 30;
    this.pdf.setFontSize(12);
    this.centerText(`${data.sector} | ${data.stage}`, this.currentY);
  }

  private createProblemSlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('문제 정의', 'The Problem');

    this.currentY = 60;
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(...this.textColor);

    // 문제 설명
    const problemLines = this.splitText(data.problem, this.pageWidth - 2 * this.margin);
    problemLines.forEach(line => {
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 10;
    });

    // 시각적 요소 (아이콘 또는 이미지 위치)
    this.drawProblemVisual();
  }

  private createSolutionSlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('솔루션', 'Our Solution');

    this.currentY = 60;
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(...this.textColor);

    const solutionLines = this.splitText(data.solution, this.pageWidth - 2 * this.margin);
    solutionLines.forEach(line => {
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 10;
    });

    // 경쟁 우위
    this.currentY += 10;
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text('Competitive Advantage:', this.margin, this.currentY);
    this.currentY += 8;

    const advantageLines = this.splitText(data.competitiveAdvantage, this.pageWidth - 2 * this.margin);
    advantageLines.forEach(line => {
      this.pdf.text(line, this.margin + 10, this.currentY);
      this.currentY += 8;
    });
  }

  private createBusinessModelSlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('비즈니스 모델', 'Business Model');

    this.currentY = 60;
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(...this.textColor);

    const modelLines = this.splitText(data.businessModel, this.pageWidth - 2 * this.margin);
    modelLines.forEach(line => {
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 10;
    });

    // 수익 모델 다이어그램
    this.drawBusinessModelDiagram();
  }

  private createMarketSlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('시장 기회', 'Market Opportunity');

    this.currentY = 60;
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(...this.textColor);

    const marketLines = this.splitText(data.targetMarket, this.pageWidth - 2 * this.margin);
    marketLines.forEach(line => {
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 10;
    });

    // TAM, SAM, SOM 시각화
    this.drawMarketSizeChart();
  }

  private createMetricsSlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('주요 성과', 'Key Metrics');

    const metrics = [
      { label: '월 매출', value: data.monthlyRevenue ? `${(data.monthlyRevenue / 100000000).toFixed(1)}억원` : 'N/A' },
      { label: 'MAU', value: data.mau ? `${(data.mau / 1000).toFixed(1)}K` : 'N/A' },
      { label: '성장률', value: data.growthRate ? `${data.growthRate}%` : 'N/A' },
      { label: '팀 규모', value: data.teamSize ? `${data.teamSize}명` : 'N/A' }
    ];

    // 메트릭 카드 그리드
    const cardWidth = (this.pageWidth - 2 * this.margin - 30) / 2;
    const cardHeight = 40;
    let x = this.margin;
    let y = 60;

    metrics.forEach((metric, index) => {
      if (index === 2) {
        x = this.margin;
        y += cardHeight + 10;
      }

      // 카드 배경
      this.pdf.setFillColor(245, 247, 250);
      this.pdf.rect(x, y, cardWidth, cardHeight, 'F');

      // 메트릭 값
      this.pdf.setFontSize(24);
      this.pdf.setTextColor(...this.primaryColor);
      this.pdf.text(metric.value, x + 10, y + 20);

      // 메트릭 라벨
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text(metric.label, x + 10, y + 30);

      x += cardWidth + 10;
    });
  }

  private createKPISlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('KPI 평가', 'KPI Assessment');

    // 종합 점수
    this.pdf.setFontSize(36);
    this.pdf.setTextColor(...this.primaryColor);
    this.centerText(`${data.overallScore.toFixed(1)}점`, 60);

    this.pdf.setFontSize(14);
    this.pdf.setTextColor(100, 100, 100);
    this.centerText('종합 평가 점수', 70);

    // 축별 점수
    const axes = [
      { key: 'GO', label: 'Growth & Ops', color: [112, 46, 220] },
      { key: 'EC', label: 'Economics', color: [76, 206, 148] },
      { key: 'PT', label: 'Product & Tech', color: [251, 146, 60] },
      { key: 'PF', label: 'Performance', color: [15, 82, 222] },
      { key: 'TO', label: 'Team & Org', color: [239, 68, 68] }
    ];

    const barWidth = (this.pageWidth - 2 * this.margin) / 5 - 10;
    let x = this.margin;
    const y = 90;
    const maxHeight = 60;

    axes.forEach(axis => {
      const score = data.axisScores[axis.key as AxisKey] || 0;
      const barHeight = (score / 100) * maxHeight;

      // 바 차트
      this.pdf.setFillColor(...axis.color);
      this.pdf.rect(x, y + maxHeight - barHeight, barWidth, barHeight, 'F');

      // 점수
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(...this.textColor);
      this.pdf.text(`${Math.round(score)}`, x + barWidth/2 - 5, y + maxHeight - barHeight - 5);

      // 라벨
      this.pdf.setFontSize(10);
      this.pdf.text(axis.label, x, y + maxHeight + 10);

      x += barWidth + 10;
    });
  }

  private createTeamSlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('팀 소개', 'Our Team');

    this.currentY = 60;

    // CEO 정보
    if (data.ceoName) {
      this.pdf.setFontSize(18);
      this.pdf.setTextColor(...this.textColor);
      this.pdf.text(`CEO: ${data.ceoName}`, this.margin, this.currentY);
      this.currentY += 15;
    }

    // 팀 규모
    if (data.teamSize) {
      this.pdf.setFontSize(14);
      this.pdf.text(`팀 규모: ${data.teamSize}명`, this.margin, this.currentY);
      this.currentY += 15;
    }

    // 핵심 멤버
    if (data.keyMembers && data.keyMembers.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text('핵심 멤버:', this.margin, this.currentY);
      this.currentY += 10;

      data.keyMembers.forEach(member => {
        this.pdf.setFontSize(12);
        this.pdf.setTextColor(...this.textColor);
        this.pdf.text(`• ${member.name} - ${member.position}`, this.margin + 10, this.currentY);
        this.currentY += 8;

        this.pdf.setFontSize(10);
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text(member.experience, this.margin + 15, this.currentY);
        this.currentY += 10;
      });
    }
  }

  private createFinancialSlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('재무 계획', 'Financial Plan');

    this.currentY = 60;
    this.pdf.setFontSize(14);

    // 현재 펀딩
    if (data.currentFunding) {
      this.pdf.setTextColor(...this.textColor);
      this.pdf.text(`현재까지 투자 유치: ${(data.currentFunding / 100000000).toFixed(1)}억원`, this.margin, this.currentY);
      this.currentY += 10;
    }

    // 런웨이
    if (data.runway) {
      this.pdf.text(`런웨이: ${data.runway}개월`, this.margin, this.currentY);
      this.currentY += 10;
    }

    // 목표 투자금
    if (data.targetFunding) {
      this.currentY += 5;
      this.pdf.setFontSize(16);
      this.pdf.setTextColor(...this.primaryColor);
      this.pdf.text(`목표 투자 유치: ${(data.targetFunding / 100000000).toFixed(0)}억원`, this.margin, this.currentY);
      this.currentY += 15;
    }

    // 자금 사용 계획
    if (data.useOfFunds && data.useOfFunds.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text('자금 사용 계획:', this.margin, this.currentY);
      this.currentY += 10;

      data.useOfFunds.forEach(use => {
        this.pdf.setFontSize(12);
        this.pdf.setTextColor(...this.textColor);
        this.pdf.text(`• ${use}`, this.margin + 10, this.currentY);
        this.currentY += 8;
      });
    }
  }

  private createRoadmapSlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('로드맵', 'Roadmap');

    if (!data.milestones || data.milestones.length === 0) {
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(100, 100, 100);
      this.centerText('로드맵 정보가 없습니다', this.pageHeight / 2);
      return;
    }

    // 타임라인 그리기
    const timelineY = this.pageHeight / 2;
    const timelineStartX = this.margin;
    const timelineEndX = this.pageWidth - this.margin;
    const timelineLength = timelineEndX - timelineStartX;

    // 타임라인 라인
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(1);
    this.pdf.line(timelineStartX, timelineY, timelineEndX, timelineY);

    // 마일스톤 표시
    const milestoneSpacing = timelineLength / (data.milestones.length + 1);

    data.milestones.forEach((milestone, index) => {
      const x = timelineStartX + milestoneSpacing * (index + 1);

      // 상태별 색상
      let color: number[];
      switch (milestone.status) {
        case 'completed':
          color = [76, 206, 148]; // green
          break;
        case 'in-progress':
          color = [15, 82, 222]; // blue
          break;
        default:
          color = [200, 200, 200]; // gray
      }

      // 마일스톤 점
      this.pdf.setFillColor(...color);
      this.pdf.circle(x, timelineY, 3, 'F');

      // 마일스톤 텍스트
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...this.textColor);

      // 위/아래 번갈아 표시
      const textY = index % 2 === 0 ? timelineY - 15 : timelineY + 20;
      this.pdf.text(milestone.title, x - 20, textY);
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text(milestone.date, x - 20, textY + 5);
    });
  }

  private createInvestmentSlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('투자 제안', 'Investment Proposal');

    this.currentY = 70;

    // 투자 금액
    this.pdf.setFontSize(24);
    this.pdf.setTextColor(...this.primaryColor);
    this.centerText(`${(data.targetFunding || 1000000000) / 100000000}억원 투자 유치`, this.currentY);

    this.currentY += 20;

    // 투자 조건 (예시)
    const terms = [
      'Pre-A 라운드',
      '20% 지분',
      'SAFE 또는 전환사채 가능',
      '이사회 옵저버 시트 제공'
    ];

    this.pdf.setFontSize(14);
    this.pdf.setTextColor(...this.textColor);

    terms.forEach(term => {
      this.centerText(term, this.currentY);
      this.currentY += 10;
    });
  }

  private createContactSlide(data: IRDeckData) {
    this.addPage();
    this.createSlideHeader('Contact', '');

    this.currentY = this.pageHeight / 2 - 20;

    // 회사명
    this.pdf.setFontSize(24);
    this.pdf.setTextColor(...this.textColor);
    this.centerText(data.companyName, this.currentY);

    this.currentY += 15;

    // 연락처 정보
    const contacts = [
      data.ceoName ? `CEO: ${data.ceoName}` : '',
      data.website || 'www.company.com',
      'contact@company.com',
      '02-1234-5678'
    ].filter(Boolean);

    this.pdf.setFontSize(14);
    this.pdf.setTextColor(100, 100, 100);

    contacts.forEach(contact => {
      this.centerText(contact, this.currentY);
      this.currentY += 8;
    });

    // Thank you
    this.currentY = this.pageHeight - 40;
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(...this.primaryColor);
    this.centerText('Thank You', this.currentY);
  }

  // 헬퍼 메서드들
  private addPage() {
    this.pdf.addPage();
    this.currentY = 40;
  }

  private createSlideHeader(titleKo: string, titleEn: string) {
    this.pdf.setFontSize(24);
    this.pdf.setTextColor(...this.textColor);
    this.pdf.text(titleKo, this.margin, 30);

    if (titleEn) {
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text(titleEn, this.margin, 38);
    }

    // 구분선
    this.pdf.setDrawColor(230, 230, 230);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, 42, this.pageWidth - this.margin, 42);
  }

  private centerText(text: string, y: number) {
    const textWidth = this.pdf.getTextWidth(text);
    const x = (this.pageWidth - textWidth) / 2;
    this.pdf.text(text, x, y);
  }

  private splitText(text: string, maxWidth: number): string[] {
    // 텍스트를 여러 줄로 분할 (간단한 구현)
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.pdf.getTextWidth(testLine);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private drawProblemVisual() {
    // 문제 시각화 (예: 아이콘 위치 표시)
    const centerX = this.pageWidth / 2;
    const visualY = this.currentY + 20;

    this.pdf.setFillColor(255, 200, 200);
    this.pdf.circle(centerX, visualY, 20, 'F');

    this.pdf.setFontSize(24);
    this.pdf.setTextColor(200, 50, 50);
    this.centerText('!', visualY + 8);
  }

  private drawBusinessModelDiagram() {
    // 비즈니스 모델 다이어그램 (간단한 박스 다이어그램)
    const boxWidth = 60;
    const boxHeight = 30;
    const y = this.currentY + 20;
    const centerX = this.pageWidth / 2;

    // 고객 박스
    this.pdf.setFillColor(230, 240, 250);
    this.pdf.rect(centerX - boxWidth - 40, y, boxWidth, boxHeight, 'F');
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(...this.textColor);
    this.pdf.text('고객', centerX - boxWidth - 20, y + 18);

    // 화살표
    this.pdf.setDrawColor(...this.primaryColor);
    this.pdf.setLineWidth(2);
    this.pdf.line(centerX - 40, y + 15, centerX - 20, y + 15);

    // 플랫폼 박스
    this.pdf.setFillColor(...this.primaryColor);
    this.pdf.rect(centerX - boxWidth/2, y, boxWidth, boxHeight, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text('플랫폼', centerX - 15, y + 18);

    // 화살표
    this.pdf.setDrawColor(...this.primaryColor);
    this.pdf.line(centerX + 30, y + 15, centerX + 50, y + 15);

    // 수익 박스
    this.pdf.setFillColor(200, 250, 200);
    this.pdf.rect(centerX + 50, y, boxWidth, boxHeight, 'F');
    this.pdf.setTextColor(...this.textColor);
    this.pdf.text('수익', centerX + 70, y + 18);
  }

  private drawMarketSizeChart() {
    // TAM, SAM, SOM 동심원
    const centerX = this.pageWidth / 2;
    const centerY = this.currentY + 40;

    // TAM
    this.pdf.setFillColor(200, 220, 250);
    this.pdf.circle(centerX, centerY, 35, 'F');

    // SAM
    this.pdf.setFillColor(150, 190, 240);
    this.pdf.circle(centerX, centerY, 25, 'F');

    // SOM
    this.pdf.setFillColor(...this.primaryColor);
    this.pdf.circle(centerX, centerY, 15, 'F');

    // 라벨
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(...this.textColor);
    this.pdf.text('TAM: 1조원', centerX + 45, centerY - 25);
    this.pdf.text('SAM: 3000억원', centerX + 45, centerY);
    this.pdf.text('SOM: 500억원', centerX + 45, centerY + 25);
  }
}

// 사용 예시
export const generateIRDeck = async (
  companyData: Partial<IRDeckData>,
  kpiData: { overallScore: number; axisScores: Record<AxisKey, number> }
): Promise<Blob> => {
  const generator = new IRDeckGenerator();

  const deckData: IRDeckData = {
    companyName: companyData.companyName || '우리 회사',
    sector: companyData.sector || 'Tech',
    stage: companyData.stage || 'Series A',
    problem: companyData.problem || '시장의 핵심 문제를 해결합니다.',
    solution: companyData.solution || '혁신적인 솔루션을 제공합니다.',
    businessModel: companyData.businessModel || 'B2B SaaS 구독 모델',
    targetMarket: companyData.targetMarket || '국내 중소기업 10만개',
    competitiveAdvantage: companyData.competitiveAdvantage || '독보적인 기술력과 팀 역량',
    overallScore: kpiData.overallScore,
    axisScores: kpiData.axisScores,
    milestones: companyData.milestones || [
      { title: 'MVP 출시', date: '2024.01', status: 'completed' },
      { title: 'Series A', date: '2024.06', status: 'in-progress' },
      { title: '글로벌 진출', date: '2024.12', status: 'planned' }
    ],
    ...companyData
  };

  return generator.generate(deckData);
};