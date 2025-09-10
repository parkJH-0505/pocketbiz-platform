import type { AxisKey } from '../types';
import type { Action, Milestone } from './actionPlan';
import type { Insight } from './insights';

export interface PDFReportData {
  companyName: string;
  assessmentDate: string;
  totalScore: number;
  grade: string;
  axisScores: Record<AxisKey, number>;
  insights: Insight[];
  actions: Action[];
  milestones: Milestone[];
  benchmarks: {
    peerAvg: Record<AxisKey, number>;
    top10: Record<AxisKey, number>;
  };
}

// PDF ?�보?�기 ?�수 (?�제 구현?� jsPDF ?�의 ?�이브러�??�용)
export async function exportToPDF(data: PDFReportData): Promise<Blob> {
  // ?�기?�는 Mock 구현
  console.log('Exporting PDF with data:', data);
  
  // ?�제로는 jsPDF??puppeteer�??�용?�여 PDF ?�성
  // const doc = new jsPDF();
  // ... PDF ?�성 로직
  
  // Mock Blob 반환
  return new Blob(['PDF Content'], { type: 'application/pdf' });
}

// 리포??HTML ?�성 (PDF 변?�용)
export function generateReportHTML(data: PDFReportData): string {
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>?�켓비즈 ?��? 리포??- ${data.companyName}</title>
      <style>
        body {
          font-family: 'Noto Sans KR', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        .header {
          text-align: center;
          margin-bottom: 60px;
          page-break-after: always;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #0F52DE;
          margin-bottom: 40px;
        }
        h1 {
          font-size: 32px;
          margin-bottom: 20px;
        }
        h2 {
          font-size: 24px;
          color: #0F52DE;
          margin-top: 40px;
          margin-bottom: 20px;
          border-bottom: 2px solid #0F52DE;
          padding-bottom: 10px;
        }
        h3 {
          font-size: 18px;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        .score-box {
          background: #F0F6FF;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          margin: 30px 0;
        }
        .score-value {
          font-size: 48px;
          font-weight: bold;
          color: #0F52DE;
        }
        .grade {
          font-size: 36px;
          font-weight: bold;
          margin-left: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background: #F5F5F5;
          font-weight: bold;
        }
        .axis-score {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          margin: 10px 0;
          background: #F9F9F9;
          border-radius: 8px;
        }
        .insight {
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid;
          background: #F9F9F9;
        }
        .insight.strength { border-color: #4FCE94; }
        .insight.weakness { border-color: #EF4444; }
        .insight.opportunity { border-color: #FB923C; }
        .insight.risk { border-color: #EF4444; }
        .action {
          padding: 20px;
          margin: 15px 0;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .action-priority {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-right: 10px;
        }
        .priority-critical { background: #FEE2E2; color: #DC2626; }
        .priority-high { background: #FED7AA; color: #EA580C; }
        .priority-medium { background: #FEF3C7; color: #D97706; }
        .footer {
          text-align: center;
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <!-- ?��? -->
      <div class="header">
        <div class="logo">PocketBiz</div>
        <h1>?��??�업 ?�장 진단 리포??/h1>
        <p style="font-size: 20px; margin: 20px 0;">${data.companyName}</p>
        <p style="color: #666;">${data.assessmentDate}</p>
      </div>

      <!-- 종합 ?�수 -->
      <h2>종합 ?��? 결과</h2>
      <div class="score-box">
        <div>
          <span class="score-value">${data.totalScore.toFixed(1)}</span>
          <span style="font-size: 24px;">/100</span>
          <span class="grade" style="color: ${getGradeColor(data.grade)}">${data.grade}</span>
        </div>
        <p style="margin-top: 20px; color: #666;">
          ${getGradeDescription(data.totalScore)}
        </p>
      </div>

      <!-- 축별 ?�수 -->
      <h2>축별 ?��? ?�수</h2>
      ${generateAxisScoresHTML(data.axisScores, data.benchmarks.peerAvg)}

      <!-- 주요 ?�사?�트 -->
      <h2>주요 분석 ?�사?�트</h2>
      ${generateInsightsHTML(data.insights.slice(0, 6))}

      <!-- ?�선?�위 ?�션 -->
      <h2>?�선?�위 ?�행 과제</h2>
      ${generateActionsHTML(data.actions.slice(0, 10))}

      <!-- 로드�?-->
      <h2>?�장 로드�?/h2>
      ${generateRoadmapHTML(data.milestones)}

      <div class="footer">
        <p>�?리포?�는 ?�켓비즈 AI 분석 ?�진???�해 ?�동 ?�성?�었?�니??</p>
        <p>© 2025 PocketBiz. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

// Helper functions
function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#4FCE94';
  if (grade.startsWith('B')) return '#3B82F6';
  if (grade.startsWith('C')) return '#FB923C';
  return '#EF4444';
}

function getGradeDescription(score: number): string {
  if (score >= 80) return '매우 ?�수???�과�?보이�??�습?�다. 지?�적???�장??기�??�니??';
  if (score >= 65) return '?�호???�장 ?�계???�습?�다. �?가지 개선?�을 보완?�면 ?????�장??가?�합?�다.';
  if (score >= 50) return '기본?�인 ?�업 기반?� 갖추?�으?? ?�러 ?�역?�서 개선???�요?�니??';
  return '?�반?�인 개선???�급?�니?? ?�선?�위�??�해 ?�심 문제부???�결?�야 ?�니??';
}

function generateAxisScoresHTML(scores: Record<AxisKey, number>, peerAvg: Record<AxisKey, number>): string {
  const axisNames = {
    GO: 'Growth Opportunity',
    EC: 'Economic Value',
    PT: 'Product Technology',
    PF: 'Performance Finance',
    TO: 'Team Organization'
  };
  
  return Object.entries(scores).map(([axis, score]) => `
    <div class="axis-score">
      <div>
        <strong>${axis}</strong> - ${axisNames[axis as AxisKey]}
      </div>
      <div>
        <span style="font-size: 24px; font-weight: bold;">${score.toFixed(0)}</span>
        <span style="color: #666; margin-left: 10px;">
          (?�종?�계 ?�균: ${peerAvg[axis as AxisKey]?.toFixed(0) || 'N/A'})
        </span>
      </div>
    </div>
  `).join('');
}

function generateInsightsHTML(insights: Insight[]): string {
  return insights.map(insight => `
    <div class="insight ${insight.type}">
      <h3>${insight.title}</h3>
      <p>${insight.description}</p>
    </div>
  `).join('');
}

function generateActionsHTML(actions: Action[]): string {
  return actions.map((action, index) => `
    <div class="action">
      <div style="margin-bottom: 10px;">
        <span class="action-priority priority-${action.priority}">${action.priority.toUpperCase()}</span>
        <strong style="font-size: 18px;">${index + 1}. ${action.title}</strong>
      </div>
      <p style="color: #666; margin: 10px 0;">${action.description}</p>
      <div style="display: flex; gap: 20px; margin-top: 15px;">
        <div>
          <strong>기간:</strong> ${action.timeframe}
        </div>
        <div>
          <strong>?�향??</strong> ${action.impact}
        </div>
        <div>
          <strong>관??�?</strong> ${action.axis}
        </div>
      </div>
    </div>
  `).join('');
}

function generateRoadmapHTML(milestones: Milestone[]): string {
  return milestones.map(milestone => `
    <div style="margin: 30px 0;">
      <h3>Phase ${milestone.phase}: ${milestone.title}</h3>
      <p style="color: #666;">${milestone.description}</p>
      <p><strong>기간:</strong> ${milestone.duration}</p>
      <p><strong>주요 과제:</strong> ${milestone.actions.length}�?/p>
      ${milestone.targetScore ? `<p><strong>목표 ?�수:</strong> ${milestone.targetScore}??/p>` : ''}
    </div>
  `).join('');
}
