/**
 * Phase 5.3: Web Worker를 활용한 체크섬 서비스
 * 백그라운드에서 체크섬 계산하여 성능 최적화
 */

export class ChecksumService {
  private worker: Worker | null = null;
  private isWorkerSupported: boolean;

  constructor() {
    // Web Worker 지원 확인
    this.isWorkerSupported = typeof Worker !== 'undefined';

    if (this.isWorkerSupported) {
      this.initWorker();
    }
  }

  /**
   * Worker 초기화
   */
  private initWorker(): void {
    try {
      const workerPath = import.meta.env.DEV
        ? '/pocketbiz-platform/checksumWorker.js'
        : '/checksumWorker.js';
      this.worker = new Worker(workerPath);

      this.worker.addEventListener('message', (e) => {
        if (e.data.type === 'READY') {
          console.log('[ChecksumService] Web Worker ready');
        }
      });

      this.worker.addEventListener('error', (error) => {
        console.error('[ChecksumService] Worker error:', error);
        this.worker = null;
      });
    } catch (error) {
      console.error('[ChecksumService] Failed to initialize worker:', error);
      this.isWorkerSupported = false;
    }
  }

  /**
   * 체크섬 계산 (Worker 또는 Fallback)
   */
  async generateChecksum(
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    // Worker 사용 가능한 경우
    if (this.worker && this.isWorkerSupported) {
      return this.generateChecksumWithWorker(file, onProgress);
    }

    // Fallback: 메인 스레드에서 계산
    console.log('[ChecksumService] Using fallback checksum generation');
    return this.generateChecksumFallback(file, onProgress);
  }

  /**
   * Web Worker를 사용한 체크섬 생성
   */
  private generateChecksumWithWorker(
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e: MessageEvent) => {
        const { type, payload } = e.data;

        switch (type) {
          case 'PROGRESS':
            onProgress?.(payload.progress);
            break;

          case 'CHECKSUM_COMPLETE':
            this.worker?.removeEventListener('message', handleMessage);
            resolve(payload.checksum);
            break;

          case 'ERROR':
            this.worker?.removeEventListener('message', handleMessage);
            reject(new Error(payload.message));
            break;
        }
      };

      this.worker.addEventListener('message', handleMessage);

      // 파일을 ArrayBuffer로 읽기
      const reader = new FileReader();
      reader.onload = () => {
        this.worker?.postMessage({
          type: 'CALCULATE_CHECKSUM',
          payload: {
            fileData: reader.result,
            chunkSize: 1024 * 1024 // 1MB chunks
          }
        });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Fallback: 메인 스레드에서 체크섬 생성
   */
  private async generateChecksumFallback(
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    const hashBuffer: ArrayBuffer[] = [];

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize, file.size);
      const chunk = file.slice(start, end);
      const buffer = await chunk.arrayBuffer();

      // SHA-256 해싱
      const hash = await crypto.subtle.digest('SHA-256', buffer);
      hashBuffer.push(hash);

      // 진행률 보고
      const progress = Math.round(((i + 1) / chunks) * 100);
      onProgress?.(progress);

      // UI 블로킹 방지 (10청크마다 양보)
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // 모든 청크의 해시를 결합
    const totalLength = hashBuffer.reduce((acc, buf) => acc + buf.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;

    for (const buffer of hashBuffer) {
      combined.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    // 최종 해시 생성
    const finalHash = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(finalHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex.substring(0, 16); // 처음 16자만 사용
  }

  /**
   * Worker 종료
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// 싱글톤 인스턴스
export const checksumService = new ChecksumService();

/**
 * 파일 체크섬 생성 헬퍼 함수
 */
export const generateFileChecksum = async (
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return checksumService.generateChecksum(file, onProgress);
};