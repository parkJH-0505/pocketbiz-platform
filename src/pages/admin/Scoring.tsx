import { useState, useEffect } from 'react';
import { 
  Calculator, Save, Plus, Edit2, Trash2, 
  TrendingUp, AlertCircle, Info, Settings,
  BarChart2, Activity, Target, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import type { 
  ScoringPolicyConfig, 
  GradeRange, 
  NormalizationType,
  OutlierRule 
} from '../../types/scoringPolicy';

const Scoring = () => {
  // 상태 관리
  const [policies, setPolicies] = useState<ScoringPolicyConfig[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<ScoringPolicyConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'normalization' | 'grades' | 'outliers' | 'special'>('normalization');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = () => {
    // 샘플 데이터
    const samplePolicy: ScoringPolicyConfig = {
      id: '1',
      name: '표준 스코어링 정책',
      description: '기본 점수 계산 및 정규화 정책',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      normalization: {
        global: {
          type: 'linear',
          linearMin: 0,
          linearMax: 100
        }
      },
      gradeRanges: [
        { grade: 'S', minScore: 95, maxScore: 100, color: 'bg-yellow-500', label: '최우수' },
        { grade: 'A', minScore: 85, maxScore: 94, color: 'bg-green-500', label: '우수' },
        { grade: 'B', minScore: 70, maxScore: 84, color: 'bg-blue-500', label: '양호' },
        { grade: 'C', minScore: 55, maxScore: 69, color: 'bg-orange-500', label: '보통' },
        { grade: 'D', minScore: 40, maxScore: 54, color: 'bg-red-500', label: '미흡' },
        { grade: 'F', minScore: 0, maxScore: 39, color: 'bg-gray-500', label: '부진' }
      ],
      outlierRules: [],
      scoreRange: {
        min: 0,
        max: 100,
        precision: 2
      },
      useBenchmark: false,
      specialRules: {
        minimumScore: 0,
        maximumScore: 100,
        zeroHandling: 'default',
        missingDataHandling: 'average'
      }
    };
    
    setPolicies([samplePolicy]);
    setSelectedPolicy(samplePolicy);
  };

  // 정규화 타입 변경
  const updateNormalizationType = (type: NormalizationType) => {
    if (!selectedPolicy || !isEditing) return;
    
    setSelectedPolicy({
      ...selectedPolicy,
      normalization: {
        ...selectedPolicy.normalization,
        global: {
          ...selectedPolicy.normalization.global,
          type
        }
      }
    });
  };

  // 정규화 파라미터 업데이트
  const updateNormalizationParam = (param: string, value: number) => {
    if (!selectedPolicy || !isEditing) return;
    
    setSelectedPolicy({
      ...selectedPolicy,
      normalization: {
        ...selectedPolicy.normalization,
        global: {
          ...selectedPolicy.normalization.global,
          [param]: value
        }
      }
    });
  };

  // 등급 구간 업데이트
  const updateGradeRange = (index: number, field: keyof GradeRange, value: any) => {
    if (!selectedPolicy || !isEditing) return;
    
    const newGrades = [...selectedPolicy.gradeRanges];
    newGrades[index] = { ...newGrades[index], [field]: value };
    
    setSelectedPolicy({
      ...selectedPolicy,
      gradeRanges: newGrades
    });
  };

  // 등급 추가
  const addGradeRange = () => {
    if (!selectedPolicy || !isEditing) return;
    
    const newGrade: GradeRange = {
      grade: 'NEW',
      minScore: 0,
      maxScore: 100,
      color: 'bg-gray-500',
      label: '새 등급'
    };
    
    setSelectedPolicy({
      ...selectedPolicy,
      gradeRanges: [...selectedPolicy.gradeRanges, newGrade]
    });
  };

  // 등급 삭제
  const removeGradeRange = (index: number) => {
    if (!selectedPolicy || !isEditing) return;
    
    const newGrades = selectedPolicy.gradeRanges.filter((_, i) => i !== index);
    
    setSelectedPolicy({
      ...selectedPolicy,
      gradeRanges: newGrades
    });
  };

  // 이상치 규칙 추가
  const addOutlierRule = () => {
    if (!selectedPolicy || !isEditing) return;
    
    const newRule: OutlierRule = {
      field: '',
      method: 'zscore',
      threshold: 3,
      action: 'flag'
    };
    
    setSelectedPolicy({
      ...selectedPolicy,
      outlierRules: [...selectedPolicy.outlierRules, newRule]
    });
  };

  // 이상치 규칙 업데이트
  const updateOutlierRule = (index: number, field: keyof OutlierRule, value: any) => {
    if (!selectedPolicy || !isEditing) return;
    
    const newRules = [...selectedPolicy.outlierRules];
    newRules[index] = { ...newRules[index], [field]: value };
    
    setSelectedPolicy({
      ...selectedPolicy,
      outlierRules: newRules
    });
  };

  // 이상치 규칙 삭제
  const removeOutlierRule = (index: number) => {
    if (!selectedPolicy || !isEditing) return;
    
    const newRules = selectedPolicy.outlierRules.filter((_, i) => i !== index);
    
    setSelectedPolicy({
      ...selectedPolicy,
      outlierRules: newRules
    });
  };

  // 특별 규칙 업데이트
  const updateSpecialRule = (field: string, value: any) => {
    if (!selectedPolicy || !isEditing) return;
    
    setSelectedPolicy({
      ...selectedPolicy,
      specialRules: {
        ...selectedPolicy.specialRules,
        [field]: value
      }
    });
  };

  // 정책 저장
  const savePolicy = () => {
    if (!selectedPolicy) return;
    
    // 실제로는 API 호출
    console.log('Saving policy:', selectedPolicy);
    setIsEditing(false);
  };

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-dark">스코어링 정책 관리</h1>
            <p className="text-sm text-neutral-gray mt-1">
              점수 계산, 정규화, 등급 구간을 설정합니다
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2"
                >
                  <X size={16} />
                  취소
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={savePolicy}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  저장
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="small"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit2 size={16} />
                편집
              </Button>
            )}
          </div>
        </div>

        {/* 정책 선택 */}
        <div className="bg-white p-4 rounded-lg border border-neutral-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-neutral-dark">
                활성 정책:
              </label>
              <select
                value={selectedPolicy?.id || ''}
                onChange={(e) => {
                  const policy = policies.find(p => p.id === e.target.value);
                  setSelectedPolicy(policy || null);
                }}
                className="px-3 py-1.5 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
              >
                {policies.map(policy => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name} {policy.isActive && '(활성)'}
                  </option>
                ))}
              </select>
            </div>
            {selectedPolicy?.description && (
              <div className="flex items-center gap-2 text-sm text-neutral-gray">
                <Info size={16} />
                {selectedPolicy.description}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPolicy && (
        <>
          {/* 탭 네비게이션 */}
          <div className="bg-white border-b border-neutral-border mb-6">
            <div className="flex">
              {[
                { key: 'normalization', label: '정규화', icon: Activity },
                { key: 'grades', label: '등급 구간', icon: BarChart2 },
                { key: 'outliers', label: '이상치 처리', icon: AlertCircle },
                { key: 'special', label: '특별 규칙', icon: Settings }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-3 flex items-center gap-2 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-primary-main text-primary-main'
                        : 'border-transparent text-neutral-gray hover:text-neutral-dark'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="space-y-6">
            {/* 정규화 탭 */}
            {activeTab === 'normalization' && (
              <div className="bg-white rounded-lg border border-neutral-border p-6">
                <h2 className="text-lg font-semibold text-neutral-dark mb-4">
                  정규화 설정
                </h2>
                
                {/* 정규화 방식 선택 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    정규화 방식
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['linear', 'logarithmic', 'exponential', 'custom'] as NormalizationType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => updateNormalizationType(type)}
                        disabled={!isEditing}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedPolicy.normalization.global.type === type
                            ? 'bg-primary-main text-white border-primary-main'
                            : 'bg-white text-neutral-gray border-neutral-border hover:border-primary-main'
                        } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {type === 'linear' && 'Linear'}
                        {type === 'logarithmic' && 'Logarithmic'}
                        {type === 'exponential' && 'Exponential'}
                        {type === 'custom' && 'Custom'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 정규화 파라미터 */}
                {selectedPolicy.normalization.global.type === 'linear' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-2">
                        최소값
                      </label>
                      <input
                        type="number"
                        value={selectedPolicy.normalization.global.linearMin || 0}
                        onChange={(e) => updateNormalizationParam('linearMin', Number(e.target.value))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-2">
                        최대값
                      </label>
                      <input
                        type="number"
                        value={selectedPolicy.normalization.global.linearMax || 100}
                        onChange={(e) => updateNormalizationParam('linearMax', Number(e.target.value))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {selectedPolicy.normalization.global.type === 'logarithmic' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-2">
                      로그 베이스
                    </label>
                    <input
                      type="number"
                      value={selectedPolicy.normalization.global.logBase || 10}
                      onChange={(e) => updateNormalizationParam('logBase', Number(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                    />
                  </div>
                )}

                {selectedPolicy.normalization.global.type === 'exponential' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-2">
                      지수
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedPolicy.normalization.global.expPower || 2}
                      onChange={(e) => updateNormalizationParam('expPower', Number(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                    />
                  </div>
                )}

                {selectedPolicy.normalization.global.type === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-2">
                      커스텀 수식
                    </label>
                    <textarea
                      value={selectedPolicy.normalization.global.customFormula || ''}
                      onChange={(e) => updateNormalizationParam('customFormula', e.target.value)}
                      disabled={!isEditing}
                      placeholder="예: (x - min) / (max - min) * 100"
                      className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                      rows={3}
                    />
                  </div>
                )}

                {/* 점수 범위 설정 */}
                <div className="mt-6 pt-6 border-t border-neutral-border">
                  <h3 className="font-medium text-neutral-dark mb-4">점수 범위</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-2">
                        최소 점수
                      </label>
                      <input
                        type="number"
                        value={selectedPolicy.scoreRange.min}
                        onChange={(e) => setSelectedPolicy({
                          ...selectedPolicy,
                          scoreRange: { ...selectedPolicy.scoreRange, min: Number(e.target.value) }
                        })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-2">
                        최대 점수
                      </label>
                      <input
                        type="number"
                        value={selectedPolicy.scoreRange.max}
                        onChange={(e) => setSelectedPolicy({
                          ...selectedPolicy,
                          scoreRange: { ...selectedPolicy.scoreRange, max: Number(e.target.value) }
                        })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-2">
                        소수점 자리수
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={selectedPolicy.scoreRange.precision}
                        onChange={(e) => setSelectedPolicy({
                          ...selectedPolicy,
                          scoreRange: { ...selectedPolicy.scoreRange, precision: Number(e.target.value) }
                        })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 등급 구간 탭 */}
            {activeTab === 'grades' && (
              <div className="bg-white rounded-lg border border-neutral-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-dark">
                    등급 구간 설정
                  </h2>
                  {isEditing && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={addGradeRange}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      등급 추가
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedPolicy.gradeRanges.map((grade, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-20">
                        <input
                          type="text"
                          value={grade.grade}
                          onChange={(e) => updateGradeRange(index, 'grade', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-2 py-1 text-center font-bold border border-neutral-border rounded"
                        />
                      </div>
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-neutral-gray">최소 점수</label>
                          <input
                            type="number"
                            value={grade.minScore}
                            onChange={(e) => updateGradeRange(index, 'minScore', Number(e.target.value))}
                            disabled={!isEditing}
                            className="w-full px-2 py-1 border border-neutral-border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-gray">최대 점수</label>
                          <input
                            type="number"
                            value={grade.maxScore}
                            onChange={(e) => updateGradeRange(index, 'maxScore', Number(e.target.value))}
                            disabled={!isEditing}
                            className="w-full px-2 py-1 border border-neutral-border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-gray">라벨</label>
                          <input
                            type="text"
                            value={grade.label}
                            onChange={(e) => updateGradeRange(index, 'label', e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-2 py-1 border border-neutral-border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-gray">색상</label>
                          <select
                            value={grade.color}
                            onChange={(e) => updateGradeRange(index, 'color', e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-2 py-1 border border-neutral-border rounded"
                          >
                            <option value="bg-yellow-500">노란색</option>
                            <option value="bg-green-500">초록색</option>
                            <option value="bg-blue-500">파란색</option>
                            <option value="bg-orange-500">주황색</option>
                            <option value="bg-red-500">빨간색</option>
                            <option value="bg-gray-500">회색</option>
                          </select>
                        </div>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeGradeRange(index)}
                          className="p-2 text-accent-red hover:bg-accent-red-light rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 등급 시각화 */}
                <div className="mt-6 pt-6 border-t border-neutral-border">
                  <h3 className="font-medium text-neutral-dark mb-3">등급 분포 미리보기</h3>
                  <div className="flex items-center gap-2">
                    {selectedPolicy.gradeRanges
                      .sort((a, b) => b.minScore - a.minScore)
                      .map((grade, index) => (
                        <div
                          key={index}
                          className="flex-1 text-center"
                          style={{ flex: `0 0 ${grade.maxScore - grade.minScore}%` }}
                        >
                          <div className={`${grade.color} text-white py-2 px-3 rounded`}>
                            <div className="font-bold">{grade.grade}</div>
                            <div className="text-xs opacity-90">{grade.label}</div>
                            <div className="text-xs opacity-75">
                              {grade.minScore}-{grade.maxScore}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* 이상치 처리 탭 */}
            {activeTab === 'outliers' && (
              <div className="bg-white rounded-lg border border-neutral-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-dark">
                    이상치 처리 규칙
                  </h2>
                  {isEditing && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={addOutlierRule}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      규칙 추가
                    </Button>
                  )}
                </div>

                {selectedPolicy.outlierRules.length === 0 ? (
                  <p className="text-sm text-neutral-gray">이상치 처리 규칙이 없습니다</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPolicy.outlierRules.map((rule, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-neutral-gray mb-1">필드</label>
                            <input
                              type="text"
                              value={rule.field}
                              onChange={(e) => updateOutlierRule(index, 'field', e.target.value)}
                              disabled={!isEditing}
                              placeholder="KPI ID 또는 축"
                              className="w-full px-2 py-1 border border-neutral-border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-gray mb-1">방법</label>
                            <select
                              value={rule.method}
                              onChange={(e) => updateOutlierRule(index, 'method', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-2 py-1 border border-neutral-border rounded"
                            >
                              <option value="zscore">Z-Score</option>
                              <option value="iqr">IQR</option>
                              <option value="percentile">Percentile</option>
                              <option value="fixed">Fixed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-gray mb-1">임계값</label>
                            <input
                              type="number"
                              value={rule.threshold}
                              onChange={(e) => updateOutlierRule(index, 'threshold', Number(e.target.value))}
                              disabled={!isEditing}
                              className="w-full px-2 py-1 border border-neutral-border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-gray mb-1">처리 방법</label>
                            <select
                              value={rule.action}
                              onChange={(e) => updateOutlierRule(index, 'action', e.target.value as any)}
                              disabled={!isEditing}
                              className="w-full px-2 py-1 border border-neutral-border rounded"
                            >
                              <option value="flag">표시</option>
                              <option value="cap">제한</option>
                              <option value="remove">제거</option>
                            </select>
                          </div>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removeOutlierRule(index)}
                            className="mt-2 text-sm text-accent-red hover:underline"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 특별 규칙 탭 */}
            {activeTab === 'special' && (
              <div className="bg-white rounded-lg border border-neutral-border p-6">
                <h2 className="text-lg font-semibold text-neutral-dark mb-4">
                  특별 규칙
                </h2>

                <div className="space-y-6">
                  {/* 점수 제한 */}
                  <div>
                    <h3 className="font-medium text-neutral-dark mb-3">점수 제한</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-dark mb-2">
                          최소 점수 보장
                        </label>
                        <input
                          type="number"
                          value={selectedPolicy.specialRules?.minimumScore || 0}
                          onChange={(e) => updateSpecialRule('minimumScore', Number(e.target.value))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-dark mb-2">
                          최대 점수 제한
                        </label>
                        <input
                          type="number"
                          value={selectedPolicy.specialRules?.maximumScore || 100}
                          onChange={(e) => updateSpecialRule('maximumScore', Number(e.target.value))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 데이터 처리 */}
                  <div>
                    <h3 className="font-medium text-neutral-dark mb-3">데이터 처리</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-dark mb-2">
                          0점 처리
                        </label>
                        <select
                          value={selectedPolicy.specialRules?.zeroHandling || 'default'}
                          onChange={(e) => updateSpecialRule('zeroHandling', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                        >
                          <option value="exclude">제외</option>
                          <option value="penalize">페널티</option>
                          <option value="default">기본값</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-dark mb-2">
                          누락 데이터 처리
                        </label>
                        <select
                          value={selectedPolicy.specialRules?.missingDataHandling || 'average'}
                          onChange={(e) => updateSpecialRule('missingDataHandling', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                        >
                          <option value="exclude">제외</option>
                          <option value="average">평균값</option>
                          <option value="default">기본값</option>
                          <option value="zero">0점</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 벤치마크 사용 */}
                  <div>
                    <h3 className="font-medium text-neutral-dark mb-3">벤치마크</h3>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="useBenchmark"
                        checked={selectedPolicy.useBenchmark}
                        onChange={(e) => setSelectedPolicy({
                          ...selectedPolicy,
                          useBenchmark: e.target.checked
                        })}
                        disabled={!isEditing}
                        className="rounded border-neutral-border"
                      />
                      <label htmlFor="useBenchmark" className="text-sm font-medium text-neutral-dark">
                        벤치마크 데이터 사용
                      </label>
                    </div>
                    {selectedPolicy.useBenchmark && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={selectedPolicy.benchmarkDataId || ''}
                          onChange={(e) => setSelectedPolicy({
                            ...selectedPolicy,
                            benchmarkDataId: e.target.value
                          })}
                          disabled={!isEditing}
                          placeholder="벤치마크 데이터 ID"
                          className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Scoring;