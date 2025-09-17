import React, { useState, useEffect } from 'react';
import {
  Filter
} from 'lucide-react';
import type {
  MatchingResult,
  EventCategory
} from '../../../../types/smartMatching';
import { mockRecommendations, additionalMockEvents } from '../../../../data/smartMatching/mockEvents';
import EventCard from '../../../../components/smartMatching/EventCard';


// 지원분야 필터 옵션
const supportFieldOptions = [
  '전체',
  '판로·해외진출·글로벌',
  '시설·공간·보육',
  'R&D 및 사업화 자금',
  '멘토링·컨설팅·교육',
  '융자'
];

// 카테고리 필터 옵션
const categoryOptions = [
  { value: 'all', label: '전체' },
  { value: 'government_support', label: '정부지원사업' },
  { value: 'tips_program', label: 'TIPS/DIPS/RIPS' },
  { value: 'vc_opportunity', label: '투자 프로그램' },
  { value: 'accelerator', label: '액셀러레이터' },
  { value: 'open_innovation', label: '오픈이노베이션' },
  { value: 'loan_program', label: '융자 프로그램' },
  { value: 'bidding', label: '입찰' }
];

const AllOpportunities: React.FC = () => {
  const [allEvents, setAllEvents] = useState<MatchingResult[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MatchingResult[]>([]);
  const [selectedSupportField, setSelectedSupportField] = useState('전체');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 전체 이벤트 데이터 로드
  useEffect(() => {
    const combinedEvents = [...mockRecommendations, ...additionalMockEvents];
    setAllEvents(combinedEvents);
    setFilteredEvents(combinedEvents);
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = allEvents;

    // 지원분야 필터
    if (selectedSupportField !== '전체') {
      filtered = filtered.filter(event =>
        (event.event as any).supportField === selectedSupportField
      );
    }

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event =>
        event.event.category === selectedCategory
      );
    }

    // 키워드 검색
    if (searchKeyword) {
      filtered = filtered.filter(event =>
        event.event.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        event.event.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        event.event.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchKeyword.toLowerCase())
        )
      );
    }

    setFilteredEvents(filtered);
  }, [allEvents, selectedSupportField, selectedCategory, searchKeyword]);


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">전체 기회</h1>
              <p className="text-sm text-gray-500 mt-1">모든 지원 기회를 확인하고 필터링하세요</p>
            </div>
            <div className="text-sm text-gray-500">
              총 {filteredEvents.length}개 기회
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">필터</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                키워드 검색
              </label>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="프로그램명, 설명, 키워드..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 지원분야 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지원분야
              </label>
              <select
                value={selectedSupportField}
                onChange={(e) => setSelectedSupportField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {supportFieldOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* 카테고리 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* 초기화 버튼 */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedSupportField('전체');
                  setSelectedCategory('all');
                  setSearchKeyword('');
                }}
                className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {/* 이벤트 목록 */}
        <div className="space-y-4">
          {filteredEvents.map((result) => (
            <EventCard
              key={result.event.id}
              result={result}
              showStatus={false}
            />
          ))}

        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">조건에 맞는 기회가 없습니다.</p>
            <button
              onClick={() => {
                setSelectedSupportField('전체');
                setSelectedCategory('all');
                setSearchKeyword('');
              }}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOpportunities;