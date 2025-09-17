import { jsPDF } from 'jspdf';
import type { AxisKey } from '../types';

export interface VCInfo {
  name: string;
  firm: string;
  email: string;
  focusAreas: string[];
  investmentStage: 'Seed' | 'Series A' | 'Series B' | 'Series C+';
  ticketSize: string;
}

export interface CompanyData {
  companyName: string;
  ceoName: string;
  sector: string;
  description: string;
  traction: string;
  revenue: string;
  growth: string;
  teamSize: number;
  uniqueValue: string;
  askAmount: string;
  website?: string;
  linkedin?: string;
}

export interface KPIData {
  overallScore: number;
  axisScores: Record<AxisKey, number>;
}

export type EmailTone = 'formal' | 'casual' | 'enthusiastic';
export type EmailLength = 'short' | 'medium' | 'long';

interface EmailTemplate {
  subject: string;
  body: string;
  callToAction: string;
}

const toneStyles = {
  formal: {
    greeting: (vcName: string) => `Dear ${vcName}`,
    opening: 'I hope this email finds you well.',
    closing: 'Best regards',
    style: 'professional'
  },
  casual: {
    greeting: (vcName: string) => `Hi ${vcName}`,
    opening: 'Hope you\'re having a great day!',
    closing: 'Best',
    style: 'friendly'
  },
  enthusiastic: {
    greeting: (vcName: string) => `Hi ${vcName}!`,
    opening: 'I\'m excited to reach out to you today!',
    closing: 'Looking forward to connecting',
    style: 'energetic'
  }
};

const generateSubject = (company: CompanyData, vc: VCInfo, tone: EmailTone): string => {
  const templates = {
    formal: [
      `${company.companyName} - ${vc.investmentStage} Investment Opportunity`,
      `Investment Opportunity: ${company.companyName} (${company.sector})`,
      `${company.companyName} - Seeking ${company.askAmount} ${vc.investmentStage} Round`
    ],
    casual: [
      `${company.companyName} x ${vc.firm} - Quick intro`,
      `${company.sector} startup with ${company.growth} growth`,
      `${company.companyName} - Would love your thoughts`
    ],
    enthusiastic: [
      `🚀 ${company.companyName} - ${company.growth} growth in ${company.sector}!`,
      `${company.companyName} crushing it in ${company.sector} 📈`,
      `Exciting ${vc.investmentStage} opportunity in ${company.sector}`
    ]
  };

  const subjectTemplates = templates[tone];
  return subjectTemplates[Math.floor(Math.random() * subjectTemplates.length)];
};

const generateBody = (
  company: CompanyData,
  vc: VCInfo,
  kpi: KPIData,
  tone: EmailTone,
  length: EmailLength
): string => {
  const style = toneStyles[tone];
  const vcName = vc.name.split(' ')[0]; // First name only
  
  let body = `${style.greeting(vcName)},\n\n`;
  body += `${style.opening}\n\n`;

  // Introduction
  if (length !== 'short') {
    body += `I\'m ${company.ceoName}, CEO of ${company.companyName}. `;
    body += `I came across ${vc.firm}\'s impressive portfolio in ${vc.focusAreas.join(', ')}, `;
    body += `and I believe our vision aligns perfectly with your investment thesis.\n\n`;
  } else {
    body += `I\'m ${company.ceoName} from ${company.companyName}. `;
    body += `Given ${vc.firm}\'s focus on ${vc.focusAreas[0]}, I thought you\'d be interested in what we\'re building.\n\n`;
  }

  // Company description
  body += `${company.companyName} is ${company.description}. `;
  body += `${company.uniqueValue}\n\n`;

  // Traction and metrics
  if (length !== 'short') {
    body += `📊 **Key Highlights:**\n`;
    body += `• Current ARR: ${company.revenue}\n`;
    body += `• Growth: ${company.growth} YoY\n`;
    body += `• ${company.traction}\n`;
    if (kpi.overallScore > 70) {
      body += `• KPI Score: ${kpi.overallScore.toFixed(1)}/100 (Top ${100 - kpi.overallScore}% in our category)\n`;
    }
    body += `\n`;
  } else {
    body += `We\'re currently at ${company.revenue} ARR with ${company.growth} growth. ${company.traction}\n\n`;
  }

  // Why this VC
  if (length === 'long') {
    body += `**Why ${vc.firm}?**\n`;
    body += `Your portfolio companies in ${vc.focusAreas[0]} show that you understand the challenges `;
    body += `and opportunities in our space. Your typical ${vc.ticketSize} investment aligns with our `;
    body += `${company.askAmount} ${vc.investmentStage} round, and we believe your expertise would be invaluable for our next phase of growth.\n\n`;
  }

  // Team
  if (length !== 'short') {
    body += `Our team of ${company.teamSize} includes veterans from top companies in the ${company.sector} space, `;
    body += `with deep expertise in product, engineering, and go-to-market.\n\n`;
  }

  // Ask
  body += `We\'re raising ${company.askAmount} in our ${vc.investmentStage} round to `;
  if (length === 'long') {
    body += `accelerate growth, expand our team, and capture the massive opportunity ahead. `;
    body += `The round is moving quickly with strong interest from several top-tier investors.\n\n`;
  } else {
    body += `accelerate our growth trajectory.\n\n`;
  }

  return body;
};

const generateCallToAction = (tone: EmailTone, length: EmailLength): string => {
  const ctas = {
    formal: {
      short: 'Would you be available for a brief call next week to discuss further?',
      medium: 'I would welcome the opportunity to share more details about our vision and traction. Would you be available for a 30-minute call next week?',
      long: 'I\'ve attached our pitch deck for your review. I would be delighted to schedule a call at your convenience to discuss how we might work together. Are you available for a 30-minute call next week?'
    },
    casual: {
      short: 'Would love to hop on a quick call if you\'re interested!',
      medium: 'Happy to share our deck and hop on a call if this resonates. Free for a quick chat next week?',
      long: 'I\'ve attached our deck with more details. Would love to get your thoughts and see if there\'s a fit. Any time next week work for a quick call?'
    },
    enthusiastic: {
      short: 'Let\'s connect next week - would love to show you what we\'re building! 🚀',
      medium: 'Super excited to share more! I\'ll send over our deck - would love to get your thoughts. Coffee chat next week? ☕',
      long: 'I\'m attaching our deck and would absolutely love to get your insights! This is going to be huge and we\'d love to have you on the journey. Can we find 30 minutes next week to dive deeper? 🎯'
    }
  };

  return ctas[tone][length];
};

export const generateVCEmail = (
  company: CompanyData,
  vc: VCInfo,
  kpi: KPIData,
  tone: EmailTone = 'casual',
  length: EmailLength = 'medium'
): EmailTemplate => {
  const subject = generateSubject(company, vc, tone);
  const body = generateBody(company, vc, kpi, tone, length);
  const callToAction = generateCallToAction(tone, length);
  const style = toneStyles[tone];

  const fullBody = body + callToAction + `\n\n${style.closing},\n${company.ceoName}\n${company.companyName}`;
  
  if (company.website) {
    fullBody + `\n${company.website}`;
  }
  if (company.linkedin) {
    fullBody + `\n${company.linkedin}`;
  }

  return {
    subject,
    body: fullBody,
    callToAction
  };
};

// VC 데이터베이스 (한국 주요 VC)
export const vcDatabase: VCInfo[] = [
  {
    name: 'Joon Kim',
    firm: 'Kakao Ventures',
    email: 'joon@kakaoventures.com',
    focusAreas: ['AI/ML', 'Consumer', 'B2B SaaS'],
    investmentStage: 'Seed',
    ticketSize: '$500K-$2M'
  },
  {
    name: 'Sarah Lee',
    firm: 'Altos Ventures',
    email: 'sarah@altos.vc',
    focusAreas: ['B2B SaaS', 'Enterprise', 'Data'],
    investmentStage: 'Series A',
    ticketSize: '$3M-$10M'
  },
  {
    name: 'James Park',
    firm: 'SoftBank Ventures Asia',
    email: 'james@sbva.com',
    focusAreas: ['AI', 'DeepTech', 'Platform'],
    investmentStage: 'Series A',
    ticketSize: '$5M-$15M'
  },
  {
    name: 'Michelle Cho',
    firm: 'NAVER D2SF',
    email: 'michelle@naverd2sf.com',
    focusAreas: ['Consumer Tech', 'Content', 'Commerce'],
    investmentStage: 'Seed',
    ticketSize: '$300K-$1M'
  },
  {
    name: 'Daniel Shin',
    firm: 'Hashed',
    email: 'daniel@hashed.com',
    focusAreas: ['Web3', 'Blockchain', 'DeFi'],
    investmentStage: 'Seed',
    ticketSize: '$500K-$3M'
  },
  {
    name: 'Grace Kim',
    firm: 'Primer Sazze',
    email: 'grace@primer.kr',
    focusAreas: ['B2B', 'SaaS', 'Enterprise'],
    investmentStage: 'Seed',
    ticketSize: '$500K-$2M'
  },
  {
    name: 'Kevin Huh',
    firm: 'FuturePlay',
    email: 'kevin@futureplay.co',
    focusAreas: ['DeepTech', 'AI', 'Robotics'],
    investmentStage: 'Seed',
    ticketSize: '$500K-$2M'
  },
  {
    name: 'Jenny Song',
    firm: 'Yellowdog',
    email: 'jenny@yellowdog.vc',
    focusAreas: ['Consumer', 'Healthcare', 'Education'],
    investmentStage: 'Series A',
    ticketSize: '$3M-$8M'
  }
];

// 이메일 템플릿을 텍스트 파일로 저장
export const saveEmailAsText = (template: EmailTemplate, vcName: string): Blob => {
  const content = `Subject: ${template.subject}\n\n${template.body}`;
  return new Blob([content], { type: 'text/plain' });
};

// 여러 VC에게 보낼 이메일 일괄 생성
export const generateBulkEmails = (
  company: CompanyData,
  vcs: VCInfo[],
  kpi: KPIData,
  tone: EmailTone,
  length: EmailLength
): Map<string, EmailTemplate> => {
  const emails = new Map<string, EmailTemplate>();
  
  vcs.forEach(vc => {
    const template = generateVCEmail(company, vc, kpi, tone, length);
    emails.set(vc.email, template);
  });
  
  return emails;
};