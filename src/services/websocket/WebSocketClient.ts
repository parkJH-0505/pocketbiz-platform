/**
 * WebSocket Client
 * 실시간 양방향 통신을 위한 WebSocket 클라이언트
 */

import { EventEmitter } from 'events';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectMaxAttempts?: number;
  heartbeatInterval?: number;
  messageTimeout?: number;
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private pendingMessages = new Map<string, { timeout: NodeJS.Timeout; resolve: Function; reject: Function }>();
  private status: WebSocketStatus = 'disconnected';

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      url: config.url,
      protocols: config.protocols || [],
      reconnect: config.reconnect !== false,
      reconnectInterval: config.reconnectInterval || 5000,
      reconnectMaxAttempts: config.reconnectMaxAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      messageTimeout: config.messageTimeout || 10000
    };
  }

  /**
   * WebSocket 연결
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.status = 'connecting';
      this.emit('status', this.status);

      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.status = 'connected';
          this.emit('status', this.status);
          this.emit('connected');

          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
            this.emit('error', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.status = 'error';
          this.emit('status', this.status);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.status = 'disconnected';
          this.emit('status', this.status);
          this.emit('disconnected', event);

          this.stopHeartbeat();

          if (this.config.reconnect && !event.wasClean) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        this.status = 'error';
        this.emit('status', this.status);
        this.emit('error', error);
        reject(error);
      }
    });
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect(): void {
    this.config.reconnect = false;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.status = 'disconnected';
    this.emit('status', this.status);
  }

  /**
   * 메시지 전송
   */
  send(type: string, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
        id: this.generateMessageId()
      };

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(message));

          // 응답 대기가 필요한 메시지 처리
          if (message.id) {
            const timeout = setTimeout(() => {
              this.pendingMessages.delete(message.id!);
              reject(new Error('Message timeout'));
            }, this.config.messageTimeout);

            this.pendingMessages.set(message.id, { timeout, resolve, reject });
          } else {
            resolve();
          }
        } catch (error) {
          console.error('Failed to send message:', error);
          reject(error);
        }
      } else {
        // 연결이 없으면 큐에 추가
        this.messageQueue.push(message);
        console.log('Message queued:', message);
        resolve();
      }
    });
  }

  /**
   * 메시지 처리
   */
  private handleMessage(message: WebSocketMessage): void {
    // 응답 메시지 처리
    if (message.id && this.pendingMessages.has(message.id)) {
      const pending = this.pendingMessages.get(message.id)!;
      clearTimeout(pending.timeout);
      pending.resolve(message.payload);
      this.pendingMessages.delete(message.id);
      return;
    }

    // 일반 메시지 처리
    this.emit('message', message);
    this.emit(message.type, message.payload);
  }

  /**
   * 재연결 시도
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectMaxAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.emit('reconnecting', this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * 하트비트 시작
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() }).catch((error) => {
          console.error('Heartbeat failed:', error);
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 하트비트 중지
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 메시지 큐 전송
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.send(message.type, message.payload).catch((error) => {
        console.error('Failed to send queued message:', error);
      });
    }
  }

  /**
   * 메시지 ID 생성
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 상태 확인
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// 싱글톤 인스턴스
let wsClient: WebSocketClient | null = null;

export const getWebSocketClient = (config?: WebSocketConfig): WebSocketClient => {
  if (!wsClient && config) {
    wsClient = new WebSocketClient(config);
  }
  if (!wsClient) {
    throw new Error('WebSocket client not initialized');
  }
  return wsClient;
};

export const initWebSocketClient = (config: WebSocketConfig): WebSocketClient => {
  if (wsClient) {
    wsClient.disconnect();
  }
  wsClient = new WebSocketClient(config);
  return wsClient;
};