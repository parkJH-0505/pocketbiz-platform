/**
 * Data Transformation Test Panel
 * 데이터 변환 및 정규화 시스템 테스트 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { DataTransformationEngine } from '../../services/ecosystem/pipeline/transform/DataTransformationEngine';
import type { TransformationResult, BatchTransformationResult } from '../../services/ecosystem/pipeline/transform/types';
import type { RawDataRecord } from '../../services/ecosystem/pipeline/types';

interface TransformationTest {
  id: string;
  name: string;
  description: string;
  sampleData: RawDataRecord;
  expectedResult: any;
}

export const DataTransformationTestPanel: React.FC = () => {
  const [transformationEngine] = useState(() => DataTransformationEngine.getInstance());
  const [testResults, setTestResults] = useState<TransformationResult[]>([]);
  const [batchResults, setBatchResults] = useState<BatchTransformationResult[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  // 테스트 샘플 데이터
  const testCases: TransformationTest[] = [
    {
      id: 'v2-scenario-test',
      name: 'V2 시나리오 변환',
      description: 'V2 시나리오 데이터를 통합 프로젝트로 변환',
      sampleData: {
        id: 'test-scenario-001',
        sourceId: 'v2-scenario-001',
        sourceType: 'v2',
        collectedAt: new Date(),
        quality: 'high',
        data: {
          type: 'scenario',
          title: '신제품 출시 시나리오',
          description: '새로운 모바일 앱 출시를 위한 전체 시나리오',
          status: 'active',
          priority: 'high',
          phase: 'planning',
          progress: 25,
          startDate: '2024-01-15',
          endDate: '2024-06-30',
          budget: 50000000,
          pmId: 'pm-001',
          pmName: '김프로',
          teamMembers: ['dev-001', 'dev-002', 'designer-001'],
          stakeholders: ['stakeholder-001'],
          projectedScores: {
            GO: 85,
            EC: 70,
            PT: 90,
            PF: 75,
            TO: 80
          },
          expectedOutcomes: [
            '월 활성 사용자 10만명 달성',
            '매출 20% 증대',
            '브랜드 인지도 향상'
          ],
          riskFactors: [
            '경쟁사 유사 제품 출시',
            '개발 일정 지연 가능성'
          ],
          successFactors: [
            '차별화된 UX/UI',
            '강력한 마케팅 전략'
          ],
          tags: ['mobile', 'app', 'launch', 'high-priority']
        }
      },
      expectedResult: {
        type: 'project',
        title: '신제품 출시 시나리오'
      }
    },
    {
      id: 'calendar-event-test',
      name: '캘린더 이벤트 변환',
      description: '캘린더 이벤트를 통합 이벤트로 변환',
      sampleData: {
        id: 'test-event-001',
        sourceId: 'calendar-event-001',
        sourceType: 'calendar',
        collectedAt: new Date(),
        quality: 'high',
        data: {
          type: 'event',
          title: '프로젝트 킥오프 미팅',
          description: '신제품 출시 프로젝트 킥오프 미팅',
          startTime: '2024-01-20T09:00:00Z',
          endTime: '2024-01-20T10:30:00Z',
          timezone: 'Asia/Seoul',
          eventType: 'meeting',
          attendees: [
            {
              id: 'pm-001',
              name: '김프로',
              email: 'pm@company.com',
              role: 'organizer',
              responseStatus: 'accepted'
            },
            {
              id: 'dev-001',
              name: '이개발',
              email: 'dev1@company.com',
              role: 'required',
              responseStatus: 'accepted'
            }
          ],
          location: '회의실 A',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          projectId: 'project-001',
          projectTitle: '신제품 출시 프로젝트',
          agenda: '프로젝트 목표 및 일정 공유',
          tags: ['kickoff', 'meeting', 'project']
        }
      },
      expectedResult: {
        type: 'event',
        title: '프로젝트 킥오프 미팅'
      }
    },
    {
      id: 'buildup-project-test',
      name: 'Buildup 프로젝트 변환',
      description: 'Buildup 프로젝트 데이터를 통합 프로젝트로 변환',
      sampleData: {
        id: 'test-buildup-001',
        sourceId: 'buildup-project-001',
        sourceType: 'buildup',
        collectedAt: new Date(),
        quality: 'high',
        data: {
          type: 'project',
          name: '고객 만족도 개선 프로젝트',
          description: '고객 서비스 품질 향상을 통한 만족도 개선',
          status: 'active',
          priority: 'high',
          phase: 'execution',
          progress: 60,
          startDate: '2024-01-01',
          targetDate: '2024-03-31',
          budget: 30000000,
          ownerId: 'owner-001',
          ownerName: '박매니저',
          collaborators: ['collab-001', 'collab-002'],
          stakeholders: ['stakeholder-002'],
          expectedResults: {
            GO: 75,
            EC: 85,
            PT: 70,
            PF: 80,
            TO: 78
          },
          outcomes: [
            '고객 만족도 90점 달성',
            '고객 이탈률 20% 감소',
            '리뷰 점수 4.5점 이상'
          ],
          risks: [
            '직원 교육 시간 부족',
            '시스템 안정성 이슈'
          ],
          successFactors: [
            '체계적인 교육 프로그램',
            '실시간 피드백 시스템'
          ],
          tasks: [
            { id: 'task-001', title: '고객 설문조사 실시', completed: true },
            { id: 'task-002', title: '서비스 프로세스 개선', completed: false }
          ],
          tags: ['customer', 'satisfaction', 'improvement']
        }
      },
      expectedResult: {
        type: 'project',
        title: '고객 만족도 개선 프로젝트'
      }
    }
  ];

  // 개별 변환 테스트 실행
  const runSingleTest = async (testCase: TransformationTest) => {
    setIsRunning(true);
    try {
      console.log(`[TransformationTest] Running test: ${testCase.name}`);
      const result = await transformationEngine.transform(testCase.sampleData, 'test-user');

      setTestResults(prev => [...prev, result]);

      console.log(`[TransformationTest] Test ${testCase.name} completed:`, {
        success: result.success,
        entityType: result.entity?.type,
        qualityScore: result.qualityScore,
        errors: result.errors.length
      });

    } catch (error) {
      console.error(`[TransformationTest] Test ${testCase.name} failed:`, error);
    } finally {
      setIsRunning(false);
    }
  };

  // 배치 변환 테스트 실행
  const runBatchTest = async () => {
    setIsRunning(true);
    try {
      console.log('[TransformationTest] Running batch transformation test');
      const sampleRecords = testCases.map(tc => tc.sampleData);

      const result = await transformationEngine.transformBatch(sampleRecords, 'test-user');
      setBatchResults(prev => [...prev, result]);

      console.log('[TransformationTest] Batch test completed:', {
        totalRecords: result.totalRecords,
        successful: result.successfulTransforms,
        failed: result.failedTransforms,
        throughput: result.performance.throughput
      });

    } catch (error) {
      console.error('[TransformationTest] Batch test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // 매핑 통계 조회
  const [mappingStats, setMappingStats] = useState<any>(null);
  useEffect(() => {
    setMappingStats(transformationEngine.getMappingStatistics());
  }, [transformationEngine]);

  // 결과 초기화
  const clearResults = () => {
    setTestResults([]);
    setBatchResults([]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">데이터 변환 테스트</h2>
          <p className="text-sm text-gray-600 mt-1">
            데이터 변환 및 정규화 시스템 테스트 및 모니터링
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearResults}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            결과 초기화
          </button>
        </div>
      </div>

      {/* 매핑 통계 */}
      {mappingStats && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">변환 매핑 통계</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">전체 매핑:</span>
              <span className="ml-2 font-medium">{mappingStats.totalMappings}개</span>
            </div>
            <div>
              <span className="text-blue-700">소스 타입:</span>
              <span className="ml-2 font-medium">{Object.keys(mappingStats.mappingsBySourceType).length}개</span>
            </div>
            <div>
              <span className="text-blue-700">타겟 타입:</span>
              <span className="ml-2 font-medium">{Object.keys(mappingStats.mappingsByTargetType).length}개</span>
            </div>
          </div>
        </div>
      )}

      {/* 개별 테스트 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">개별 변환 테스트</h3>
        <div className="grid gap-4">
          {testCases.map((testCase) => (
            <div key={testCase.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{testCase.name}</h4>
                  <p className="text-sm text-gray-600">{testCase.description}</p>
                </div>
                <button
                  onClick={() => runSingleTest(testCase)}
                  disabled={isRunning}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isRunning ? '실행 중...' : '테스트 실행'}
                </button>
              </div>
              <div className="text-xs text-gray-500">
                소스: {testCase.sampleData.sourceType} | 타입: {testCase.sampleData.data.type}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 배치 테스트 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">배치 변환 테스트</h3>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">전체 테스트 케이스 배치 변환</h4>
              <p className="text-sm text-gray-600">
                모든 테스트 케이스를 한번에 변환하여 성능 및 처리율 측정
              </p>
            </div>
            <button
              onClick={runBatchTest}
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isRunning ? '실행 중...' : '배치 테스트'}
            </button>
          </div>
        </div>
      </div>

      {/* 개별 테스트 결과 */}
      {testResults.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">개별 변환 결과</h3>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      result.success ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">
                      {result.entity?.type || 'Unknown'} - {result.entity?.title || 'Untitled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>품질점수: {result.qualityScore}점</span>
                    <span>처리시간: {result.transformationTime}ms</span>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 rounded">
                    <h5 className="text-sm font-medium text-red-800 mb-1">오류:</h5>
                    <ul className="text-sm text-red-700 space-y-1">
                      {result.errors.map((error, i) => (
                        <li key={i}>• {error.message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.warnings.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded">
                    <h5 className="text-sm font-medium text-yellow-800 mb-1">경고:</h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {result.warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  ID: {result.sourceRecordId} | 변환시간: {new Date(result.transformedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 배치 테스트 결과 */}
      {batchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">배치 변환 결과</h3>
          <div className="space-y-4">
            {batchResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{result.totalRecords}</div>
                    <div className="text-sm text-gray-600">전체 레코드</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.successfulTransforms}</div>
                    <div className="text-sm text-gray-600">성공</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{result.failedTransforms}</div>
                    <div className="text-sm text-gray-600">실패</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{result.warnings}</div>
                    <div className="text-sm text-gray-600">경고</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t text-sm">
                  <div>
                    <span className="text-gray-600">처리시간:</span>
                    <span className="ml-2 font-medium">{result.performance.totalTime}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600">평균시간:</span>
                    <span className="ml-2 font-medium">{Math.round(result.performance.averageTime)}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600">처리율:</span>
                    <span className="ml-2 font-medium">{result.performance.throughput.toFixed(1)} records/sec</span>
                  </div>
                </div>

                {/* 요약 통계 */}
                <div className="mt-4 pt-4 border-t">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">변환 요약</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">소스 타입별:</span>
                      <div className="ml-4 mt-1">
                        {Object.entries(result.summary.bySourceType).map(([type, count]) => (
                          <div key={type}>{type}: {count}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">엔터티 타입별:</span>
                      <div className="ml-4 mt-1">
                        {Object.entries(result.summary.byEntityType).map(([type, count]) => (
                          <div key={type}>{type}: {count}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};