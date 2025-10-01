/**
 * Virtualized List Component
 * 대용량 리스트 렌더링 최적화
 */

import React, { useRef, useState, useCallback, useEffect, memo } from 'react';
import { useInView } from 'react-intersection-observer';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number | ((index: number) => number);
  containerHeight?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

function VirtualizedListInner<T>({
  items,
  renderItem,
  itemHeight = 50,
  containerHeight = 500,
  overscan = 3,
  className = '',
  emptyMessage = '데이터가 없습니다',
  loadMore,
  hasMore = false,
  loading = false
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Infinite scroll을 위한 인터섹션 옵저버
  const { ref: loadMoreRef } = useInView({
    onChange: (inView) => {
      if (inView && hasMore && !loading && loadMore) {
        loadMore();
      }
    },
    threshold: 0.1
  });

  // 아이템 높이 계산
  const getItemHeight = useCallback(
    (index: number) => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  // 누적 높이 계산 (메모이제이션)
  const itemOffsets = React.useMemo(() => {
    const offsets: number[] = [0];
    for (let i = 0; i < items.length; i++) {
      offsets.push(offsets[i] + getItemHeight(i));
    }
    return offsets;
  }, [items.length, getItemHeight]);

  const totalHeight = itemOffsets[items.length];

  // 보이는 범위 계산
  const calculateVisibleRange = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { start: 0, end: 0 };

    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;

    // Binary search로 시작 인덱스 찾기
    let start = 0;
    let end = items.length - 1;

    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      if (itemOffsets[mid] < scrollTop) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }

    // Overscan 적용
    start = Math.max(0, start - overscan);

    // 끝 인덱스 찾기
    let visibleEnd = start;
    while (
      visibleEnd < items.length &&
      itemOffsets[visibleEnd] < scrollTop + viewportHeight
    ) {
      visibleEnd++;
    }

    visibleEnd = Math.min(items.length, visibleEnd + overscan);

    return { start, end: visibleEnd };
  }, [items.length, itemOffsets, overscan]);

  const { start: visibleStart, end: visibleEnd } = calculateVisibleRange();

  // 스크롤 핸들러
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setScrollTop(container.scrollTop);
    setIsScrolling(true);

    // 스크롤 종료 감지
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // 클린업
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const offsetY = itemOffsets[visibleStart];

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleStart + index;
            const height = getItemHeight(actualIndex);

            return (
              <div
                key={actualIndex}
                style={{
                  height,
                  position: 'relative'
                }}
                className={isScrolling ? 'pointer-events-none' : ''}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div
            ref={loadMoreRef}
            style={{
              position: 'absolute',
              bottom: 100,
              height: 1,
              width: '100%'
            }}
          />
        )}

        {/* Loading indicator */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0
            }}
            className="flex justify-center py-4"
          >
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-main border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}

// Export memoized version
export const VirtualizedList = memo(VirtualizedListInner) as typeof VirtualizedListInner;

/**
 * 심플 버전 - 고정 높이 아이템용
 */
export const SimpleVirtualList = memo<{
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}>(({ items, renderItem, itemHeight = 50, containerHeight = 500, className = '' }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight);

    setVisibleRange({ start, end: Math.min(end, items.length) });
  }, [itemHeight, containerHeight, items.length]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleRange.start + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

SimpleVirtualList.displayName = 'SimpleVirtualList';