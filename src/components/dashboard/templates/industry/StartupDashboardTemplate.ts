/**
 * Startup Dashboard Template
 * 스타트업 전용 대시보드 템플릿
 */

import type { DashboardTemplate } from '../DashboardTemplateEngine';

export const startupDashboardTemplate: DashboardTemplate = {
  metadata: {
    id: 'startup-growth-dashboard',
    name: '스타트업 성장 대시보드',
    description: '스타트업의 핵심 성장 지표와 KPI를 한눈에 볼 수 있는 종합 대시보드',
    category: 'business',
    industry: ['startup', 'technology', 'saas'],
    tags: ['growth', 'kpi', 'funding', 'metrics', 'analytics'],
    author: 'PocketBiz Platform',
    version: '1.0.0',
    created: Date.now(),
    updated: Date.now(),
    downloads: 2547,
    rating: 4.8,
    difficulty: 'intermediate',
    estimatedSetupTime: 15,
    requirements: {
      dataSources: ['analytics', 'finance', 'crm', 'marketing'],
      permissions: ['dashboard:create', 'data:read', 'export:charts'],
      features: ['real-time', 'charts', 'notifications', 'theming']
    },
    preview: {
      thumbnail: '/templates/startup-dashboard-thumb.png',
      screenshots: [
        '/templates/startup-dashboard-1.png',
        '/templates/startup-dashboard-2.png',
        '/templates/startup-dashboard-3.png'
      ],
      demoUrl: 'https://demo.pocketbiz.com/startup-dashboard'
    },
    support: {
      documentation: 'https://docs.pocketbiz.com/templates/startup-dashboard',
      forum: 'https://community.pocketbiz.com/startup-templates',
      contact: 'support@pocketbiz.com'
    }
  },
  variables: [
    {
      key: 'company_name',
      label: '회사명',
      type: 'string',
      defaultValue: 'My Startup',
      required: true,
      description: '대시보드에 표시될 회사명'
    },
    {
      key: 'funding_stage',
      label: '펀딩 단계',
      type: 'select',
      defaultValue: 'seed',
      required: true,
      validation: {
        options: [
          { label: '프리시드', value: 'pre-seed' },
          { label: '시드', value: 'seed' },
          { label: 'Series A', value: 'series-a' },
          { label: 'Series B', value: 'series-b' },
          { label: 'Series C+', value: 'series-c' },
          { label: 'IPO 준비', value: 'pre-ipo' }
        ]
      }
    },
    {
      key: 'primary_business_model',
      label: '주요 비즈니스 모델',
      type: 'select',
      defaultValue: 'saas',
      required: true,
      validation: {
        options: [
          { label: 'SaaS', value: 'saas' },
          { label: '이커머스', value: 'ecommerce' },
          { label: '마켓플레이스', value: 'marketplace' },
          { label: '플랫폼', value: 'platform' },
          { label: '하드웨어', value: 'hardware' },
          { label: '기타', value: 'other' }
        ]
      }
    },
    {
      key: 'target_metrics',
      label: '중점 추적 지표',
      type: 'multiselect',
      defaultValue: ['mrr', 'cac', 'ltv', 'burn_rate'],
      required: true,
      validation: {
        options: [
          { label: 'MRR (월 반복 매출)', value: 'mrr' },
          { label: 'ARR (연 반복 매출)', value: 'arr' },
          { label: 'CAC (고객 획득 비용)', value: 'cac' },
          { label: 'LTV (고객 생애 가치)', value: 'ltv' },
          { label: 'Burn Rate (소진율)', value: 'burn_rate' },
          { label: 'Runway (운영 가능 기간)', value: 'runway' },
          { label: 'Churn Rate (이탈률)', value: 'churn_rate' },
          { label: 'NPS (순추천지수)', value: 'nps' },
          { label: 'DAU/MAU', value: 'dau_mau' },
          { label: '펀딩 현황', value: 'funding' }
        ]
      }
    },
    {
      key: 'team_size',
      label: '팀 규모',
      type: 'number',
      defaultValue: 10,
      required: true,
      validation: {
        min: 1,
        max: 10000
      }
    },
    {
      key: 'launch_date',
      label: '서비스 출시일',
      type: 'date',
      defaultValue: '${current_date}',
      required: false,
      description: '서비스가 처음 출시된 날짜'
    },
    {
      key: 'show_investor_view',
      label: '투자자 뷰 포함',
      type: 'boolean',
      defaultValue: false,
      required: false,
      description: '투자자용 별도 지표 섹션을 포함할지 여부'
    },
    {
      key: 'refresh_interval',
      label: '데이터 새로고침 주기 (분)',
      type: 'number',
      defaultValue: 15,
      required: false,
      validation: {
        min: 1,
        max: 1440
      }
    },
    {
      key: 'alert_thresholds',
      label: '알림 임계값 설정',
      type: 'object',
      defaultValue: {
        burn_rate_warning: 80,
        churn_rate_critical: 10,
        cac_ltv_ratio_min: 3
      },
      required: false,
      description: '각종 지표의 알림 임계값 (JSON 형식)'
    }
  ],
  layout: {
    base: {
      id: 'startup-dashboard-layout',
      name: '{{company_name}} 성장 대시보드',
      description: '{{company_name}}의 핵심 성장 지표 모니터링',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false,
      layouts: {
        lg: [],
        md: [],
        sm: [],
        xs: [],
        xxs: []
      },
      widgets: {}
    },
    conditionalLayouts: [
      {
        condition: 'show_investor_view === true',
        layout: {
          name: '{{company_name}} 투자자 대시보드',
          description: '투자자를 위한 {{company_name}} 핵심 지표'
        }
      }
    ]
  },
  widgets: [
    // KPI 개요 위젯
    {
      id: 'startup-kpi-overview',
      config: {
        id: 'kpi-overview-widget',
        type: 'kpi-radar',
        title: '핵심 KPI 개요',
        description: '{{company_name}}의 5대 핵심 지표',
        icon: '📊',
        category: 'analytics',
        refreshInterval: '{{refresh_interval * 60000}}',
        settings: {
          axes: [
            { label: '성장률', field: 'growth_rate', max: 100 },
            { label: '수익성', field: 'profitability', max: 100 },
            { label: '고객만족', field: 'customer_satisfaction', max: 100 },
            { label: '팀효율성', field: 'team_efficiency', max: 100 },
            { label: '시장적합성', field: 'product_market_fit', max: 100 }
          ],
          showAnimation: true,
          colorScheme: 'startup'
        }
      },
      positioning: {
        gridItem: {
          i: 'startup-kpi-overview',
          x: 0,
          y: 0,
          w: 6,
          h: 5,
          minW: 4,
          minH: 4
        }
      }
    },
    // 매출 트렌드 위젯
    {
      id: 'revenue-trend',
      config: {
        id: 'revenue-trend-widget',
        type: 'score-trend',
        title: 'MRR/ARR 트렌드',
        description: '월간/연간 반복 매출 추이',
        icon: '💰',
        category: 'finance',
        refreshInterval: '{{refresh_interval * 60000}}',
        settings: {
          metrics: [
            {
              key: 'mrr',
              label: 'MRR',
              color: '#4F46E5',
              format: 'currency'
            },
            {
              key: 'arr',
              label: 'ARR',
              color: '#059669',
              format: 'currency'
            }
          ],
          period: 'monthly',
          showGoals: true,
          goalLine: true
        }
      },
      positioning: {
        gridItem: {
          i: 'revenue-trend',
          x: 6,
          y: 0,
          w: 6,
          h: 5,
          minW: 4,
          minH: 4
        }
      }
    },
    // 고객 지표 위젯
    {
      id: 'customer-metrics',
      config: {
        id: 'customer-metrics-widget',
        type: 'goal-tracker',
        title: '고객 지표',
        description: 'CAC, LTV, Churn Rate 추적',
        icon: '👥',
        category: 'customer',
        refreshInterval: '{{refresh_interval * 60000}}',
        settings: {
          goals: [
            {
              label: 'CAC (고객 획득 비용)',
              current: 'data.cac.current',
              target: 'data.cac.target',
              format: 'currency',
              trend: 'lower_is_better'
            },
            {
              label: 'LTV (고객 생애 가치)',
              current: 'data.ltv.current',
              target: 'data.ltv.target',
              format: 'currency',
              trend: 'higher_is_better'
            },
            {
              label: 'LTV/CAC 비율',
              current: 'data.ltv_cac_ratio.current',
              target: 3,
              format: 'ratio',
              trend: 'higher_is_better'
            },
            {
              label: 'Churn Rate (%)',
              current: 'data.churn_rate.current',
              target: 'data.churn_rate.target',
              format: 'percentage',
              trend: 'lower_is_better'
            }
          ]
        }
      },
      positioning: {
        gridItem: {
          i: 'customer-metrics',
          x: 0,
          y: 5,
          w: 8,
          h: 4,
          minW: 6,
          minH: 3
        }
      }
    },
    // 현금흐름 위젯
    {
      id: 'cash-flow',
      config: {
        id: 'cash-flow-widget',
        type: 'cash-flow',
        title: '현금흐름 & Runway',
        description: '번 레이트와 운영 가능 기간',
        icon: '🏦',
        category: 'finance',
        refreshInterval: '{{refresh_interval * 60000}}',
        settings: {
          showBurnRate: true,
          showRunway: true,
          showForecast: true,
          warningThreshold: '{{alert_thresholds.burn_rate_warning}}',
          criticalThreshold: 90
        }
      },
      positioning: {
        gridItem: {
          i: 'cash-flow',
          x: 8,
          y: 5,
          w: 4,
          h: 4,
          minW: 3,
          minH: 3
        }
      }
    },
    // 팀 성과 위젯
    {
      id: 'team-performance',
      config: {
        id: 'team-performance-widget',
        type: 'team-performance',
        title: '팀 성과',
        description: '{{team_size}}명 팀의 생산성 지표',
        icon: '🚀',
        category: 'team',
        refreshInterval: '{{refresh_interval * 60000}}',
        settings: {
          teamSize: '{{team_size}}',
          metrics: [
            'velocity',
            'quality',
            'collaboration',
            'innovation'
          ],
          showIndividualStats: false
        }
      },
      positioning: {
        gridItem: {
          i: 'team-performance',
          x: 0,
          y: 9,
          w: 6,
          h: 4,
          minW: 4,
          minH: 3
        }
      }
    },
    // 투자자 뷰 (조건부)
    {
      id: 'investor-metrics',
      config: {
        id: 'investor-metrics-widget',
        type: 'investor-dashboard',
        title: '투자자 지표',
        description: '투자자를 위한 핵심 성과 지표',
        icon: '📈',
        category: 'investor',
        refreshInterval: '{{refresh_interval * 60000}}',
        settings: {
          fundingStage: '{{funding_stage}}',
          businessModel: '{{primary_business_model}}',
          showValuation: true,
          showTraction: true,
          showFinancials: true
        }
      },
      positioning: {
        gridItem: {
          i: 'investor-metrics',
          x: 6,
          y: 9,
          w: 6,
          h: 4,
          minW: 4,
          minH: 3
        },
        conditional: 'show_investor_view === true'
      }
    },
    // 성장 예측 위젯
    {
      id: 'growth-forecast',
      config: {
        id: 'growth-forecast-widget',
        type: 'prediction',
        title: '성장 예측',
        description: '향후 6개월 성장 전망',
        icon: '🔮',
        category: 'analytics',
        refreshInterval: '{{refresh_interval * 60000}}',
        settings: {
          forecastPeriod: 6,
          metrics: '{{target_metrics}}',
          confidenceInterval: 0.95,
          scenarioAnalysis: true
        }
      },
      positioning: {
        gridItem: {
          i: 'growth-forecast',
          x: 0,
          y: 13,
          w: 12,
          h: 5,
          minW: 8,
          minH: 4
        }
      }
    },
    // 알림 위젯
    {
      id: 'startup-alerts',
      config: {
        id: 'startup-alerts-widget',
        type: 'notifications',
        title: '스타트업 알림',
        description: '중요 지표 및 이벤트 알림',
        icon: '🔔',
        category: 'alerts',
        refreshInterval: 60000,
        settings: {
          alertTypes: [
            'funding_milestone',
            'revenue_target',
            'burn_rate_warning',
            'churn_spike',
            'growth_acceleration'
          ],
          maxNotifications: 10,
          autoArchive: true
        }
      },
      positioning: {
        gridItem: {
          i: 'startup-alerts',
          x: 9,
          y: 13,
          w: 3,
          h: 5,
          minW: 2,
          minH: 3
        }
      }
    }
  ],
  styling: {
    theme: 'startup',
    customCSS: `
      .startup-dashboard {
        --primary-color: #4F46E5;
        --secondary-color: #059669;
        --accent-color: #F59E0B;
        --background-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .widget-header {
        background: var(--primary-color);
        color: white;
        font-weight: 600;
      }

      .kpi-card {
        border-left: 4px solid var(--primary-color);
        transition: transform 0.2s ease;
      }

      .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
      }

      .growth-positive {
        color: var(--secondary-color);
      }

      .growth-negative {
        color: #EF4444;
      }

      .funding-badge {
        background: var(--accent-color);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 500;
      }
    `,
    responsiveBreakpoints: {
      desktop: { minWidth: 1200, cols: 12 },
      tablet: { minWidth: 768, cols: 8 },
      mobile: { minWidth: 320, cols: 4 }
    }
  },
  dataSources: [
    {
      id: 'startup-analytics',
      name: '스타트업 분석 데이터',
      type: 'rest',
      config: {
        endpoint: '/api/startup/analytics',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer {{api_token}}'
        },
        polling: {
          enabled: true,
          interval: '{{refresh_interval * 60000}}'
        }
      },
      sampleData: {
        growth_rate: 15.2,
        profitability: 25.8,
        customer_satisfaction: 87.3,
        team_efficiency: 92.1,
        product_market_fit: 78.6,
        mrr: 45000,
        arr: 540000,
        cac: {
          current: 120,
          target: 100
        },
        ltv: {
          current: 480,
          target: 500
        },
        ltv_cac_ratio: {
          current: 4.0
        },
        churn_rate: {
          current: 3.2,
          target: 5.0
        },
        burn_rate: 75000,
        runway_months: 18
      }
    },
    {
      id: 'funding-data',
      name: '펀딩 데이터',
      type: 'rest',
      config: {
        endpoint: '/api/startup/funding',
        method: 'GET'
      },
      sampleData: {
        current_stage: '{{funding_stage}}',
        total_raised: 2500000,
        last_round: {
          amount: 1000000,
          date: '2024-01-15',
          investors: ['VC A', 'Angel B']
        },
        next_milestone: 5000000
      }
    }
  ],
  automation: {
    onLoad: [
      'validateBusinessModel',
      'loadIndustryBenchmarks',
      'setupAlertRules'
    ],
    onDataUpdate: [
      'calculateKPIs',
      'checkAlertThresholds',
      'updateForecasts'
    ],
    schedules: [
      {
        cron: '0 9 * * 1', // 매주 월요일 오전 9시
        action: 'generateWeeklyReport'
      },
      {
        cron: '0 0 1 * *', // 매월 1일 자정
        action: 'generateMonthlyInvestorUpdate'
      }
    ]
  },
  localization: {
    ko: {
      'growth_rate': '성장률',
      'profitability': '수익성',
      'customer_satisfaction': '고객만족',
      'team_efficiency': '팀효율성',
      'product_market_fit': '시장적합성',
      'monthly_revenue': '월 매출',
      'customer_acquisition': '고객 획득',
      'burn_rate': '소진율',
      'runway': '운영 가능 기간'
    },
    en: {
      'growth_rate': 'Growth Rate',
      'profitability': 'Profitability',
      'customer_satisfaction': 'Customer Satisfaction',
      'team_efficiency': 'Team Efficiency',
      'product_market_fit': 'Product-Market Fit',
      'monthly_revenue': 'Monthly Revenue',
      'customer_acquisition': 'Customer Acquisition',
      'burn_rate': 'Burn Rate',
      'runway': 'Runway'
    }
  }
};