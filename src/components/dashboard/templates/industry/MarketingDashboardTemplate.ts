import { DashboardTemplate } from '../types/TemplateTypes';

export const marketingDashboardTemplate: DashboardTemplate = {
  metadata: {
    id: 'marketing-performance-dashboard',
    name: '마케팅 성과 대시보드',
    description: '디지털 마케팅 캠페인, ROI, 고객 획득 비용, 전환율을 종합적으로 분석하는 전문 대시보드',
    category: 'marketing',
    industry: ['marketing', 'ecommerce', 'saas', 'retail', 'fintech'],
    tags: ['marketing', 'campaigns', 'roi', 'conversion', 'analytics', 'customer-acquisition'],
    version: '1.0.0',
    author: 'PocketBiz Platform',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    compatibility: {
      minVersion: '1.0.0',
      maxVersion: '2.0.0'
    },
    locales: ['ko', 'en'],
    preview: {
      thumbnail: '/templates/previews/marketing-dashboard.png',
      description: '마케팅 ROI, 고객 획득 비용, 캠페인 성과, 전환 퍼널을 실시간으로 모니터링',
      features: [
        '실시간 마케팅 ROI 추적',
        '고객 획득 비용(CAC) 분석',
        '캠페인별 성과 비교',
        '전환 퍼널 최적화',
        '채널별 성과 분석'
      ]
    }
  },

  variables: [
    {
      id: 'companyName',
      name: '회사명',
      type: 'string',
      defaultValue: 'Your Company',
      required: true,
      description: '마케팅 대시보드를 사용할 회사명',
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: 'primaryGoal',
      name: '주요 마케팅 목표',
      type: 'select',
      defaultValue: 'lead-generation',
      required: true,
      description: '이번 분기 주요 마케팅 목표',
      options: [
        { value: 'lead-generation', label: '리드 생성' },
        { value: 'brand-awareness', label: '브랜드 인지도' },
        { value: 'customer-acquisition', label: '고객 획득' },
        { value: 'revenue-growth', label: '매출 증대' },
        { value: 'retention', label: '고객 유지' }
      ]
    },
    {
      id: 'monthlyBudget',
      name: '월 마케팅 예산',
      type: 'number',
      defaultValue: 50000000,
      required: true,
      description: '월별 마케팅 예산 (원)',
      validation: {
        min: 1000000,
        max: 1000000000
      }
    },
    {
      id: 'targetCAC',
      name: '목표 고객획득비용',
      type: 'number',
      defaultValue: 100000,
      required: true,
      description: '목표 고객 획득 비용 (원)',
      validation: {
        min: 1000,
        max: 10000000
      }
    },
    {
      id: 'analyticsIntegration',
      name: '분석 도구 연동',
      type: 'select',
      defaultValue: 'google-analytics',
      required: false,
      description: '연동할 웹 분석 도구',
      options: [
        { value: 'google-analytics', label: 'Google Analytics' },
        { value: 'adobe-analytics', label: 'Adobe Analytics' },
        { value: 'mixpanel', label: 'Mixpanel' },
        { value: 'amplitude', label: 'Amplitude' }
      ]
    },
    {
      id: 'adPlatforms',
      name: '광고 플랫폼',
      type: 'multiselect',
      defaultValue: ['google-ads', 'facebook-ads'],
      required: false,
      description: '사용 중인 광고 플랫폼들',
      options: [
        { value: 'google-ads', label: 'Google Ads' },
        { value: 'facebook-ads', label: 'Facebook Ads' },
        { value: 'instagram-ads', label: 'Instagram Ads' },
        { value: 'linkedin-ads', label: 'LinkedIn Ads' },
        { value: 'twitter-ads', label: 'Twitter Ads' },
        { value: 'youtube-ads', label: 'YouTube Ads' },
        { value: 'naver-ads', label: 'Naver Ads' },
        { value: 'kakao-ads', label: 'Kakao Ads' }
      ]
    },
    {
      id: 'conversionGoals',
      name: '전환 목표',
      type: 'object',
      defaultValue: {
        signups: 1000,
        purchases: 100,
        downloads: 500
      },
      required: false,
      description: '월별 전환 목표 설정'
    },
    {
      id: 'enableAttribution',
      name: '어트리뷰션 분석',
      type: 'boolean',
      defaultValue: true,
      required: false,
      description: '멀티터치 어트리뷰션 분석 활성화'
    },
    {
      id: 'reportingFrequency',
      name: '리포팅 주기',
      type: 'select',
      defaultValue: 'daily',
      required: false,
      description: '마케팅 성과 리포팅 주기',
      options: [
        { value: 'realtime', label: '실시간' },
        { value: 'hourly', label: '시간별' },
        { value: 'daily', label: '일별' },
        { value: 'weekly', label: '주별' }
      ]
    }
  ],

  layout: {
    type: 'grid',
    columns: 12,
    rows: 'auto',
    gap: 16,
    responsive: {
      xs: { columns: 1 },
      sm: { columns: 2 },
      md: { columns: 3 },
      lg: { columns: 4 },
      xl: { columns: 6 }
    }
  },

  widgets: [
    {
      id: 'marketing-kpi-overview',
      type: 'KPIOverview',
      position: { x: 0, y: 0, w: 12, h: 2 },
      title: '{{companyName}} 마케팅 KPI',
      config: {
        metrics: [
          {
            key: 'roi',
            label: 'Marketing ROI',
            value: '{{data.marketing.roi}}',
            target: 300,
            format: 'percentage',
            trend: '{{data.marketing.roiTrend}}',
            color: 'success'
          },
          {
            key: 'cac',
            label: '고객획득비용',
            value: '{{data.marketing.cac}}',
            target: '{{targetCAC}}',
            format: 'currency',
            trend: '{{data.marketing.cacTrend}}',
            color: 'primary'
          },
          {
            key: 'conversion',
            label: '전환율',
            value: '{{data.marketing.conversionRate}}',
            target: 5,
            format: 'percentage',
            trend: '{{data.marketing.conversionTrend}}',
            color: 'info'
          },
          {
            key: 'ltv',
            label: '고객생애가치',
            value: '{{data.marketing.ltv}}',
            format: 'currency',
            trend: '{{data.marketing.ltvTrend}}',
            color: 'warning'
          }
        ],
        layout: 'horizontal',
        showTrends: true,
        showTargets: true
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/marketing/kpi',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          company: '{{companyName}}',
          period: '30d',
          goal: '{{primaryGoal}}'
        },
        cache: {
          ttl: 600,
          key: 'marketing-kpi-{{companyName}}'
        }
      }
    },

    {
      id: 'campaign-performance',
      type: 'CampaignTable',
      position: { x: 0, y: 2, w: 8, h: 5 },
      title: '캠페인 성과',
      config: {
        columns: [
          { key: 'name', label: '캠페인명', sortable: true },
          { key: 'platform', label: '플랫폼', sortable: true },
          { key: 'impressions', label: '노출수', format: 'number', sortable: true },
          { key: 'clicks', label: '클릭수', format: 'number', sortable: true },
          { key: 'ctr', label: 'CTR', format: 'percentage', sortable: true },
          { key: 'spend', label: '지출', format: 'currency', sortable: true },
          { key: 'conversions', label: '전환', format: 'number', sortable: true },
          { key: 'roi', label: 'ROI', format: 'percentage', sortable: true, highlight: true }
        ],
        pagination: true,
        pageSize: 10,
        sortBy: 'roi',
        sortOrder: 'desc',
        showFilters: true,
        filterBy: ['platform', 'status'],
        statusIndicator: {
          active: '#4caf50',
          paused: '#ff9800',
          ended: '#9e9e9e'
        }
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/marketing/campaigns',
        method: 'GET',
        params: {
          company: '{{companyName}}',
          platforms: '{{adPlatforms}}',
          period: '30d',
          status: 'active'
        },
        cache: {
          ttl: 900,
          key: 'campaigns-{{companyName}}'
        }
      }
    },

    {
      id: 'budget-utilization',
      type: 'ProgressGauge',
      position: { x: 8, y: 2, w: 4, h: 5 },
      title: '예산 사용률',
      config: {
        value: '{{data.budget.used}}',
        max: '{{monthlyBudget}}',
        format: 'currency',
        showPercentage: true,
        showRemaining: true,
        thresholds: [
          { value: 70, color: '#4caf50', label: '안전' },
          { value: 85, color: '#ff9800', label: '주의' },
          { value: 100, color: '#f44336', label: '초과' }
        ],
        trend: {
          show: true,
          period: '7d',
          prediction: true
        }
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/marketing/budget',
        method: 'GET',
        params: {
          company: '{{companyName}}',
          month: new Date().toISOString().slice(0, 7)
        },
        cache: {
          ttl: 1800,
          key: 'budget-{{companyName}}'
        }
      }
    },

    {
      id: 'conversion-funnel',
      type: 'FunnelChart',
      position: { x: 0, y: 7, w: 6, h: 4 },
      title: '전환 퍼널',
      config: {
        stages: [
          { name: '방문자', key: 'visitors', color: '#e3f2fd' },
          { name: '랜딩페이지 조회', key: 'landingViews', color: '#bbdefb' },
          { name: '제품 조회', key: 'productViews', color: '#90caf9' },
          { name: '장바구니 추가', key: 'cartAdds', color: '#64b5f6' },
          { name: '결제 시작', key: 'checkoutStarts', color: '#42a5f5' },
          { name: '구매 완료', key: 'purchases', color: '#2196f3' }
        ],
        showConversionRates: true,
        showDropoffRates: true,
        highlightBottlenecks: true,
        animation: true
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/marketing/funnel',
        method: 'GET',
        params: {
          company: '{{companyName}}',
          period: '30d',
          source: '{{analyticsIntegration}}'
        },
        cache: {
          ttl: 1800,
          key: 'funnel-{{companyName}}'
        }
      }
    },

    {
      id: 'channel-performance',
      type: 'DonutChart',
      position: { x: 6, y: 7, w: 6, h: 4 },
      title: '채널별 성과',
      config: {
        metric: 'revenue',
        showLegend: true,
        showValues: true,
        showPercentages: true,
        colors: [
          '#2196f3', '#4caf50', '#ff9800', '#f44336',
          '#9c27b0', '#00bcd4', '#cddc39', '#607d8b'
        ],
        innerRadius: 40,
        labelType: 'channel'
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/marketing/channels',
        method: 'GET',
        params: {
          company: '{{companyName}}',
          period: '30d',
          metric: 'revenue'
        },
        cache: {
          ttl: 1800,
          key: 'channels-{{companyName}}'
        }
      }
    },

    {
      id: 'attribution-analysis',
      type: 'AttributionChart',
      position: { x: 0, y: 11, w: 12, h: 4 },
      title: '어트리뷰션 분석',
      condition: '{{enableAttribution}}',
      config: {
        models: [
          { name: 'First Touch', key: 'firstTouch' },
          { name: 'Last Touch', key: 'lastTouch' },
          { name: 'Linear', key: 'linear' },
          { name: 'Time Decay', key: 'timeDecay' },
          { name: 'Position Based', key: 'positionBased' }
        ],
        defaultModel: 'linear',
        showComparison: true,
        channels: '{{adPlatforms}}',
        timeWindow: 30
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/marketing/attribution',
        method: 'GET',
        params: {
          company: '{{companyName}}',
          period: '30d',
          channels: '{{adPlatforms}}'
        },
        cache: {
          ttl: 3600,
          key: 'attribution-{{companyName}}'
        }
      }
    },

    {
      id: 'audience-insights',
      type: 'AudienceWidget',
      position: { x: 0, y: 15, w: 6, h: 4 },
      title: '타겟 오디언스 인사이트',
      config: {
        dimensions: [
          { key: 'age', label: '연령대', type: 'bar' },
          { key: 'gender', label: '성별', type: 'pie' },
          { key: 'location', label: '지역', type: 'map' },
          { key: 'interests', label: '관심사', type: 'wordcloud' },
          { key: 'devices', label: '기기', type: 'donut' }
        ],
        defaultDimension: 'age',
        showSegments: true,
        interactionEnabled: true
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/marketing/audience',
        method: 'GET',
        params: {
          company: '{{companyName}}',
          period: '30d',
          source: '{{analyticsIntegration}}'
        },
        cache: {
          ttl: 7200,
          key: 'audience-{{companyName}}'
        }
      }
    },

    {
      id: 'ab-testing-results',
      type: 'ABTestWidget',
      position: { x: 6, y: 15, w: 6, h: 4 },
      title: 'A/B 테스트 결과',
      config: {
        tests: [
          {
            name: '랜딩페이지 헤드라인',
            variants: ['기존', '신규'],
            metric: 'conversion_rate',
            status: 'running'
          },
          {
            name: 'CTA 버튼 색상',
            variants: ['파란색', '주황색'],
            metric: 'click_rate',
            status: 'completed'
          }
        ],
        showSignificance: true,
        showConfidenceInterval: true,
        confidenceLevel: 95
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/marketing/ab-tests',
        method: 'GET',
        params: {
          company: '{{companyName}}',
          status: 'all'
        },
        cache: {
          ttl: 1800,
          key: 'abtests-{{companyName}}'
        }
      }
    },

    {
      id: 'competitor-analysis',
      type: 'CompetitorWidget',
      position: { x: 0, y: 19, w: 8, h: 3 },
      title: '경쟁사 분석',
      config: {
        competitors: [
          { name: '경쟁사 A', domain: 'competitor-a.com' },
          { name: '경쟁사 B', domain: 'competitor-b.com' },
          { name: '경쟁사 C', domain: 'competitor-c.com' }
        ],
        metrics: [
          { key: 'traffic', label: '트래픽 점유율' },
          { key: 'keywords', label: '키워드 순위' },
          { key: 'adSpend', label: '광고 지출 추정' },
          { key: 'socialEngagement', label: '소셜 참여도' }
        ],
        benchmarkMode: true
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/marketing/competitors',
        method: 'GET',
        params: {
          company: '{{companyName}}',
          period: '30d'
        },
        cache: {
          ttl: 86400,
          key: 'competitors-{{companyName}}'
        }
      }
    },

    {
      id: 'marketing-alerts',
      type: 'AlertsWidget',
      position: { x: 8, y: 19, w: 4, h: 3 },
      title: '마케팅 알림',
      config: {
        alertTypes: [
          {
            type: 'budget-threshold',
            label: '예산 임계값',
            severity: 'warning',
            threshold: 80
          },
          {
            type: 'cac-increase',
            label: 'CAC 증가',
            severity: 'error',
            threshold: 20
          },
          {
            type: 'conversion-drop',
            label: '전환율 하락',
            severity: 'warning',
            threshold: 15
          }
        ],
        maxAlerts: 10,
        showTimestamp: true,
        autoRefresh: true
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/marketing/alerts',
        method: 'GET',
        params: {
          company: '{{companyName}}',
          period: '7d'
        },
        cache: {
          ttl: 300,
          key: 'alerts-{{companyName}}'
        }
      }
    }
  ],

  styling: {
    theme: 'marketing',
    colors: {
      primary: '#e91e63',
      secondary: '#673ab7',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    typography: {
      fontFamily: 'Inter, Arial, sans-serif',
      sizes: {
        title: '1.5rem',
        subtitle: '1.2rem',
        body: '0.875rem',
        caption: '0.75rem'
      }
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24
    },
    borderRadius: 12,
    shadows: {
      card: '0 2px 12px rgba(233,30,99,0.1)',
      hover: '0 4px 20px rgba(233,30,99,0.15)'
    }
  },

  automation: {
    rules: [
      {
        id: 'budget-alert',
        name: '예산 사용률 경고',
        trigger: {
          type: 'data-threshold',
          condition: 'data.budget.usedPercentage > 80'
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '예산 사용률 80% 초과',
              message: '이번 달 마케팅 예산의 {{data.budget.usedPercentage}}%를 사용했습니다.',
              severity: 'warning'
            }
          },
          {
            type: 'email',
            config: {
              to: ['marketing-manager@company.com'],
              subject: '마케팅 예산 알림',
              template: 'budget-warning'
            }
          }
        ]
      },
      {
        id: 'cac-spike-alert',
        name: 'CAC 급증 알림',
        trigger: {
          type: 'data-change',
          condition: 'data.marketing.cac > targetCAC * 1.5'
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: 'CAC 급증 감지',
              message: '고객 획득 비용이 목표 대비 50% 이상 증가했습니다.',
              severity: 'error'
            }
          }
        ]
      },
      {
        id: 'conversion-optimization',
        name: '전환율 최적화 제안',
        trigger: {
          type: 'schedule',
          cron: '0 10 * * 1'
        },
        actions: [
          {
            type: 'ai-analysis',
            config: {
              type: 'conversion-optimization',
              period: '7d'
            }
          }
        ]
      }
    ],
    schedules: [
      {
        id: 'daily-performance-report',
        name: '일일 성과 리포트',
        cron: '0 9 * * *',
        action: {
          type: 'generate-report',
          config: {
            template: 'daily-marketing-summary',
            recipients: ['marketing-team@company.com'],
            format: 'email'
          }
        }
      },
      {
        id: 'weekly-roi-analysis',
        name: '주간 ROI 분석',
        cron: '0 10 * * 1',
        action: {
          type: 'generate-report',
          config: {
            template: 'weekly-roi-analysis',
            recipients: ['cmo@company.com'],
            format: 'pdf'
          }
        }
      }
    ]
  },

  localization: {
    ko: {
      marketingKPI: '마케팅 KPI',
      campaignPerformance: '캠페인 성과',
      budgetUtilization: '예산 사용률',
      conversionFunnel: '전환 퍼널',
      channelPerformance: '채널별 성과',
      attributionAnalysis: '어트리뷰션 분석',
      audienceInsights: '타겟 오디언스 인사이트',
      abTestingResults: 'A/B 테스트 결과',
      competitorAnalysis: '경쟁사 분석',
      marketingAlerts: '마케팅 알림'
    },
    en: {
      marketingKPI: 'Marketing KPI',
      campaignPerformance: 'Campaign Performance',
      budgetUtilization: 'Budget Utilization',
      conversionFunnel: 'Conversion Funnel',
      channelPerformance: 'Channel Performance',
      attributionAnalysis: 'Attribution Analysis',
      audienceInsights: 'Audience Insights',
      abTestingResults: 'A/B Testing Results',
      competitorAnalysis: 'Competitor Analysis',
      marketingAlerts: 'Marketing Alerts'
    }
  },

  validation: {
    rules: [
      {
        field: 'monthlyBudget',
        rule: 'required',
        message: '월 마케팅 예산은 필수 입력 항목입니다.'
      },
      {
        field: 'targetCAC',
        rule: 'required',
        message: '목표 고객 획득 비용을 설정해주세요.'
      },
      {
        field: 'adPlatforms',
        rule: 'minItems',
        params: { min: 1 },
        message: '최소 하나의 광고 플랫폼을 선택해주세요.'
      }
    ]
  }
};