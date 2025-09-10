import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import type { KPIDefinition, AxisKey } from '../../types';

const KPIManagement = () => {
  const [kpis, setKpis] = useState<KPIDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAxis, setSelectedAxis] = useState<AxisKey | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPIDefinition | null>(null);

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      setIsLoading(true);
      // ?�제로는 API ?�출
      // const response = await api.admin.getKPIs();
      // setKpis(response.kpis);
      
      // ?�시 ?�이??      const { libraries } = await import('../../data/kpiLoader').then(m => m.loadKPIData());
      setKpis(libraries);
    } catch (error) {
      console.error('Failed to load KPIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (kpiId: string) => {
    if (!confirm('?�말�???KPI�???��?�시겠습?�까?')) return;
    
    try {
      await api.admin.deleteKPI(kpiId);
      await loadKPIs();
      alert('KPI가 ??��?�었?�니??');
    } catch (error) {
      alert('??�� �??�류가 발생?�습?�다.');
    }
  };

  const filteredKPIs = kpis.filter(kpi => {
    if (selectedAxis !== 'all' && kpi.axis !== selectedAxis) return false;
    if (selectedStage !== 'all' && !kpi.applicable_stages?.includes(selectedStage)) return false;
    if (searchTerm && !kpi.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const axes = [
    { key: 'all', name: '?�체' },
    { key: 'GO', name: 'Growth Opportunity' },
    { key: 'EC', name: 'Economic Value' },
    { key: 'PT', name: 'Product Technology' },
    { key: 'PF', name: 'Performance Finance' },
    { key: 'TO', name: 'Team Organization' }
  ];

  const stages = [
    { key: 'all', name: '?�체' },
    { key: 'A-1', name: 'A-1 (?�이?�어)' },
    { key: 'A-2', name: 'A-2 (초기)' },
    { key: 'A-3', name: 'A-3 (?�장)' },
    { key: 'A-4', name: 'A-4 (?�장)' },
    { key: 'A-5', name: 'A-5 (?�숙)' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark">KPI 관리</h1>
            <p className="text-neutral-gray mt-2">?��? 지?��? 관리하�??�정?????�습?�다.</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            ??KPI 추�?
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-gray" />
              <input
                type="text"
                placeholder="KPI 검??.."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-border rounded-lg
                  focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-50"
              />
            </div>

            {/* Axis Filter */}
            <select
              value={selectedAxis}
              onChange={(e) => setSelectedAxis(e.target.value as AxisKey | 'all')}
              className="px-4 py-2 border border-neutral-border rounded-lg
                focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-50"
            >
              {axes.map(axis => (
                <option key={axis.key} value={axis.key}>{axis.name}</option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-4 py-2 border border-neutral-border rounded-lg
                focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-50"
            >
              {stages.map(stage => (
                <option key={stage.key} value={stage.key}>{stage.name}</option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* KPI List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardBody className="p-12 text-center">
              <p className="text-neutral-gray">KPI�?로드?�고 ?�습?�다...</p>
            </CardBody>
          </Card>
        ) : filteredKPIs.length === 0 ? (
          <Card>
            <CardBody className="p-12 text-center">
              <p className="text-neutral-gray">조건??맞는 KPI가 ?�습?�다.</p>
            </CardBody>
          </Card>
        ) : (
          filteredKPIs.map(kpi => (
            <Card key={kpi.kpi_id} className="hover:shadow-md transition-shadow">
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-neutral-gray">{kpi.kpi_id}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded
                        ${kpi.axis === 'GO' ? 'bg-blue-100 text-blue-800' :
                          kpi.axis === 'EC' ? 'bg-green-100 text-green-800' :
                          kpi.axis === 'PT' ? 'bg-purple-100 text-purple-800' :
                          kpi.axis === 'PF' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                        {kpi.axis}
                      </span>
                      <span className="px-2 py-1 text-xs bg-neutral-light text-neutral-gray rounded">
                        {kpi.input_type}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-dark mb-1">{kpi.title}</h3>
                    <p className="text-sm text-neutral-gray mb-2">{kpi.question}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-gray">
                      <span>?�용 ?�계:</span>
                      {kpi.applicable_stages?.map(stage => (
                        <span key={stage} className="px-2 py-0.5 bg-neutral-light rounded">
                          {stage}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="small"
                      onClick={() => setEditingKPI(kpi)}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="small"
                      onClick={() => handleDelete(kpi.kpi_id)}
                      className="text-accent-red hover:bg-accent-red-light"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* TODO: Create/Edit Modal */}
      {(showCreateModal || editingKPI) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingKPI ? 'KPI ?�정' : '??KPI 추�?'}
            </h2>
            {/* TODO: KPI Form Component */}
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingKPI(null);
                }}
              >
                취소
              </Button>
              <Button variant="primary">
                {editingKPI ? '?�정' : '추�?'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIManagement;
