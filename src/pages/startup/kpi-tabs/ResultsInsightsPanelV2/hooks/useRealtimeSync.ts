/**
 * useRealtimeSync Hook
 * V2 Dashboard의 실시간 데이터 동기화를 위한 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketClient, WebSocketMessage } from '../../../../services/websocket/WebSocketClient';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

interface RealtimeSyncConfig {
  enabled?: boolean;
  url?: string;
  autoReconnect?: boolean;
  syncInterval?: number;
}

interface SyncEvent {
  type: 'score_update' | 'insight_added' | 'simulation_result' | 'user_joined' | 'user_left';
  data: any;
  userId?: string;
  timestamp: number;
}

interface CollaborationUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status: 'online' | 'idle' | 'offline';
  lastSeen: number;
  currentView?: string;
}

export const useRealtimeSync = (config: RealtimeSyncConfig = {}) => {
  const {
    enabled = true,
    url = process.env.VITE_WS_URL || 'ws://localhost:8080',
    autoReconnect = true,
    syncInterval = 5000
  } = config;

  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  const store = useV2Store();

  /**
   * WebSocket 클라이언트 초기화
   */
  const initializeWebSocket = useCallback(() => {
    if (!enabled || wsClient) return;

    const client = new WebSocketClient({
      url,
      reconnect: autoReconnect,
      reconnectInterval: 5000,
      reconnectMaxAttempts: 10,
      heartbeatInterval: 30000
    });

    // 연결 상태 이벤트
    client.on('connected', () => {
      console.log('🔌 Realtime sync connected');
      setIsConnected(true);
      setSyncStatus('synced');
      setLastSyncTime(Date.now());

      // 초기 동기화 요청
      client.send('sync_request', {
        type: 'initial',
        timestamp: Date.now()
      });
    });

    client.on('disconnected', () => {
      console.log('🔌 Realtime sync disconnected');
      setIsConnected(false);
      setSyncStatus('offline');
    });

    client.on('error', (error) => {
      console.error('WebSocket error:', error);
      setSyncStatus('error');
    });

    // 데이터 동기화 이벤트
    client.on('score_update', handleScoreUpdate);
    client.on('insight_added', handleInsightAdded);
    client.on('simulation_result', handleSimulationResult);
    client.on('collaborator_update', handleCollaboratorUpdate);
    client.on('sync_response', handleSyncResponse);

    setWsClient(client);
    return client;
  }, [enabled, url, autoReconnect, wsClient]);

  /**
   * 점수 업데이트 처리
   */
  const handleScoreUpdate = useCallback((data: {
    scores: Record<AxisKey, number>;
    overall: number;
    userId: string;
    timestamp: number;
  }) => {
    console.log('📊 Score update received:', data);

    // Store 업데이트
    store.updateScores(data.scores, data.overall);

    // 동기화 상태 업데이트
    setSyncStatus('synced');
    setLastSyncTime(data.timestamp);
  }, [store]);

  /**
   * 인사이트 추가 처리
   */
  const handleInsightAdded = useCallback((data: {
    insight: any;
    userId: string;
    timestamp: number;
  }) => {
    console.log('💡 New insight received:', data);

    // Store에 인사이트 추가
    if (store.syncState) {
      store.syncState.insights.push(data.insight);
    }
  }, [store]);

  /**
   * 시뮬레이션 결과 처리
   */
  const handleSimulationResult = useCallback((data: {
    result: any;
    userId: string;
    timestamp: number;
  }) => {
    console.log('🔬 Simulation result received:', data);

    // Store 업데이트
    store.setSimulationResult(data.result);
  }, [store]);

  /**
   * 협업 사용자 업데이트
   */
  const handleCollaboratorUpdate = useCallback((data: {
    users: CollaborationUser[];
    event: 'join' | 'leave' | 'update';
    user?: CollaborationUser;
  }) => {
    console.log('👥 Collaborator update:', data);

    if (data.users) {
      setCollaborators(data.users);
    } else if (data.event === 'join' && data.user) {
      setCollaborators(prev => [...prev, data.user!]);
    } else if (data.event === 'leave' && data.user) {
      setCollaborators(prev => prev.filter(u => u.id !== data.user!.id));
    }
  }, []);

  /**
   * 동기화 응답 처리
   */
  const handleSyncResponse = useCallback((data: {
    data: any;
    timestamp: number;
    status: 'success' | 'error';
  }) => {
    if (data.status === 'success') {
      console.log('✅ Sync successful:', data);

      // Store 전체 업데이트
      if (data.data) {
        store.loadFromSync(data.data);
      }

      setSyncStatus('synced');
      setLastSyncTime(data.timestamp);
    } else {
      console.error('❌ Sync failed:', data);
      setSyncStatus('error');
    }
  }, [store]);

  /**
   * 데이터 브로드캐스트
   */
  const broadcastUpdate = useCallback((type: string, data: any) => {
    if (!wsClient || !isConnected) {
      console.warn('Cannot broadcast: WebSocket not connected');
      return;
    }

    wsClient.send('broadcast', {
      type,
      data,
      timestamp: Date.now()
    });
  }, [wsClient, isConnected]);

  /**
   * 점수 변경 브로드캐스트
   */
  const broadcastScoreChange = useCallback((scores: Record<AxisKey, number>, overall: number) => {
    broadcastUpdate('score_update', {
      scores,
      overall,
      source: 'user_input'
    });
  }, [broadcastUpdate]);

  /**
   * 시뮬레이션 시작 브로드캐스트
   */
  const broadcastSimulationStart = useCallback((params: any) => {
    broadcastUpdate('simulation_start', {
      params,
      startedAt: Date.now()
    });
  }, [broadcastUpdate]);

  /**
   * 주기적 동기화
   */
  useEffect(() => {
    if (!enabled || !isConnected) return;

    const performSync = () => {
      setSyncStatus('syncing');

      if (wsClient) {
        wsClient.send('sync_request', {
          type: 'periodic',
          lastSync: lastSyncTime,
          timestamp: Date.now()
        });
      }
    };

    syncTimeoutRef.current = setInterval(performSync, syncInterval);

    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
      }
    };
  }, [enabled, isConnected, wsClient, syncInterval, lastSyncTime]);

  /**
   * 연결 시작
   */
  const connect = useCallback(async () => {
    if (!wsClient) {
      const client = initializeWebSocket();
      if (client) {
        await client.connect();
      }
    } else {
      await wsClient.connect();
    }
  }, [wsClient, initializeWebSocket]);

  /**
   * 연결 종료
   */
  const disconnect = useCallback(() => {
    if (wsClient) {
      wsClient.disconnect();
      setWsClient(null);
      setIsConnected(false);
      setSyncStatus('offline');
    }
  }, [wsClient]);

  /**
   * 수동 동기화
   */
  const syncNow = useCallback(() => {
    if (!wsClient || !isConnected) {
      console.warn('Cannot sync: WebSocket not connected');
      return Promise.reject(new Error('Not connected'));
    }

    setSyncStatus('syncing');

    return wsClient.send('sync_request', {
      type: 'manual',
      timestamp: Date.now(),
      data: store.exportForSync()
    });
  }, [wsClient, isConnected, store]);

  /**
   * 초기화
   */
  useEffect(() => {
    if (enabled) {
      initializeWebSocket();
    }

    return () => {
      if (wsClient) {
        wsClient.disconnect();
      }
    };
  }, [enabled]);

  return {
    // 상태
    isConnected,
    syncStatus,
    lastSyncTime,
    collaborators,

    // 액션
    connect,
    disconnect,
    syncNow,
    broadcastScoreChange,
    broadcastSimulationStart,
    broadcastUpdate,

    // WebSocket 클라이언트 (고급 사용)
    wsClient
  };
};