/**
 * Widget Data Bridge
 * 위젯 간 데이터 공유 및 동기화 시스템
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { widgetEventBus, WidgetEventTypes } from './WidgetEventBus';

interface SharedData {
  [key: string]: any;
}

interface DataSubscription {
  widgetId: string;
  dataKeys: string[];
  callback: (data: Partial<SharedData>) => void;
}

interface WidgetDataBridgeContextValue {
  // 공유 데이터
  sharedData: SharedData;

  // 데이터 설정
  setSharedData: (key: string, value: any, sourceWidgetId?: string) => void;

  // 일괄 데이터 설정
  setMultipleData: (data: Partial<SharedData>, sourceWidgetId?: string) => void;

  // 데이터 구독
  subscribeToData: (
    widgetId: string,
    dataKeys: string[],
    callback: (data: Partial<SharedData>) => void
  ) => () => void;

  // 데이터 변환 파이프라인
  registerTransformer: (
    sourceKey: string,
    targetKey: string,
    transformer: (value: any) => any
  ) => void;

  // 데이터 연결
  createDataLink: (
    sourceWidgetId: string,
    targetWidgetId: string,
    dataMapping: Record<string, string>
  ) => void;

  // 데이터 브로드캐스트
  broadcast: (eventType: string, data: any, sourceWidgetId: string) => void;
}

const WidgetDataBridgeContext = createContext<WidgetDataBridgeContextValue | null>(null);

export const useWidgetDataBridge = () => {
  const context = useContext(WidgetDataBridgeContext);
  if (!context) {
    throw new Error('useWidgetDataBridge must be used within WidgetDataBridgeProvider');
  }
  return context;
};

interface WidgetDataBridgeProviderProps {
  children: React.ReactNode;
}

export const WidgetDataBridgeProvider: React.FC<WidgetDataBridgeProviderProps> = ({
  children
}) => {
  const [sharedData, setSharedDataState] = useState<SharedData>({});
  const [subscriptions, setSubscriptions] = useState<DataSubscription[]>([]);
  const [transformers, setTransformers] = useState<Map<string, Map<string, Function>>>(new Map());
  const [dataLinks, setDataLinks] = useState<Map<string, Map<string, string>>>(new Map());

  // 데이터 변경 시 구독자들에게 알림
  useEffect(() => {
    subscriptions.forEach(subscription => {
      const relevantData: Partial<SharedData> = {};
      let hasRelevantData = false;

      subscription.dataKeys.forEach(key => {
        if (key in sharedData) {
          relevantData[key] = sharedData[key];
          hasRelevantData = true;
        }
      });

      if (hasRelevantData) {
        subscription.callback(relevantData);
      }
    });
  }, [sharedData, subscriptions]);

  // 공유 데이터 설정
  const setSharedData = useCallback((key: string, value: any, sourceWidgetId?: string) => {
    setSharedDataState(prev => {
      const updated = { ...prev, [key]: value };

      // 변환기 적용
      transformers.get(key)?.forEach((transformer, targetKey) => {
        updated[targetKey] = transformer(value);
      });

      // 이벤트 발행
      if (sourceWidgetId) {
        widgetEventBus.emit(
          sourceWidgetId,
          WidgetEventTypes.DATA_UPDATE,
          { key, value },
          undefined
        );
      }

      return updated;
    });
  }, [transformers]);

  // 일괄 데이터 설정
  const setMultipleData = useCallback((data: Partial<SharedData>, sourceWidgetId?: string) => {
    setSharedDataState(prev => {
      const updated = { ...prev, ...data };

      // 각 데이터에 대해 변환기 적용
      Object.entries(data).forEach(([key, value]) => {
        transformers.get(key)?.forEach((transformer, targetKey) => {
          updated[targetKey] = transformer(value);
        });
      });

      // 이벤트 발행
      if (sourceWidgetId) {
        widgetEventBus.emit(
          sourceWidgetId,
          WidgetEventTypes.DATA_UPDATE,
          data,
          undefined
        );
      }

      return updated;
    });
  }, [transformers]);

  // 데이터 구독
  const subscribeToData = useCallback((
    widgetId: string,
    dataKeys: string[],
    callback: (data: Partial<SharedData>) => void
  ) => {
    const subscription: DataSubscription = {
      widgetId,
      dataKeys,
      callback
    };

    setSubscriptions(prev => [...prev, subscription]);

    // 현재 데이터 즉시 전달
    const currentData: Partial<SharedData> = {};
    dataKeys.forEach(key => {
      if (key in sharedData) {
        currentData[key] = sharedData[key];
      }
    });
    if (Object.keys(currentData).length > 0) {
      callback(currentData);
    }

    // 구독 해제 함수 반환
    return () => {
      setSubscriptions(prev =>
        prev.filter(sub => sub !== subscription)
      );
    };
  }, [sharedData]);

  // 데이터 변환기 등록
  const registerTransformer = useCallback((
    sourceKey: string,
    targetKey: string,
    transformer: (value: any) => any
  ) => {
    setTransformers(prev => {
      const updated = new Map(prev);
      if (!updated.has(sourceKey)) {
        updated.set(sourceKey, new Map());
      }
      updated.get(sourceKey)!.set(targetKey, transformer);
      return updated;
    });

    // 현재 데이터에 즉시 적용
    if (sourceKey in sharedData) {
      setSharedDataState(prev => ({
        ...prev,
        [targetKey]: transformer(sharedData[sourceKey])
      }));
    }
  }, [sharedData]);

  // 데이터 링크 생성
  const createDataLink = useCallback((
    sourceWidgetId: string,
    targetWidgetId: string,
    dataMapping: Record<string, string>
  ) => {
    // 소스 위젯의 데이터 변경 이벤트 구독
    const unsubscribe = widgetEventBus.subscribe(
      targetWidgetId,
      WidgetEventTypes.DATA_UPDATE,
      (data: any) => {
        // 소스 위젯에서만 이벤트 처리
        if (data.source === sourceWidgetId) {
          const mappedData: Partial<SharedData> = {};

          Object.entries(dataMapping).forEach(([sourceKey, targetKey]) => {
            if (sourceKey in data) {
              mappedData[targetKey] = data[sourceKey];
            }
          });

          if (Object.keys(mappedData).length > 0) {
            setMultipleData(mappedData, sourceWidgetId);
          }
        }
      }
    );

    // 링크 저장
    setDataLinks(prev => {
      const updated = new Map(prev);
      if (!updated.has(sourceWidgetId)) {
        updated.set(sourceWidgetId, new Map());
      }
      updated.get(sourceWidgetId)!.set(targetWidgetId, JSON.stringify(dataMapping));
      return updated;
    });

    // cleanup 함수는 외부에서 관리
  }, [setMultipleData]);

  // 데이터 브로드캐스트
  const broadcast = useCallback((
    eventType: string,
    data: any,
    sourceWidgetId: string
  ) => {
    widgetEventBus.emit(sourceWidgetId, eventType, data);
  }, []);

  const value: WidgetDataBridgeContextValue = {
    sharedData,
    setSharedData,
    setMultipleData,
    subscribeToData,
    registerTransformer,
    createDataLink,
    broadcast
  };

  return (
    <WidgetDataBridgeContext.Provider value={value}>
      {children}
    </WidgetDataBridgeContext.Provider>
  );
};

/**
 * 위젯 데이터 커넥터 HOC
 */
export function withDataBridge<P extends object>(
  Component: React.ComponentType<P & { dataBridge: WidgetDataBridgeContextValue }>,
  dataKeys?: string[]
) {
  return (props: P) => {
    const dataBridge = useWidgetDataBridge();
    const [subscribedData, setSubscribedData] = useState<Partial<SharedData>>({});

    useEffect(() => {
      if (dataKeys && dataKeys.length > 0) {
        const widgetId = (props as any).widgetId || `widget-${Date.now()}`;
        const unsubscribe = dataBridge.subscribeToData(
          widgetId,
          dataKeys,
          (data) => setSubscribedData(data)
        );
        return unsubscribe;
      }
    }, [dataKeys, dataBridge, props]);

    return (
      <Component
        {...props}
        dataBridge={dataBridge}
        subscribedData={subscribedData}
      />
    );
  };
}

/**
 * React Hook: 위젯 데이터 구독
 */
export function useWidgetData(widgetId: string, dataKeys: string[]) {
  const dataBridge = useWidgetDataBridge();
  const [data, setData] = useState<Partial<SharedData>>({});

  useEffect(() => {
    const unsubscribe = dataBridge.subscribeToData(widgetId, dataKeys, setData);
    return unsubscribe;
  }, [widgetId, dataKeys, dataBridge]);

  return data;
}

/**
 * React Hook: 위젯 데이터 설정
 */
export function useSetWidgetData(widgetId: string) {
  const dataBridge = useWidgetDataBridge();

  return useCallback((key: string, value: any) => {
    dataBridge.setSharedData(key, value, widgetId);
  }, [widgetId, dataBridge]);
}

export default WidgetDataBridgeProvider;