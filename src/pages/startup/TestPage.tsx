import { useCluster } from '../../contexts/ClusterContext';

const TestPage = () => {
  const { cluster } = useCluster();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">테스트 페이지</h1>
      <p>현재 섹터: {cluster.sector}</p>
      <p>현재 단계: {cluster.stage}</p>
      <p>이 페이지가 보인다면 ClusterContext는 정상 작동합니다.</p>
    </div>
  );
};

export default TestPage;