import React, { useState } from 'react';
import {
  Building2,
  Globe,
  Calendar,
  Users,
  MapPin,
  Briefcase,
  TrendingUp,
  Edit3,
  Check,
  X,
  DollarSign,
  Target,
  Sparkles,
  Rocket,
  Award
} from 'lucide-react';
import { useMyProfile } from '../../contexts/MyProfileContext';

interface BasicInfoCardProps {
  isEditing?: boolean;
  viewMode: 'public' | 'investors' | 'team' | 'private';
}

const BasicInfoCard: React.FC<BasicInfoCardProps> = ({ isEditing = false, viewMode }) => {
  const { profile, updateCompany, updateBusiness, updateFunding } = useMyProfile();
  const [localEditing, setLocalEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: profile?.company.name || '',
    description: profile?.company.description || '',
    website: profile?.company.website || '',
    foundedYear: profile?.company.foundedYear || new Date().getFullYear(),
    employeeCount: profile?.company.employeeCount || '1-5명',
    industry: profile?.business.industry || '',
    businessModel: profile?.business.businessModel || 'B2B',
    currentStage: profile?.funding.currentStage || 'pre-seed'
  });

  const handleSave = async () => {
    await updateCompany({
      name: editData.name,
      description: editData.description,
      website: editData.website,
      foundedYear: editData.foundedYear,
      employeeCount: editData.employeeCount as any
    });
    await updateBusiness({
      industry: editData.industry,
      businessModel: editData.businessModel as any
    });
    await updateFunding({
      currentStage: editData.currentStage as any
    });
    setLocalEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: profile?.company.name || '',
      description: profile?.company.description || '',
      website: profile?.company.website || '',
      foundedYear: profile?.company.foundedYear || new Date().getFullYear(),
      employeeCount: profile?.company.employeeCount || '1-5명',
      industry: profile?.business.industry || '',
      businessModel: profile?.business.businessModel || 'B2B',
      currentStage: profile?.funding.currentStage || 'pre-seed'
    });
    setLocalEditing(false);
  };

  // 펀딩 스테이지 라벨 및 색상
  const getStageInfo = (stage: string) => {
    const stages = {
      'pre-seed': { label: 'Pre-Seed', color: 'bg-gray-100 text-gray-700', icon: Sparkles },
      'seed': { label: 'Seed', color: 'bg-green-100 text-green-700', icon: Rocket },
      'series-a': { label: 'Series A', color: 'bg-blue-100 text-blue-700', icon: TrendingUp },
      'series-b+': { label: 'Series B+', color: 'bg-purple-100 text-purple-700', icon: Award },
      'exit': { label: 'Exit', color: 'bg-yellow-100 text-yellow-700', icon: DollarSign },
      '기타': { label: '기타', color: 'bg-gray-100 text-gray-600', icon: Target }
    };
    return stages[stage as keyof typeof stages] || stages['기타'];
  };

  const stageInfo = getStageInfo(editData.currentStage);
  const StageIcon = stageInfo.icon;

  if (!profile) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* 헤더 영역 */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              {localEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="text-xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none px-1"
                  placeholder="회사명"
                />
              ) : (
                <h3 className="text-xl font-bold text-gray-900">
                  {profile.company.name || '회사명 미입력'}
                </h3>
              )}
              {localEditing ? (
                <select
                  value={editData.industry}
                  onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                  className="text-sm text-gray-600 mt-1 border rounded px-2 py-1"
                >
                  <option value="">산업 선택</option>
                  <option value="AI/머신러닝">AI/머신러닝</option>
                  <option value="핀테크">핀테크</option>
                  <option value="헬스케어">헬스케어</option>
                  <option value="이커머스">이커머스</option>
                  <option value="에듀테크">에듀테크</option>
                  <option value="SaaS">SaaS</option>
                  <option value="모빌리티">모빌리티</option>
                  <option value="미디어/콘텐츠">미디어/콘텐츠</option>
                  <option value="기타">기타</option>
                </select>
              ) : (
                <p className="text-sm text-gray-600">{profile.business.industry || '산업 미설정'}</p>
              )}
            </div>
          </div>

          {/* 편집 버튼 */}
          <div className="flex gap-2">
            {localEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  title="저장"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  title="취소"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setLocalEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="편집"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 설명 */}
        {localEditing ? (
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full p-3 border rounded-lg text-sm text-gray-700 mb-4 resize-none"
            rows={3}
            placeholder="회사 소개를 입력하세요..."
          />
        ) : (
          profile.company.description && (
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              {profile.company.description}
            </p>
          )
        )}

        {/* 주요 정보 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 설립연도 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">설립</p>
              {localEditing ? (
                <input
                  type="number"
                  value={editData.foundedYear}
                  onChange={(e) => setEditData({ ...editData, foundedYear: parseInt(e.target.value) })}
                  className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 w-20"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {profile.company.foundedYear || '미입력'}년
                </p>
              )}
            </div>
          </div>

          {/* 팀 규모 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">규모</p>
              {localEditing ? (
                <select
                  value={editData.employeeCount}
                  onChange={(e) => setEditData({ ...editData, employeeCount: e.target.value })}
                  className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300"
                >
                  <option value="1-5명">1-5명</option>
                  <option value="6-20명">6-20명</option>
                  <option value="21-50명">21-50명</option>
                  <option value="51-200명">51-200명</option>
                  <option value="200명+">200명+</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-gray-900">{profile.company.employeeCount}</p>
              )}
            </div>
          </div>

          {/* 비즈니스 모델 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">모델</p>
              {localEditing ? (
                <select
                  value={editData.businessModel}
                  onChange={(e) => setEditData({ ...editData, businessModel: e.target.value })}
                  className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300"
                >
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="B2B2C">B2B2C</option>
                  <option value="Marketplace">Marketplace</option>
                  <option value="SaaS">SaaS</option>
                  <option value="기타">기타</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-gray-900">{profile.business.businessModel}</p>
              )}
            </div>
          </div>

          {/* 웹사이트 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Globe className="w-4 h-4 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">웹사이트</p>
              {localEditing ? (
                <input
                  type="url"
                  value={editData.website}
                  onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                  className="text-sm font-medium text-blue-600 bg-transparent border-b border-gray-300 w-full"
                  placeholder="https://example.com"
                />
              ) : (
                profile.company.website ? (
                  <a
                    href={profile.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline truncate block"
                  >
                    {profile.company.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-400">미입력</p>
                )
              )}
            </div>
          </div>
        </div>

        {/* 펀딩 스테이지 - 투자자/팀/비공개 모드에서만 표시 */}
        {(viewMode === 'investors' || viewMode === 'team' || viewMode === 'private') && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StageIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">펀딩 스테이지</span>
              </div>
              {localEditing ? (
                <select
                  value={editData.currentStage}
                  onChange={(e) => setEditData({ ...editData, currentStage: e.target.value })}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${stageInfo.color}`}
                >
                  <option value="pre-seed">Pre-Seed</option>
                  <option value="seed">Seed</option>
                  <option value="series-a">Series A</option>
                  <option value="series-b+">Series B+</option>
                  <option value="exit">Exit</option>
                  <option value="기타">기타</option>
                </select>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${stageInfo.color}`}>
                  {stageInfo.label}
                </span>
              )}
            </div>

            {/* 투자 유치 중 표시 */}
            {profile.funding.isSeekingFunding && (
              <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">투자 유치 중</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 위치 정보 */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>
            {profile.company.address.city || '도시 미입력'}
            {profile.company.address.country && `, ${profile.company.address.country}`}
            {profile.company.address.isRemote && ' (원격 근무)'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoCard;