import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../common/Button';
import type { KPIDefinition, AxisKey, StageType } from '../../types';

interface StageRule {
  stage: StageType;
  weight: 'x1' | 'x2' | 'x3';
  ruleset_text?: string;
  min_value?: number;
  max_value?: number;
  options?: Array<{ label: string; value: number }>;
}

interface ExtendedKPIDefinition extends KPIDefinition {
  stage_rules?: StageRule[];
}

interface KPIEditModalProps {
  kpi: ExtendedKPIDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (kpi: ExtendedKPIDefinition) => void;
}

export const KPIEditModal: React.FC<KPIEditModalProps> = ({
  kpi,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<ExtendedKPIDefinition>>({
    kpi_id: '',
    title: '',
    question: '',
    axis: 'GO',
    input_type: 'Numeric',
    applicable_stages: [],
    formula: '',
    input_fields: [],
    stage_rules: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedStages, setExpandedStages] = useState<Set<StageType>>(new Set());

  useEffect(() => {
    if (kpi) {
      setFormData(kpi);
      // 기존 stage_rules가 있으면 해당 stage들을 확장 상태로 설정
      if (kpi.stage_rules) {
        setExpandedStages(new Set(kpi.stage_rules.map(r => r.stage)));
      }
    } else {
      setFormData({
        kpi_id: '',
        title: '',
        question: '',
        axis: 'GO',
        input_type: 'Numeric',
        applicable_stages: [],
        formula: '',
        input_fields: [],
        stage_rules: []
      });
      setExpandedStages(new Set());
    }
    setErrors({});
  }, [kpi]);

  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const inputTypes = ['Numeric', 'Rubric', 'MultiSelect', 'Calculation', 'Stage', 'Checklist'];
  const stages: StageType[] = ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'];
  const weights: Array<'x1' | 'x2' | 'x3'> = ['x1', 'x2', 'x3'];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.kpi_id) {
      newErrors.kpi_id = 'KPI ID는 필수입니다';
    } else if (!/^S\d+-\[?[A-Z]{2}\]?-\d{2}$/.test(formData.kpi_id)) {
      newErrors.kpi_id = 'KPI ID 형식이 올바르지 않습니다 (예: S1-[GO]-01)';
    }
    
    if (!formData.title) {
      newErrors.title = '제목은 필수입니다';
    }
    
    if (!formData.question) {
      newErrors.question = '질문은 필수입니다';
    }
    
    if (!formData.applicable_stages || formData.applicable_stages.length === 0) {
      newErrors.applicable_stages = '최소 하나의 단계를 선택해야 합니다';
    }
    
    if (formData.input_type === 'Calculation' && !formData.formula) {
      newErrors.formula = 'Calculation 타입은 수식이 필요합니다';
    }
    
    // Stage rules 검증
    formData.applicable_stages?.forEach(stage => {
      const rule = formData.stage_rules?.find(r => r.stage === stage);
      if (!rule) {
        newErrors[`stage_${stage}`] = `${stage} 단계의 규칙이 필요합니다`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData as ExtendedKPIDefinition);
    }
  };

  const handleStageToggle = (stage: StageType) => {
    const stages = formData.applicable_stages || [];
    const stageRules = formData.stage_rules || [];
    
    if (stages.includes(stage)) {
      // 단계 제거
      setFormData({
        ...formData,
        applicable_stages: stages.filter(s => s !== stage),
        stage_rules: stageRules.filter(r => r.stage !== stage)
      });
      // 확장 상태에서도 제거
      const newExpanded = new Set(expandedStages);
      newExpanded.delete(stage);
      setExpandedStages(newExpanded);
    } else {
      // 단계 추가
      const newRule: StageRule = {
        stage,
        weight: 'x1',
        ...(formData.input_type === 'Numeric' ? { min_value: 0, max_value: 100 } : {}),
        ...(formData.input_type === 'Rubric' || formData.input_type === 'MultiSelect' || formData.input_type === 'Stage' ? { 
          options: [{ label: '', value: 0 }] 
        } : {})
      };
      
      setFormData({
        ...formData,
        applicable_stages: [...stages, stage],
        stage_rules: [...stageRules, newRule]
      });
      // 새로 추가된 단계를 확장 상태로 설정
      const newExpanded = new Set(expandedStages);
      newExpanded.add(stage);
      setExpandedStages(newExpanded);
    }
  };

  const toggleStageExpansion = (stage: StageType) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedStages(newExpanded);
  };

  const updateStageRule = (stage: StageType, field: keyof StageRule, value: any) => {
    const rules = formData.stage_rules || [];
    const updatedRules = rules.map(rule => {
      if (rule.stage === stage) {
        return { ...rule, [field]: value };
      }
      return rule;
    });
    setFormData({ ...formData, stage_rules: updatedRules });
  };

  const addRuleOption = (stage: StageType) => {
    const rules = formData.stage_rules || [];
    const updatedRules = rules.map(rule => {
      if (rule.stage === stage) {
        const currentOptions = rule.options || [];
        return { 
          ...rule, 
          options: [...currentOptions, { label: '', value: 0 }]
        };
      }
      return rule;
    });
    setFormData({ ...formData, stage_rules: updatedRules });
  };

  const updateRuleOption = (stage: StageType, index: number, field: 'label' | 'value', value: any) => {
    const rules = formData.stage_rules || [];
    const updatedRules = rules.map(rule => {
      if (rule.stage === stage && rule.options) {
        const updatedOptions = [...rule.options];
        updatedOptions[index] = { ...updatedOptions[index], [field]: value };
        return { ...rule, options: updatedOptions };
      }
      return rule;
    });
    setFormData({ ...formData, stage_rules: updatedRules });
  };

  const removeRuleOption = (stage: StageType, index: number) => {
    const rules = formData.stage_rules || [];
    const updatedRules = rules.map(rule => {
      if (rule.stage === stage && rule.options) {
        const updatedOptions = rule.options.filter((_, i) => i !== index);
        return { ...rule, options: updatedOptions };
      }
      return rule;
    });
    setFormData({ ...formData, stage_rules: updatedRules });
  };

  const handleInputFieldAdd = () => {
    setFormData({
      ...formData,
      input_fields: [...(formData.input_fields || []), '']
    });
  };

  const handleInputFieldChange = (index: number, value: string) => {
    const fields = [...(formData.input_fields || [])];
    fields[index] = value;
    setFormData({
      ...formData,
      input_fields: fields
    });
  };

  const handleInputFieldRemove = (index: number) => {
    const fields = [...(formData.input_fields || [])];
    fields.splice(index, 1);
    setFormData({
      ...formData,
      input_fields: fields
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-neutral-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-dark">
            {kpi ? 'KPI 수정' : 'KPI 추가'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-light rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-gray" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 기본 정보 섹션 */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-neutral-dark mb-3">기본 정보</h3>
              
              {/* KPI ID */}
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  KPI ID <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  value={formData.kpi_id}
                  onChange={(e) => setFormData({ ...formData, kpi_id: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-main ${
                    errors.kpi_id ? 'border-accent-red' : 'border-neutral-border'
                  }`}
                  placeholder="예: S1-[GO]-01"
                  disabled={!!kpi}
                />
                {errors.kpi_id && (
                  <p className="mt-1 text-sm text-accent-red flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.kpi_id}
                  </p>
                )}
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  제목 <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-main ${
                    errors.title ? 'border-accent-red' : 'border-neutral-border'
                  }`}
                  placeholder="KPI 제목을 입력하세요"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-accent-red flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* 질문 */}
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  질문 <span className="text-accent-red">*</span>
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-main ${
                    errors.question ? 'border-accent-red' : 'border-neutral-border'
                  }`}
                  placeholder="사용자에게 표시될 질문을 입력하세요"
                  rows={2}
                />
                {errors.question && (
                  <p className="mt-1 text-sm text-accent-red flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.question}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 축 선택 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    축 (Axis) <span className="text-accent-red">*</span>
                  </label>
                  <select
                    value={formData.axis}
                    onChange={(e) => setFormData({ ...formData, axis: e.target.value as AxisKey })}
                    className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
                  >
                    {axes.map(axis => (
                      <option key={axis} value={axis}>{axis}</option>
                    ))}
                  </select>
                </div>

                {/* 입력 타입 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    입력 타입 <span className="text-accent-red">*</span>
                  </label>
                  <select
                    value={formData.input_type}
                    onChange={(e) => setFormData({ ...formData, input_type: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
                  >
                    {inputTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Calculation 타입일 때 수식 입력 */}
            {formData.input_type === 'Calculation' && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-neutral-dark mb-3">계산식 설정</h3>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    수식 <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.formula}
                    onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-main ${
                      errors.formula ? 'border-accent-red' : 'border-neutral-border'
                    }`}
                    placeholder="예: (field1 / field2) * 100"
                  />
                  {errors.formula && (
                    <p className="mt-1 text-sm text-accent-red flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.formula}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    입력 필드
                  </label>
                  <div className="space-y-2">
                    {formData.input_fields?.map((field, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={field}
                          onChange={(e) => handleInputFieldChange(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
                          placeholder={`field${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleInputFieldRemove(index)}
                          className="p-2 text-accent-red hover:bg-accent-red-light rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleInputFieldAdd}
                      className="flex items-center gap-2 px-4 py-2 border border-dashed border-neutral-border rounded-lg hover:border-primary-main transition-colors text-sm text-neutral-gray"
                    >
                      <Plus size={16} />
                      필드 추가
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 단계별 규칙 설정 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-dark">단계별 규칙 설정</h3>
              
              {/* 적용 단계 선택 */}
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  적용 단계 <span className="text-accent-red">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {stages.map(stage => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => handleStageToggle(stage)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors ${
                        formData.applicable_stages?.includes(stage)
                          ? 'bg-primary-main text-white border-primary-main'
                          : 'bg-white text-neutral-gray border-neutral-border hover:border-primary-main'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
                {errors.applicable_stages && (
                  <p className="mt-1 text-sm text-accent-red flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.applicable_stages}
                  </p>
                )}
              </div>

              {/* 선택된 단계별 상세 설정 */}
              {formData.applicable_stages?.map(stage => {
                const rule = formData.stage_rules?.find(r => r.stage === stage);
                const isExpanded = expandedStages.has(stage);
                
                return (
                  <div key={stage} className="border border-neutral-border rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleStageExpansion(stage)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-neutral-dark">{stage} 단계 설정</span>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-neutral-border">
                        {/* 가중치 선택 */}
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-neutral-dark mb-2">
                            가중치
                          </label>
                          <div className="flex gap-2">
                            {weights.map(weight => (
                              <button
                                key={weight}
                                type="button"
                                onClick={() => updateStageRule(stage, 'weight', weight)}
                                className={`px-4 py-2 rounded-lg border transition-colors ${
                                  rule?.weight === weight
                                    ? 'bg-primary-main text-white border-primary-main'
                                    : 'bg-white text-neutral-gray border-neutral-border hover:border-primary-main'
                                }`}
                              >
                                {weight}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 입력 타입별 설정 */}
                        {formData.input_type === 'Numeric' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-neutral-dark mb-1">
                                최소값
                              </label>
                              <input
                                type="number"
                                value={rule?.min_value ?? 0}
                                onChange={(e) => updateStageRule(stage, 'min_value', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-dark mb-1">
                                최대값
                              </label>
                              <input
                                type="number"
                                value={rule?.max_value ?? 100}
                                onChange={(e) => updateStageRule(stage, 'max_value', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
                              />
                            </div>
                          </div>
                        )}

                        {(formData.input_type === 'Rubric' || formData.input_type === 'MultiSelect' || formData.input_type === 'Stage') && (
                          <div>
                            <label className="block text-sm font-medium text-neutral-dark mb-2">
                              선택 항목 및 점수
                            </label>
                            <div className="space-y-2">
                              {rule?.options?.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) => updateRuleOption(stage, index, 'label', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
                                    placeholder="항목 설명"
                                  />
                                  <input
                                    type="number"
                                    value={option.value}
                                    onChange={(e) => updateRuleOption(stage, index, 'value', Number(e.target.value))}
                                    className="w-24 px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
                                    placeholder="점수"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeRuleOption(stage, index)}
                                    className="p-2 text-accent-red hover:bg-accent-red-light rounded-lg transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addRuleOption(stage)}
                                className="flex items-center gap-2 px-3 py-2 border border-dashed border-neutral-border rounded-lg hover:border-primary-main transition-colors text-sm text-neutral-gray"
                              >
                                <Plus size={16} />
                                항목 추가
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-neutral-border flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {kpi ? '수정' : '추가'}
          </Button>
        </div>
      </div>
    </div>
  );
};