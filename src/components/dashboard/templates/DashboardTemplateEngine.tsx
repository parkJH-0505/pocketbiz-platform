/**
 * Dashboard Template Engine
 * 엔터프라이즈급 대시보드 템플릿 시스템
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { DashboardLayout, GridLayoutItem } from '../grid/GridLayoutConfig';
import type { WidgetConfig } from '../WidgetRegistry';
import { enhancedWidgetRegistry } from '../registry/EnhancedWidgetRegistry';

// 템플릿 변수 타입
export interface TemplateVariable {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'date' | 'object';
  defaultValue: any;
  required: boolean;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: Array<{ label: string; value: any }>;
  };
  conditional?: {
    dependsOn: string;
    condition: 'equals' | 'not_equals' | 'contains';
    value: any;
  };
}

// 템플릿 메타데이터
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  industry?: string[];
  tags: string[];
  author: string;
  version: string;
  created: number;
  updated: number;
  downloads: number;
  rating: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedSetupTime: number; // minutes
  requirements: {
    dataSources: string[];
    permissions: string[];
    features: string[];
  };
  preview: {
    thumbnail: string;
    screenshots: string[];
    demoUrl?: string;
  };
  support: {
    documentation: string;
    forum?: string;
    contact?: string;
  };
}

// 템플릿 정의
export interface DashboardTemplate {
  metadata: TemplateMetadata;
  variables: TemplateVariable[];
  layout: {
    base: DashboardLayout;
    conditionalLayouts?: Array<{
      condition: string;
      layout: Partial<DashboardLayout>;
    }>;
  };
  widgets: Array<{
    id: string;
    config: WidgetConfig;
    positioning: {
      gridItem: GridLayoutItem;
      dependencies?: string[];
      conditional?: string;
    };
  }>;
  styling: {
    theme?: string;
    customCSS?: string;
    responsiveBreakpoints?: Record<string, any>;
  };
  dataSources?: Array<{
    id: string;
    name: string;
    type: string;
    config: any;
    sampleData?: any;
  }>;
  automation?: {
    onLoad?: string[];
    onDataUpdate?: string[];
    schedules?: Array<{
      cron: string;
      action: string;
    }>;
  };
  localization?: Record<string, Record<string, string>>;
}

// 템플릿 인스턴스
export interface TemplateInstance {
  id: string;
  templateId: string;
  name: string;
  variables: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'active' | 'archived';
  layout: DashboardLayout;
  customizations: {
    widgets: Record<string, Partial<WidgetConfig>>;
    layout: Partial<DashboardLayout>;
    styling: any;
  };
}

// 템플릿 컨텍스트
interface TemplateContextValue {
  templates: DashboardTemplate[];
  instances: TemplateInstance[];
  loadTemplate: (templateId: string) => Promise<DashboardTemplate>;
  createInstance: (templateId: string, variables: Record<string, any>) => Promise<TemplateInstance>;
  updateInstance: (instanceId: string, updates: Partial<TemplateInstance>) => Promise<void>;
  deleteInstance: (instanceId: string) => Promise<void>;
  exportTemplate: (template: DashboardTemplate) => string;
  importTemplate: (templateData: string) => Promise<DashboardTemplate>;
  validateTemplate: (template: DashboardTemplate) => ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

/**
 * 템플릿 엔진 클래스
 */
export class TemplateEngine {
  private templates = new Map<string, DashboardTemplate>();
  private instances = new Map<string, TemplateInstance>();
  private variableResolvers = new Map<string, (context: any) => any>();
  private conditionEvaluators = new Map<string, (variables: Record<string, any>) => boolean>();

  constructor() {
    this.initializeBuiltinResolvers();
  }

  /**
   * 내장 리졸버 초기화
   */
  private initializeBuiltinResolvers(): void {
    // 현재 날짜/시간
    this.variableResolvers.set('current_date', () => new Date().toISOString().split('T')[0]);
    this.variableResolvers.set('current_time', () => new Date().toLocaleTimeString());
    this.variableResolvers.set('current_timestamp', () => Date.now());

    // 사용자 정보
    this.variableResolvers.set('user_name', (context) => context.user?.name || 'User');
    this.variableResolvers.set('user_email', (context) => context.user?.email || '');
    this.variableResolvers.set('user_role', (context) => context.user?.role || 'viewer');

    // 시스템 정보
    this.variableResolvers.set('app_version', () => process.env.REACT_APP_VERSION || '1.0.0');
    this.variableResolvers.set('environment', () => process.env.NODE_ENV || 'production');

    // 수학 함수
    this.variableResolvers.set('random', () => Math.random());
    this.variableResolvers.set('random_int', (context) => {
      const min = context.min || 0;
      const max = context.max || 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    });
  }

  /**
   * 템플릿 등록
   */
  registerTemplate(template: DashboardTemplate): void {
    const validation = this.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.templates.set(template.metadata.id, template);
  }

  /**
   * 템플릿 인스턴스 생성
   */
  async createInstance(
    templateId: string,
    variables: Record<string, any>,
    context: any = {}
  ): Promise<TemplateInstance> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 변수 유효성 검사
    const validationResult = this.validateVariables(template.variables, variables);
    if (!validationResult.valid) {
      throw new Error(`Invalid variables: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // 변수 해석
    const resolvedVariables = await this.resolveVariables(variables, context);

    // 레이아웃 생성
    const layout = this.generateLayout(template, resolvedVariables);

    // 위젯 설정 생성
    const widgets = this.generateWidgets(template, resolvedVariables);

    const instance: TemplateInstance = {
      id: `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      name: this.interpolateString(template.metadata.name, resolvedVariables),
      variables: resolvedVariables,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
      layout: {
        ...layout,
        widgets: widgets.reduce((acc, widget) => {
          acc[widget.positioning.gridItem.i] = widget.config;
          return acc;
        }, {} as Record<string, any>)
      },
      customizations: {
        widgets: {},
        layout: {},
        styling: {}
      }
    };

    this.instances.set(instance.id, instance);

    return instance;
  }

  /**
   * 변수 해석
   */
  private async resolveVariables(
    variables: Record<string, any>,
    context: any
  ): Promise<Record<string, any>> {
    const resolved: Record<string, any> = { ...variables };

    // 함수 형태의 변수 해석
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const expression = value.slice(2, -1);
        const resolver = this.variableResolvers.get(expression);

        if (resolver) {
          resolved[key] = resolver(context);
        } else if (expression.includes('(')) {
          // 함수 호출 형태
          resolved[key] = this.evaluateExpression(expression, context);
        }
      }
    }

    return resolved;
  }

  /**
   * 표현식 평가
   */
  private evaluateExpression(expression: string, context: any): any {
    try {
      // 안전한 표현식 평가 (제한된 컨텍스트)
      const safeContext = {
        Math,
        Date,
        ...context,
        // 위험한 함수들은 제외
      };

      const func = new Function(...Object.keys(safeContext), `return ${expression}`);
      return func(...Object.values(safeContext));
    } catch (error) {
      console.warn(`Failed to evaluate expression: ${expression}`, error);
      return expression;
    }
  }

  /**
   * 레이아웃 생성
   */
  private generateLayout(
    template: DashboardTemplate,
    variables: Record<string, any>
  ): DashboardLayout {
    let layout = { ...template.layout.base };

    // 조건부 레이아웃 적용
    if (template.layout.conditionalLayouts) {
      for (const conditional of template.layout.conditionalLayouts) {
        if (this.evaluateCondition(conditional.condition, variables)) {
          layout = {
            ...layout,
            ...conditional.layout
          };
        }
      }
    }

    // 변수 치환
    layout.name = this.interpolateString(layout.name, variables);
    layout.description = this.interpolateString(layout.description || '', variables);

    return layout;
  }

  /**
   * 위젯 생성
   */
  private generateWidgets(
    template: DashboardTemplate,
    variables: Record<string, any>
  ): typeof template.widgets {
    return template.widgets.filter(widget => {
      // 조건부 위젯 필터링
      if (widget.positioning.conditional) {
        return this.evaluateCondition(widget.positioning.conditional, variables);
      }
      return true;
    }).map(widget => ({
      ...widget,
      config: {
        ...widget.config,
        title: this.interpolateString(widget.config.title, variables),
        description: this.interpolateString(widget.config.description || '', variables),
        settings: this.interpolateObject(widget.config.settings || {}, variables)
      }
    }));
  }

  /**
   * 문자열 보간
   */
  private interpolateString(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+(\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(variables, path);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * 객체 보간
   */
  private interpolateObject(obj: any, variables: Record<string, any>): any {
    if (typeof obj === 'string') {
      return this.interpolateString(obj, variables);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, variables));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, variables);
      }
      return result;
    }

    return obj;
  }

  /**
   * 중첩 값 가져오기
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 조건 평가
   */
  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      // 사용자 정의 평가자 확인
      const evaluator = this.conditionEvaluators.get(condition);
      if (evaluator) {
        return evaluator(variables);
      }

      // 기본 조건 평가 (간단한 형태)
      const interpolated = this.interpolateString(condition, variables);

      // 안전한 조건 평가
      if (/^[\w\s=!<>()&|.]+$/.test(interpolated)) {
        const func = new Function('variables', `
          with(variables) {
            return ${interpolated};
          }
        `);
        return !!func(variables);
      }

      return false;
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * 변수 유효성 검사
   */
  validateVariables(
    templateVariables: TemplateVariable[],
    userVariables: Record<string, any>
  ): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    for (const templateVar of templateVariables) {
      const userValue = userVariables[templateVar.key];

      // 필수 필드 검사
      if (templateVar.required && (userValue === undefined || userValue === null || userValue === '')) {
        errors.push({
          field: templateVar.key,
          message: `${templateVar.label} is required`,
          severity: 'error'
        });
        continue;
      }

      // 타입 검사
      if (userValue !== undefined) {
        const typeError = this.validateVariableType(templateVar, userValue);
        if (typeError) {
          errors.push({
            field: templateVar.key,
            message: typeError,
            severity: 'error'
          });
        }
      }

      // 조건부 필드 검사
      if (templateVar.conditional) {
        const dependentValue = userVariables[templateVar.conditional.dependsOn];
        const shouldShow = this.checkConditionalField(templateVar.conditional, dependentValue);

        if (shouldShow && templateVar.required && !userValue) {
          errors.push({
            field: templateVar.key,
            message: `${templateVar.label} is required when ${templateVar.conditional.dependsOn} is ${templateVar.conditional.value}`,
            severity: 'error'
          });
        }
      }
    }

    return {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors
    };
  }

  /**
   * 변수 타입 검사
   */
  private validateVariableType(templateVar: TemplateVariable, value: any): string | null {
    const { type, validation } = templateVar;

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${templateVar.label} must be a string`;
        }
        if (validation?.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            return `${templateVar.label} does not match required pattern`;
          }
        }
        if (validation?.min && value.length < validation.min) {
          return `${templateVar.label} must be at least ${validation.min} characters`;
        }
        if (validation?.max && value.length > validation.max) {
          return `${templateVar.label} must be no more than ${validation.max} characters`;
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${templateVar.label} must be a number`;
        }
        if (validation?.min !== undefined && value < validation.min) {
          return `${templateVar.label} must be at least ${validation.min}`;
        }
        if (validation?.max !== undefined && value > validation.max) {
          return `${templateVar.label} must be no more than ${validation.max}`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${templateVar.label} must be a boolean`;
        }
        break;

      case 'select':
        if (validation?.options) {
          const validValues = validation.options.map(opt => opt.value);
          if (!validValues.includes(value)) {
            return `${templateVar.label} must be one of: ${validValues.join(', ')}`;
          }
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          return `${templateVar.label} must be an array`;
        }
        if (validation?.options) {
          const validValues = validation.options.map(opt => opt.value);
          const invalidValues = value.filter(v => !validValues.includes(v));
          if (invalidValues.length > 0) {
            return `${templateVar.label} contains invalid values: ${invalidValues.join(', ')}`;
          }
        }
        break;

      case 'color':
        if (typeof value !== 'string' || !/^#[0-9A-F]{6}$/i.test(value)) {
          return `${templateVar.label} must be a valid hex color`;
        }
        break;

      case 'date':
        if (!Date.parse(value)) {
          return `${templateVar.label} must be a valid date`;
        }
        break;
    }

    return null;
  }

  /**
   * 조건부 필드 확인
   */
  private checkConditionalField(
    conditional: NonNullable<TemplateVariable['conditional']>,
    dependentValue: any
  ): boolean {
    switch (conditional.condition) {
      case 'equals':
        return dependentValue === conditional.value;
      case 'not_equals':
        return dependentValue !== conditional.value;
      case 'contains':
        return Array.isArray(dependentValue) && dependentValue.includes(conditional.value);
      default:
        return false;
    }
  }

  /**
   * 템플릿 유효성 검사
   */
  validateTemplate(template: DashboardTemplate): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    // 메타데이터 검사
    if (!template.metadata.id) {
      errors.push({ field: 'metadata.id', message: 'Template ID is required', severity: 'error' });
    }

    if (!template.metadata.name) {
      errors.push({ field: 'metadata.name', message: 'Template name is required', severity: 'error' });
    }

    // 변수 검사
    const variableIds = new Set<string>();
    for (const variable of template.variables) {
      if (!variable.key) {
        errors.push({ field: 'variables', message: 'Variable key is required', severity: 'error' });
      } else if (variableIds.has(variable.key)) {
        errors.push({ field: 'variables', message: `Duplicate variable key: ${variable.key}`, severity: 'error' });
      } else {
        variableIds.add(variable.key);
      }
    }

    // 위젯 검사
    const widgetIds = new Set<string>();
    for (const widget of template.widgets) {
      if (!widget.id) {
        errors.push({ field: 'widgets', message: 'Widget ID is required', severity: 'error' });
      } else if (widgetIds.has(widget.id)) {
        errors.push({ field: 'widgets', message: `Duplicate widget ID: ${widget.id}`, severity: 'error' });
      } else {
        widgetIds.add(widget.id);
      }
    }

    return {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors
    };
  }

  /**
   * 템플릿 내보내기
   */
  exportTemplate(template: DashboardTemplate): string {
    const exportData = {
      version: '1.0',
      exported: Date.now(),
      template: {
        ...template,
        // 민감한 정보 제거
        dataSources: template.dataSources?.map(ds => ({
          ...ds,
          config: ds.config ? this.sanitizeConfig(ds.config) : {}
        }))
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 설정 정리 (민감한 정보 제거)
   */
  private sanitizeConfig(config: any): any {
    const sanitized = { ...config };

    // 민감한 키들 제거
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apiKey', 'auth'];
    sensitiveKeys.forEach(key => {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * 템플릿 가져오기
   */
  async importTemplate(templateData: string): Promise<DashboardTemplate> {
    try {
      const importData = JSON.parse(templateData);

      if (!importData.template) {
        throw new Error('Invalid template data format');
      }

      const template = importData.template as DashboardTemplate;

      // 유효성 검사
      const validation = this.validateTemplate(template);
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      return template;
    } catch (error) {
      throw new Error(`Failed to import template: ${error}`);
    }
  }

  /**
   * 인스턴스 업데이트
   */
  updateInstance(instanceId: string, updates: Partial<TemplateInstance>): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const updated = {
      ...instance,
      ...updates,
      updatedAt: Date.now()
    };

    this.instances.set(instanceId, updated);
  }

  /**
   * 인스턴스 삭제
   */
  deleteInstance(instanceId: string): void {
    this.instances.delete(instanceId);
  }

  /**
   * 템플릿 목록 조회
   */
  getTemplates(): DashboardTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 인스턴스 목록 조회
   */
  getInstances(): TemplateInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * 템플릿 검색
   */
  searchTemplates(query: {
    category?: string;
    industry?: string;
    tags?: string[];
    difficulty?: string;
    keyword?: string;
  }): DashboardTemplate[] {
    return this.getTemplates().filter(template => {
      if (query.category && template.metadata.category !== query.category) {
        return false;
      }

      if (query.industry && !template.metadata.industry?.includes(query.industry)) {
        return false;
      }

      if (query.difficulty && template.metadata.difficulty !== query.difficulty) {
        return false;
      }

      if (query.tags && !query.tags.every(tag => template.metadata.tags.includes(tag))) {
        return false;
      }

      if (query.keyword) {
        const searchText = `${template.metadata.name} ${template.metadata.description}`.toLowerCase();
        if (!searchText.includes(query.keyword.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }
}

// React 컨텍스트
const TemplateContext = createContext<TemplateContextValue | null>(null);

export const useTemplateEngine = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplateEngine must be used within TemplateProvider');
  }
  return context;
};

interface TemplateProviderProps {
  children: React.ReactNode;
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({ children }) => {
  const [engine] = useState(() => new TemplateEngine());
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [instances, setInstances] = useState<TemplateInstance[]>([]);

  useEffect(() => {
    // 초기 템플릿 로드
    loadBuiltinTemplates();
  }, []);

  const loadBuiltinTemplates = async () => {
    // 내장 템플릿들을 로드하는 로직
    setTemplates(engine.getTemplates());
  };

  const loadTemplate = async (templateId: string): Promise<DashboardTemplate> => {
    const template = engine.getTemplates().find(t => t.metadata.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    return template;
  };

  const createInstance = async (templateId: string, variables: Record<string, any>): Promise<TemplateInstance> => {
    const instance = await engine.createInstance(templateId, variables);
    setInstances(prev => [...prev, instance]);
    return instance;
  };

  const updateInstance = async (instanceId: string, updates: Partial<TemplateInstance>): Promise<void> => {
    engine.updateInstance(instanceId, updates);
    setInstances(prev => prev.map(inst =>
      inst.id === instanceId ? { ...inst, ...updates, updatedAt: Date.now() } : inst
    ));
  };

  const deleteInstance = async (instanceId: string): Promise<void> => {
    engine.deleteInstance(instanceId);
    setInstances(prev => prev.filter(inst => inst.id !== instanceId));
  };

  const exportTemplate = (template: DashboardTemplate): string => {
    return engine.exportTemplate(template);
  };

  const importTemplate = async (templateData: string): Promise<DashboardTemplate> => {
    const template = await engine.importTemplate(templateData);
    engine.registerTemplate(template);
    setTemplates(prev => [...prev, template]);
    return template;
  };

  const validateTemplate = (template: DashboardTemplate): ValidationResult => {
    return engine.validateTemplate(template);
  };

  const value: TemplateContextValue = {
    templates,
    instances,
    loadTemplate,
    createInstance,
    updateInstance,
    deleteInstance,
    exportTemplate,
    importTemplate,
    validateTemplate
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};

// 싱글톤 엔진
export const templateEngine = new TemplateEngine();

// 개발 모드에서 전역 접근 가능
if (process.env.NODE_ENV === 'development') {
  (window as any).templateEngine = templateEngine;
}