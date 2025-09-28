import { DashboardTemplate } from '../types/TemplateTypes';

export const developmentTeamDashboardTemplate: DashboardTemplate = {
  metadata: {
    id: 'development-team-dashboard',
    name: '개발팀 성과 대시보드',
    description: '개발팀의 생산성, 코드 품질, 프로젝트 진행 상황을 종합적으로 모니터링하는 전문 대시보드',
    category: 'engineering',
    industry: ['software', 'technology', 'saas', 'fintech'],
    tags: ['development', 'engineering', 'productivity', 'code-quality', 'agile'],
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
      thumbnail: '/templates/previews/development-team-dashboard.png',
      description: '개발팀 KPI, 코드 리뷰 현황, 스프린트 진행률, 버그 트래킹을 한눈에 확인',
      features: [
        '실시간 개발 메트릭 모니터링',
        '코드 품질 및 리뷰 현황',
        '스프린트 진행률 추적',
        '팀 생산성 분석',
        '기술 부채 모니터링'
      ]
    }
  },

  variables: [
    {
      id: 'teamName',
      name: '팀 이름',
      type: 'string',
      defaultValue: 'Development Team',
      required: true,
      description: '개발팀 이름',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      id: 'sprintDuration',
      name: '스프린트 기간 (주)',
      type: 'number',
      defaultValue: 2,
      required: true,
      description: '스프린트 주기 설정',
      validation: {
        min: 1,
        max: 4
      }
    },
    {
      id: 'repositoryIntegration',
      name: '리포지토리 연동',
      type: 'select',
      defaultValue: 'github',
      required: false,
      description: '소스 코드 리포지토리 플랫폼',
      options: [
        { value: 'github', label: 'GitHub' },
        { value: 'gitlab', label: 'GitLab' },
        { value: 'bitbucket', label: 'Bitbucket' },
        { value: 'azure', label: 'Azure DevOps' }
      ]
    },
    {
      id: 'jiraIntegration',
      name: 'JIRA 연동',
      type: 'boolean',
      defaultValue: false,
      required: false,
      description: 'JIRA 프로젝트 관리 도구 연동 여부'
    },
    {
      id: 'codeQualityThreshold',
      name: '코드 품질 임계값',
      type: 'number',
      defaultValue: 80,
      required: false,
      description: '코드 품질 점수 임계값 (%)',
      validation: {
        min: 50,
        max: 100
      }
    },
    {
      id: 'teamSize',
      name: '팀 규모',
      type: 'number',
      defaultValue: 5,
      required: true,
      description: '개발팀 구성원 수',
      validation: {
        min: 1,
        max: 50
      }
    },
    {
      id: 'enableMetrics',
      name: '고급 메트릭 활성화',
      type: 'boolean',
      defaultValue: true,
      required: false,
      description: '고급 개발 메트릭 (DORA 지표 등) 활성화'
    },
    {
      id: 'alertThreshold',
      name: '알림 임계값',
      type: 'object',
      defaultValue: {
        bugCount: 10,
        codeReviewDelay: 24,
        deploymentFailure: 5
      },
      required: false,
      description: '각종 알림 발생 임계값 설정'
    },
    {
      id: 'refreshInterval',
      name: '데이터 갱신 주기',
      type: 'select',
      defaultValue: '15m',
      required: false,
      description: '대시보드 데이터 자동 갱신 주기',
      options: [
        { value: '5m', label: '5분' },
        { value: '15m', label: '15분' },
        { value: '30m', label: '30분' },
        { value: '1h', label: '1시간' }
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
      id: 'team-kpi-overview',
      type: 'KPIOverview',
      position: { x: 0, y: 0, w: 12, h: 2 },
      title: '{{teamName}} KPI 개요',
      config: {
        metrics: [
          {
            key: 'velocity',
            label: '팀 벨로시티',
            value: '{{data.currentSprint.velocity}}',
            target: '{{data.targetVelocity}}',
            format: 'number',
            trend: '{{data.velocityTrend}}',
            color: 'primary'
          },
          {
            key: 'codeQuality',
            label: '코드 품질',
            value: '{{data.codeQuality.score}}',
            target: '{{codeQualityThreshold}}',
            format: 'percentage',
            trend: '{{data.codeQuality.trend}}',
            color: 'success'
          },
          {
            key: 'deploymentFreq',
            label: '배포 빈도',
            value: '{{data.deployment.frequency}}',
            format: 'number',
            suffix: '/week',
            trend: '{{data.deployment.trend}}',
            color: 'info'
          },
          {
            key: 'bugCount',
            label: '활성 버그',
            value: '{{data.bugs.active}}',
            format: 'number',
            trend: '{{data.bugs.trend}}',
            color: 'warning',
            alert: '{{data.bugs.active > alertThreshold.bugCount}}'
          }
        ],
        layout: 'horizontal',
        showTrends: true,
        showTargets: true
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/development/kpi',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          team: '{{teamName}}',
          period: '{{sprintDuration}}w'
        },
        cache: {
          ttl: 300,
          key: 'dev-kpi-{{teamName}}'
        }
      }
    },

    {
      id: 'sprint-progress',
      type: 'ProgressChart',
      position: { x: 0, y: 2, w: 6, h: 4 },
      title: '현재 스프린트 진행률',
      config: {
        chartType: 'burndown',
        showIdealLine: true,
        showActualProgress: true,
        showPrediction: true,
        metrics: {
          totalPoints: '{{data.sprint.totalStoryPoints}}',
          completedPoints: '{{data.sprint.completedStoryPoints}}',
          remainingPoints: '{{data.sprint.remainingStoryPoints}}',
          daysLeft: '{{data.sprint.daysRemaining}}'
        },
        colors: {
          ideal: '#e3f2fd',
          actual: '#2196f3',
          prediction: '#ff9800'
        }
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/development/sprint/current',
        method: 'GET',
        params: {
          team: '{{teamName}}'
        },
        cache: {
          ttl: 900,
          key: 'sprint-progress-{{teamName}}'
        }
      }
    },

    {
      id: 'code-review-status',
      type: 'ListWidget',
      position: { x: 6, y: 2, w: 6, h: 4 },
      title: '코드 리뷰 현황',
      config: {
        itemTemplate: {
          primary: '{{item.title}}',
          secondary: '{{item.author}} • {{item.createdAt}}',
          status: '{{item.status}}',
          priority: '{{item.priority}}'
        },
        statusColors: {
          pending: '#ff9800',
          reviewing: '#2196f3',
          approved: '#4caf50',
          rejected: '#f44336'
        },
        showPagination: true,
        itemsPerPage: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/development/pull-requests',
        method: 'GET',
        params: {
          team: '{{teamName}}',
          status: 'open',
          repository: '{{repositoryIntegration}}'
        },
        cache: {
          ttl: 300,
          key: 'pr-status-{{teamName}}'
        }
      }
    },

    {
      id: 'code-quality-metrics',
      type: 'MetricsChart',
      position: { x: 0, y: 6, w: 8, h: 4 },
      title: '코드 품질 메트릭',
      config: {
        chartType: 'multiline',
        timeRange: '30d',
        metrics: [
          {
            key: 'codeComplexity',
            label: '순환 복잡도',
            color: '#f44336'
          },
          {
            key: 'testCoverage',
            label: '테스트 커버리지',
            color: '#4caf50'
          },
          {
            key: 'duplicateCode',
            label: '중복 코드율',
            color: '#ff9800'
          },
          {
            key: 'technicalDebt',
            label: '기술 부채',
            color: '#9c27b0'
          }
        ],
        yAxis: {
          min: 0,
          max: 100,
          format: 'percentage'
        },
        showLegend: true,
        showDataPoints: true
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/development/code-quality',
        method: 'GET',
        params: {
          team: '{{teamName}}',
          period: '30d',
          repository: '{{repositoryIntegration}}'
        },
        cache: {
          ttl: 1800,
          key: 'code-quality-{{teamName}}'
        }
      }
    },

    {
      id: 'team-performance',
      type: 'BarChart',
      position: { x: 8, y: 6, w: 4, h: 4 },
      title: '팀원별 기여도',
      config: {
        orientation: 'horizontal',
        showValues: true,
        sortBy: 'value',
        sortOrder: 'desc',
        metrics: {
          commits: '커밋 수',
          linesAdded: '추가된 라인',
          linesDeleted: '삭제된 라인',
          pullRequests: 'PR 수'
        },
        colors: ['#2196f3', '#4caf50', '#ff9800', '#9c27b0']
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/development/team-stats',
        method: 'GET',
        params: {
          team: '{{teamName}}',
          period: '{{sprintDuration}}w'
        },
        cache: {
          ttl: 3600,
          key: 'team-performance-{{teamName}}'
        }
      }
    },

    {
      id: 'deployment-pipeline',
      type: 'PipelineWidget',
      position: { x: 0, y: 10, w: 6, h: 3 },
      title: 'CI/CD 파이프라인',
      config: {
        stages: [
          { name: 'Build', status: '{{data.pipeline.build.status}}' },
          { name: 'Test', status: '{{data.pipeline.test.status}}' },
          { name: 'Deploy', status: '{{data.pipeline.deploy.status}}' }
        ],
        showDuration: true,
        showLogs: true,
        autoRefresh: true
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/development/pipeline/latest',
        method: 'GET',
        params: {
          team: '{{teamName}}',
          repository: '{{repositoryIntegration}}'
        },
        cache: {
          ttl: 60,
          key: 'pipeline-{{teamName}}'
        }
      }
    },

    {
      id: 'bug-tracking',
      type: 'StatusBoard',
      position: { x: 6, y: 10, w: 6, h: 3 },
      title: '버그 트래킹',
      config: {
        categories: [
          {
            label: 'Critical',
            count: '{{data.bugs.critical}}',
            color: '#f44336',
            threshold: 0
          },
          {
            label: 'High',
            count: '{{data.bugs.high}}',
            color: '#ff9800',
            threshold: 2
          },
          {
            label: 'Medium',
            count: '{{data.bugs.medium}}',
            color: '#ffeb3b',
            threshold: 5
          },
          {
            label: 'Low',
            count: '{{data.bugs.low}}',
            color: '#4caf50',
            threshold: 10
          }
        ],
        showTrends: true,
        alertOnThreshold: true
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/development/bugs',
        method: 'GET',
        params: {
          team: '{{teamName}}',
          status: 'open',
          integration: '{{jiraIntegration ? "jira" : "github"}}'
        },
        cache: {
          ttl: 600,
          key: 'bugs-{{teamName}}'
        }
      }
    },

    {
      id: 'dora-metrics',
      type: 'DORAMetrics',
      position: { x: 0, y: 13, w: 12, h: 4 },
      title: 'DORA 지표',
      condition: '{{enableMetrics}}',
      config: {
        metrics: [
          {
            name: 'deploymentFrequency',
            label: '배포 빈도',
            value: '{{data.dora.deploymentFrequency}}',
            target: 'Daily',
            status: '{{data.dora.deploymentFrequency.status}}'
          },
          {
            name: 'leadTime',
            label: 'Lead Time for Changes',
            value: '{{data.dora.leadTime}}',
            target: '< 1 day',
            status: '{{data.dora.leadTime.status}}'
          },
          {
            name: 'mttr',
            label: 'Mean Time to Recovery',
            value: '{{data.dora.mttr}}',
            target: '< 1 hour',
            status: '{{data.dora.mttr.status}}'
          },
          {
            name: 'changeFailure',
            label: 'Change Failure Rate',
            value: '{{data.dora.changeFailureRate}}',
            target: '< 15%',
            status: '{{data.dora.changeFailureRate.status}}'
          }
        ],
        layout: 'cards',
        showBenchmarks: true,
        timeRange: '90d'
      },
      dataSource: {
        type: 'api',
        endpoint: '/api/development/dora-metrics',
        method: 'GET',
        params: {
          team: '{{teamName}}',
          period: '90d'
        },
        cache: {
          ttl: 3600,
          key: 'dora-metrics-{{teamName}}'
        }
      }
    }
  ],

  styling: {
    theme: 'professional',
    colors: {
      primary: '#1976d2',
      secondary: '#424242',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
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
    borderRadius: 8,
    shadows: {
      card: '0 2px 8px rgba(0,0,0,0.1)',
      hover: '0 4px 12px rgba(0,0,0,0.15)'
    }
  },

  automation: {
    rules: [
      {
        id: 'high-bug-alert',
        name: '버그 수 임계값 알림',
        trigger: {
          type: 'data-threshold',
          condition: 'data.bugs.active > alertThreshold.bugCount'
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '버그 수 임계값 초과',
              message: '현재 활성 버그가 {{data.bugs.active}}개로 임계값({{alertThreshold.bugCount}})을 초과했습니다.',
              severity: 'warning'
            }
          }
        ]
      },
      {
        id: 'code-review-delay-alert',
        name: '코드 리뷰 지연 알림',
        trigger: {
          type: 'data-threshold',
          condition: 'data.codeReview.avgReviewTime > alertThreshold.codeReviewDelay'
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '코드 리뷰 지연',
              message: '평균 코드 리뷰 시간이 {{data.codeReview.avgReviewTime}}시간으로 임계값을 초과했습니다.',
              severity: 'info'
            }
          }
        ]
      },
      {
        id: 'deployment-failure-alert',
        name: '배포 실패 알림',
        trigger: {
          type: 'data-threshold',
          condition: 'data.deployment.failureRate > alertThreshold.deploymentFailure'
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '배포 실패율 증가',
              message: '배포 실패율이 {{data.deployment.failureRate}}%로 임계값을 초과했습니다.',
              severity: 'error'
            }
          }
        ]
      }
    ],
    schedules: [
      {
        id: 'daily-report',
        name: '일일 개발 리포트',
        cron: '0 9 * * 1-5',
        action: {
          type: 'generate-report',
          config: {
            template: 'daily-dev-summary',
            recipients: ['team-lead@company.com'],
            format: 'email'
          }
        }
      },
      {
        id: 'weekly-metrics',
        name: '주간 메트릭 업데이트',
        cron: '0 10 * * 1',
        action: {
          type: 'refresh-data',
          config: {
            widgets: ['team-kpi-overview', 'code-quality-metrics', 'dora-metrics']
          }
        }
      }
    ]
  },

  localization: {
    ko: {
      teamName: '팀 이름',
      sprintProgress: '스프린트 진행률',
      codeQuality: '코드 품질',
      bugTracking: '버그 트래킹',
      deploymentPipeline: 'CI/CD 파이프라인',
      teamPerformance: '팀 성과'
    },
    en: {
      teamName: 'Team Name',
      sprintProgress: 'Sprint Progress',
      codeQuality: 'Code Quality',
      bugTracking: 'Bug Tracking',
      deploymentPipeline: 'CI/CD Pipeline',
      teamPerformance: 'Team Performance'
    }
  },

  validation: {
    rules: [
      {
        field: 'teamSize',
        rule: 'required',
        message: '팀 규모는 필수 입력 항목입니다.'
      },
      {
        field: 'sprintDuration',
        rule: 'range',
        params: { min: 1, max: 4 },
        message: '스프린트 기간은 1-4주 사이여야 합니다.'
      },
      {
        field: 'codeQualityThreshold',
        rule: 'range',
        params: { min: 50, max: 100 },
        message: '코드 품질 임계값은 50-100% 사이여야 합니다.'
      }
    ]
  }
};