/**
 * VirtualList Component
 * 가상 스크롤링을 구현하여 대용량 리스트 렌더링 최적화
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  buffer?: number; // 보이는 영역 위아래로 추가로 렌더링할 아이템 수
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

function VirtualListComponent<T>({
  items,
  itemHeight,
  height,
  renderItem,
  buffer = 3,
  className = '',
  onScroll
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // 아이템 높이 계산
  const getItemHeight = useCallback((index: number): number => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
  }, [itemHeight]);

  // 누적 높이 계산 (가변 높이 지원)
  const getItemOffset = useCallback((index: number): number => {
    if (typeof itemHeight === 'number') {
      return index * itemHeight;
    }

    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  }, [itemHeight, getItemHeight]);

  // 전체 높이 계산
  const getTotalHeight = useCallback((): number => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }

    let totalHeight = 0;
    for (let i = 0; i < items.length; i++) {
      totalHeight += getItemHeight(i);
    }
    return totalHeight;
  }, [items.length, itemHeight, getItemHeight]);

  // 보이는 아이템 범위 계산
  const getVisibleRange = useCallback((): { start: number; end: number } => {
    const containerHeight = height;
    let accumulatedHeight = 0;
    let start = 0;
    let end = 0;

    // 시작 인덱스 찾기
    for (let i = 0; i < items.length; i++) {
      const itemH = getItemHeight(i);
      if (accumulatedHeight + itemH > scrollTop) {
        start = Math.max(0, i - buffer);
        break;
      }
      accumulatedHeight += itemH;
    }

    // 종료 인덱스 찾기
    accumulatedHeight = getItemOffset(start);
    for (let i = start; i < items.length; i++) {
      if (accumulatedHeight > scrollTop + containerHeight) {
        end = Math.min(items.length - 1, i + buffer);
        break;
      }
      accumulatedHeight += getItemHeight(i);
    }

    if (end === 0) {
      end = items.length - 1;
    }

    return { start, end };
  }, [scrollTop, height, items.length, buffer, getItemHeight, getItemOffset]);

  // 스크롤 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // 스크롤 종료 감지
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    if (onScroll) {
      onScroll(newScrollTop);
    }
  }, [onScroll]);

  // 렌더링할 아이템들
  const { start, end } = getVisibleRange();
  const visibleItems = items.slice(start, end + 1);
  const offsetY = getItemOffset(start);
  const totalHeight = getTotalHeight();

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      {/* 전체 높이를 유지하기 위한 컨테이너 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 실제 렌더링될 아이템들 */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            willChange: isScrolling ? 'transform' : 'auto'
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = start + index;
            const itemH = getItemHeight(actualIndex);

            return (
              <div
                key={actualIndex}
                style={{ height: itemH }}
                className={isScrolling ? 'pointer-events-none' : ''}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// React.memo로 최적화
export const VirtualList = memo(VirtualListComponent) as typeof VirtualListComponent;

// 사용 예시를 위한 간단한 아이템 컴포넌트
export const VirtualListItem = memo<{ content: string; index: number }>(
  ({ content, index }) => (
    <div className="p-4 border-b border-neutral-border hover:bg-neutral-light transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-medium">Item #{index + 1}</span>
        <span className="text-neutral-gray">{content}</span>
      </div>
    </div>
  )
);