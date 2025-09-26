/**
 * useAnimationFrame Hook
 * requestAnimationFrame을 활용한 부드러운 60FPS 애니메이션 구현
 */

import { useRef, useEffect, useCallback } from 'react';

interface AnimationFrameOptions {
  duration?: number; // 애니메이션 지속 시간 (ms)
  fps?: number; // 목표 FPS (기본값: 60)
  enabled?: boolean; // 애니메이션 활성화 여부
}

/**
 * requestAnimationFrame을 활용한 애니메이션 훅
 * @param callback - 각 프레임에서 실행될 콜백 함수
 * @param options - 애니메이션 옵션
 */
export const useAnimationFrame = (
  callback: (deltaTime: number, progress?: number) => void,
  options: AnimationFrameOptions = {}
) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const { duration, fps = 60, enabled = true } = options;

  const targetFrameTime = 1000 / fps; // 목표 프레임 시간 (ms)

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;

      // FPS 제한 적용
      if (deltaTime >= targetFrameTime) {
        if (!startTimeRef.current) {
          startTimeRef.current = time;
        }

        const elapsedTime = time - startTimeRef.current;

        // duration이 설정된 경우 progress 계산
        if (duration) {
          const progress = Math.min(elapsedTime / duration, 1);
          callback(deltaTime, progress);

          // 애니메이션 완료
          if (progress >= 1) {
            if (requestRef.current) {
              cancelAnimationFrame(requestRef.current);
            }
            return;
          }
        } else {
          callback(deltaTime);
        }

        previousTimeRef.current = time;
      }
    } else {
      previousTimeRef.current = time;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [callback, targetFrameTime, duration]);

  useEffect(() => {
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      };
    }
  }, [animate, enabled]);

  // 수동으로 애니메이션 시작/중지
  const start = useCallback(() => {
    if (!requestRef.current) {
      previousTimeRef.current = undefined;
      startTimeRef.current = undefined;
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const stop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
      previousTimeRef.current = undefined;
      startTimeRef.current = undefined;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    start();
  }, [start, stop]);

  return { start, stop, reset };
};

/**
 * 스크롤 기반 애니메이션을 위한 훅
 */
export const useScrollAnimation = (
  callback: (scrollProgress: number) => void,
  containerRef?: React.RefObject<HTMLElement>
) => {
  const rafRef = useRef<number>();

  const handleScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const element = containerRef?.current || window;
      const scrollTop = element === window
        ? window.pageYOffset
        : (element as HTMLElement).scrollTop;

      const scrollHeight = element === window
        ? document.documentElement.scrollHeight - window.innerHeight
        : (element as HTMLElement).scrollHeight - (element as HTMLElement).clientHeight;

      const progress = Math.min(scrollTop / scrollHeight, 1);
      callback(progress);
    });
  }, [callback, containerRef]);

  useEffect(() => {
    const element = containerRef?.current || window;
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll, containerRef]);
};

/**
 * 성능 측정을 포함한 애니메이션 훅
 */
export const usePerformantAnimation = (
  callback: (deltaTime: number, fps: number) => void,
  targetFPS: number = 60
) => {
  const frameCount = useRef(0);
  const lastFPSUpdate = useRef(performance.now());
  const currentFPS = useRef(0);

  const wrappedCallback = useCallback((deltaTime: number) => {
    frameCount.current++;
    const now = performance.now();
    const timeSinceLastUpdate = now - lastFPSUpdate.current;

    // 1초마다 FPS 업데이트
    if (timeSinceLastUpdate >= 1000) {
      currentFPS.current = Math.round((frameCount.current * 1000) / timeSinceLastUpdate);
      frameCount.current = 0;
      lastFPSUpdate.current = now;
    }

    callback(deltaTime, currentFPS.current);
  }, [callback]);

  return useAnimationFrame(wrappedCallback, { fps: targetFPS });
};