import { useState } from 'react';
import { useCluster } from '../../contexts/ClusterContext';
import PhaseTransitionTestPanel from '../../components/test/PhaseTransitionTestPanel';
import { ScheduleModalTest } from '../../components/schedule/ScheduleModalTest';

const TestPage = () => {
  const { cluster } = useCluster();
  const [activeTest, setActiveTest] = useState<'phase-transition' | 'schedule-modal' | 'cluster'>('phase-transition');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">🧪 시스템 테스트 페이지</h1>

      {/* 테스트 선택 탭 */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTest('phase-transition')}
          className={`px-4 py-2 rounded-lg ${
            activeTest === 'phase-transition'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Phase Transition 테스트
        </button>
        <button
          onClick={() => setActiveTest('schedule-modal')}
          className={`px-4 py-2 rounded-lg ${
            activeTest === 'schedule-modal'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Schedule Modal 테스트
        </button>
        <button
          onClick={() => setActiveTest('cluster')}
          className={`px-4 py-2 rounded-lg ${
            activeTest === 'cluster'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Cluster Context 테스트
        </button>
      </div>

      {/* 선택된 테스트 표시 */}
      {activeTest === 'phase-transition' && <PhaseTransitionTestPanel />}

      {activeTest === 'schedule-modal' && <ScheduleModalTest />}

      {activeTest === 'cluster' && (
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Cluster Context 테스트</h2>
          <p>현재 섹터: {cluster.sector}</p>
          <p>현재 단계: {cluster.stage}</p>
          <p className="mt-4 text-green-600">✅ ClusterContext가 정상 작동합니다.</p>
        </div>
      )}
    </div>
  );
};

export default TestPage;