/**
 * Data Transform Pipeline
 * 데이터 변환 파이프라인 시스템
 */

// 변환 연산자 타입
export type TransformOperator =
  | 'map'
  | 'filter'
  | 'reduce'
  | 'sort'
  | 'group'
  | 'aggregate'
  | 'flatten'
  | 'pivot'
  | 'join'
  | 'merge'
  | 'pick'
  | 'omit'
  | 'rename'
  | 'convert'
  | 'validate';

// 집계 함수 타입
export type AggregateFunction =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'count'
  | 'median'
  | 'mode'
  | 'stddev'
  | 'variance';

// 데이터 타입
export type DataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object'
  | 'null';

// 변환 스텝 설정
export interface TransformStep {
  id: string;
  operator: TransformOperator;
  config: any;
  enabled: boolean;
}

// 필드 매핑
export interface FieldMapping {
  source: string;
  target: string;
  transform?: (value: any) => any;
}

// 검증 규칙
export interface ValidationRule {
  field: string;
  type?: DataType;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: any) => boolean;
  message?: string;
}

/**
 * 데이터 변환 파이프라인 클래스
 */
export class DataTransformPipeline {
  private steps: TransformStep[] = [];

  /**
   * 변환 스텝 추가
   */
  addStep(step: TransformStep): this {
    this.steps.push(step);
    return this;
  }

  /**
   * 변환 스텝 제거
   */
  removeStep(stepId: string): this {
    this.steps = this.steps.filter(s => s.id !== stepId);
    return this;
  }

  /**
   * 파이프라인 실행
   */
  async execute<T = any>(data: any): Promise<T> {
    let result = data;

    for (const step of this.steps) {
      if (!step.enabled) continue;

      try {
        result = await this.applyTransform(result, step);
      } catch (error) {
        console.error(`Transform step ${step.id} failed:`, error);
        throw new Error(`Pipeline failed at step ${step.id}: ${error}`);
      }
    }

    return result as T;
  }

  /**
   * 변환 적용
   */
  private async applyTransform(data: any, step: TransformStep): Promise<any> {
    const operators = {
      map: this.mapTransform,
      filter: this.filterTransform,
      reduce: this.reduceTransform,
      sort: this.sortTransform,
      group: this.groupTransform,
      aggregate: this.aggregateTransform,
      flatten: this.flattenTransform,
      pivot: this.pivotTransform,
      join: this.joinTransform,
      merge: this.mergeTransform,
      pick: this.pickTransform,
      omit: this.omitTransform,
      rename: this.renameTransform,
      convert: this.convertTransform,
      validate: this.validateTransform
    };

    const operator = operators[step.operator];
    if (!operator) {
      throw new Error(`Unknown operator: ${step.operator}`);
    }

    return operator.call(this, data, step.config);
  }

  /**
   * Map 변환
   */
  private mapTransform(data: any[], config: {
    mapper: (item: any, index: number) => any
  }): any[] {
    if (!Array.isArray(data)) {
      throw new Error('Map requires array input');
    }

    if (typeof config.mapper === 'string') {
      const mapperFn = new Function('item', 'index', config.mapper);
      return data.map(mapperFn);
    }

    return data.map(config.mapper);
  }

  /**
   * Filter 변환
   */
  private filterTransform(data: any[], config: {
    predicate: (item: any, index: number) => boolean
  }): any[] {
    if (!Array.isArray(data)) {
      throw new Error('Filter requires array input');
    }

    if (typeof config.predicate === 'string') {
      const predicateFn = new Function('item', 'index', config.predicate);
      return data.filter(predicateFn);
    }

    return data.filter(config.predicate);
  }

  /**
   * Reduce 변환
   */
  private reduceTransform(data: any[], config: {
    reducer: (acc: any, item: any, index: number) => any,
    initialValue: any
  }): any {
    if (!Array.isArray(data)) {
      throw new Error('Reduce requires array input');
    }

    if (typeof config.reducer === 'string') {
      const reducerFn = new Function('acc', 'item', 'index', config.reducer);
      return data.reduce(reducerFn, config.initialValue);
    }

    return data.reduce(config.reducer, config.initialValue);
  }

  /**
   * Sort 변환
   */
  private sortTransform(data: any[], config: {
    field?: string,
    order?: 'asc' | 'desc',
    compareFn?: (a: any, b: any) => number
  }): any[] {
    if (!Array.isArray(data)) {
      throw new Error('Sort requires array input');
    }

    const sorted = [...data];

    if (config.compareFn) {
      return sorted.sort(config.compareFn);
    }

    if (config.field) {
      return sorted.sort((a, b) => {
        const aVal = this.getNestedValue(a, config.field!);
        const bVal = this.getNestedValue(b, config.field!);

        if (aVal === bVal) return 0;

        const result = aVal < bVal ? -1 : 1;
        return config.order === 'desc' ? -result : result;
      });
    }

    return sorted.sort();
  }

  /**
   * Group 변환
   */
  private groupTransform(data: any[], config: {
    by: string | ((item: any) => string)
  }): Record<string, any[]> {
    if (!Array.isArray(data)) {
      throw new Error('Group requires array input');
    }

    const groups: Record<string, any[]> = {};

    data.forEach(item => {
      let key: string;

      if (typeof config.by === 'function') {
        key = config.by(item);
      } else {
        key = this.getNestedValue(item, config.by);
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  }

  /**
   * Aggregate 변환
   */
  private aggregateTransform(data: any[], config: {
    field: string,
    function: AggregateFunction
  }): number {
    if (!Array.isArray(data)) {
      throw new Error('Aggregate requires array input');
    }

    const values = data.map(item => {
      const val = this.getNestedValue(item, config.field);
      return typeof val === 'number' ? val : parseFloat(val);
    }).filter(v => !isNaN(v));

    switch (config.function) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);

      case 'avg':
        return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

      case 'min':
        return Math.min(...values);

      case 'max':
        return Math.max(...values);

      case 'count':
        return values.length;

      case 'median':
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

      case 'mode':
        const frequency: Record<number, number> = {};
        let maxFreq = 0;
        let mode = 0;

        values.forEach(v => {
          frequency[v] = (frequency[v] || 0) + 1;
          if (frequency[v] > maxFreq) {
            maxFreq = frequency[v];
            mode = v;
          }
        });

        return mode;

      case 'stddev':
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance);

      case 'variance':
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;

      default:
        throw new Error(`Unknown aggregate function: ${config.function}`);
    }
  }

  /**
   * Flatten 변환
   */
  private flattenTransform(data: any, config: {
    depth?: number
  }): any[] {
    const flatten = (arr: any[], depth: number): any[] => {
      if (depth <= 0) return arr;

      return arr.reduce((acc, val) => {
        if (Array.isArray(val)) {
          return acc.concat(flatten(val, depth - 1));
        }
        return acc.concat(val);
      }, []);
    };

    return flatten(Array.isArray(data) ? data : [data], config.depth || Infinity);
  }

  /**
   * Pivot 변환
   */
  private pivotTransform(data: any[], config: {
    index: string,
    columns: string,
    values: string,
    aggFunc?: AggregateFunction
  }): any {
    if (!Array.isArray(data)) {
      throw new Error('Pivot requires array input');
    }

    const result: Record<string, any> = {};

    data.forEach(item => {
      const indexKey = this.getNestedValue(item, config.index);
      const columnKey = this.getNestedValue(item, config.columns);
      const value = this.getNestedValue(item, config.values);

      if (!result[indexKey]) {
        result[indexKey] = {};
      }

      if (!result[indexKey][columnKey]) {
        result[indexKey][columnKey] = [];
      }

      result[indexKey][columnKey].push(value);
    });

    // 집계 함수 적용
    if (config.aggFunc) {
      Object.keys(result).forEach(indexKey => {
        Object.keys(result[indexKey]).forEach(columnKey => {
          const values = result[indexKey][columnKey];
          result[indexKey][columnKey] = this.aggregateTransform(
            values.map((v: any) => ({ value: v })),
            { field: 'value', function: config.aggFunc! }
          );
        });
      });
    }

    return result;
  }

  /**
   * Join 변환
   */
  private joinTransform(data: any, config: {
    with: any[],
    on: string | { left: string, right: string },
    type?: 'inner' | 'left' | 'right' | 'full'
  }): any[] {
    const leftData = Array.isArray(data) ? data : [data];
    const rightData = config.with;

    const getKey = (item: any, field: string) => this.getNestedValue(item, field);

    const result: any[] = [];

    if (config.type === 'inner' || !config.type) {
      // Inner join
      leftData.forEach(leftItem => {
        const leftKey = typeof config.on === 'string'
          ? getKey(leftItem, config.on)
          : getKey(leftItem, config.on.left);

        rightData.forEach(rightItem => {
          const rightKey = typeof config.on === 'string'
            ? getKey(rightItem, config.on)
            : getKey(rightItem, config.on.right);

          if (leftKey === rightKey) {
            result.push({ ...leftItem, ...rightItem });
          }
        });
      });
    } else if (config.type === 'left') {
      // Left join
      leftData.forEach(leftItem => {
        const leftKey = typeof config.on === 'string'
          ? getKey(leftItem, config.on)
          : getKey(leftItem, config.on.left);

        let matched = false;

        rightData.forEach(rightItem => {
          const rightKey = typeof config.on === 'string'
            ? getKey(rightItem, config.on)
            : getKey(rightItem, config.on.right);

          if (leftKey === rightKey) {
            result.push({ ...leftItem, ...rightItem });
            matched = true;
          }
        });

        if (!matched) {
          result.push(leftItem);
        }
      });
    }

    return result;
  }

  /**
   * Merge 변환
   */
  private mergeTransform(data: any[], config: {
    with: any[],
    strategy?: 'concat' | 'union' | 'intersection'
  }): any[] {
    const arr1 = Array.isArray(data) ? data : [data];
    const arr2 = config.with;

    switch (config.strategy) {
      case 'union':
        return [...new Set([...arr1, ...arr2])];

      case 'intersection':
        return arr1.filter(item => arr2.includes(item));

      case 'concat':
      default:
        return [...arr1, ...arr2];
    }
  }

  /**
   * Pick 변환
   */
  private pickTransform(data: any, config: {
    fields: string[]
  }): any {
    if (Array.isArray(data)) {
      return data.map(item => this.pickFields(item, config.fields));
    }
    return this.pickFields(data, config.fields);
  }

  /**
   * Omit 변환
   */
  private omitTransform(data: any, config: {
    fields: string[]
  }): any {
    if (Array.isArray(data)) {
      return data.map(item => this.omitFields(item, config.fields));
    }
    return this.omitFields(data, config.fields);
  }

  /**
   * Rename 변환
   */
  private renameTransform(data: any, config: {
    mappings: Record<string, string>
  }): any {
    if (Array.isArray(data)) {
      return data.map(item => this.renameFields(item, config.mappings));
    }
    return this.renameFields(data, config.mappings);
  }

  /**
   * Convert 변환
   */
  private convertTransform(data: any, config: {
    conversions: Array<{
      field: string,
      type: DataType,
      format?: string
    }>
  }): any {
    const convert = (item: any) => {
      const converted = { ...item };

      config.conversions.forEach(conv => {
        const value = this.getNestedValue(item, conv.field);
        const convertedValue = this.convertValue(value, conv.type, conv.format);
        this.setNestedValue(converted, conv.field, convertedValue);
      });

      return converted;
    };

    if (Array.isArray(data)) {
      return data.map(convert);
    }
    return convert(data);
  }

  /**
   * Validate 변환
   */
  private validateTransform(data: any, config: {
    rules: ValidationRule[],
    throwOnError?: boolean
  }): any {
    const validate = (item: any) => {
      const errors: string[] = [];

      config.rules.forEach(rule => {
        const value = this.getNestedValue(item, rule.field);

        // 필수 검증
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(rule.message || `${rule.field} is required`);
          return;
        }

        // 타입 검증
        if (rule.type && value !== undefined && value !== null) {
          const actualType = this.getValueType(value);
          if (actualType !== rule.type) {
            errors.push(rule.message || `${rule.field} must be of type ${rule.type}`);
            return;
          }
        }

        // 범위 검증
        if (typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(rule.message || `${rule.field} must be >= ${rule.min}`);
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(rule.message || `${rule.field} must be <= ${rule.max}`);
          }
        }

        // 패턴 검증
        if (rule.pattern && typeof value === 'string') {
          const regex = new RegExp(rule.pattern);
          if (!regex.test(value)) {
            errors.push(rule.message || `${rule.field} does not match pattern ${rule.pattern}`);
          }
        }

        // 커스텀 검증
        if (rule.custom && !rule.custom(value)) {
          errors.push(rule.message || `${rule.field} failed custom validation`);
        }
      });

      if (errors.length > 0) {
        if (config.throwOnError) {
          throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
        return { ...item, _errors: errors };
      }

      return item;
    };

    if (Array.isArray(data)) {
      return data.map(validate);
    }
    return validate(data);
  }

  /**
   * 중첩 값 가져오기
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * 중첩 값 설정
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;

    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  /**
   * 필드 선택
   */
  private pickFields(obj: any, fields: string[]): any {
    const result: any = {};

    fields.forEach(field => {
      const value = this.getNestedValue(obj, field);
      if (value !== undefined) {
        this.setNestedValue(result, field, value);
      }
    });

    return result;
  }

  /**
   * 필드 제외
   */
  private omitFields(obj: any, fields: string[]): any {
    const result = { ...obj };

    fields.forEach(field => {
      const keys = field.split('.');
      if (keys.length === 1) {
        delete result[field];
      } else {
        // 중첩 필드 제거는 더 복잡한 로직 필요
        this.setNestedValue(result, field, undefined);
      }
    });

    return result;
  }

  /**
   * 필드 이름 변경
   */
  private renameFields(obj: any, mappings: Record<string, string>): any {
    const result = { ...obj };

    Object.entries(mappings).forEach(([oldName, newName]) => {
      if (oldName in result) {
        result[newName] = result[oldName];
        delete result[oldName];
      }
    });

    return result;
  }

  /**
   * 값 변환
   */
  private convertValue(value: any, type: DataType, format?: string): any {
    if (value === null || value === undefined) return value;

    switch (type) {
      case 'string':
        return String(value);

      case 'number':
        return Number(value);

      case 'boolean':
        return Boolean(value);

      case 'date':
        if (format) {
          // 날짜 포맷 처리 (간단한 예시)
          return new Date(value).toISOString();
        }
        return new Date(value);

      case 'array':
        return Array.isArray(value) ? value : [value];

      case 'object':
        return typeof value === 'object' ? value : { value };

      case 'null':
        return null;

      default:
        return value;
    }
  }

  /**
   * 값 타입 확인
   */
  private getValueType(value: any): DataType {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';

    const type = typeof value;
    if (type === 'object') return 'object';
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';

    return 'null';
  }

  /**
   * 파이프라인 내보내기
   */
  export(): TransformStep[] {
    return [...this.steps];
  }

  /**
   * 파이프라인 가져오기
   */
  import(steps: TransformStep[]): this {
    this.steps = [...steps];
    return this;
  }

  /**
   * 파이프라인 초기화
   */
  clear(): this {
    this.steps = [];
    return this;
  }
}

// 싱글톤 인스턴스 생성 헬퍼
export function createPipeline(steps?: TransformStep[]): DataTransformPipeline {
  const pipeline = new DataTransformPipeline();
  if (steps) {
    steps.forEach(step => pipeline.addStep(step));
  }
  return pipeline;
}