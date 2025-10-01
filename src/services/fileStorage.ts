/**
 * IndexedDB를 활용한 파일 저장 서비스
 * 대용량 파일을 브라우저에 안전하게 저장하고 관리
 */

import { generateFileChecksum } from './checksumService';

export interface StoredFile {
  id: string;
  blob: Blob;
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadDate: Date;
    checksum?: string;
  };
}

export class FileStorageService {
  private dbName = 'VDRFileStorage';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private storeName = 'files';

  /**
   * IndexedDB 초기화
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[FileStorage] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[FileStorage] IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 파일 저장소 생성
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
          objectStore.createIndex('fileName', 'metadata.fileName', { unique: false });
          objectStore.createIndex('uploadDate', 'metadata.uploadDate', { unique: false });
          console.log('[FileStorage] Object store created');
        }
      };
    });
  }

  /**
   * 파일을 IndexedDB에 저장
   */
  async saveFile(fileId: string, file: File | Blob, metadata?: Partial<StoredFile['metadata']>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const storedFile: StoredFile = {
        id: fileId,
        blob: file,
        metadata: {
          fileName: metadata?.fileName || (file instanceof File ? file.name : 'unnamed'),
          fileSize: file.size,
          mimeType: file.type,
          uploadDate: new Date(),
          checksum: metadata?.checksum
        }
      };

      const request = store.put(storedFile);

      request.onsuccess = () => {
        console.log(`[FileStorage] File saved: ${fileId} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        resolve();
      };

      request.onerror = () => {
        console.error('[FileStorage] Failed to save file:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * IndexedDB에서 파일 가져오기
   */
  async getFile(fileId: string): Promise<StoredFile | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(fileId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log(`[FileStorage] File retrieved: ${fileId}`);
          resolve(result);
        } else {
          console.log(`[FileStorage] File not found: ${fileId}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('[FileStorage] Failed to get file:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 파일 삭제
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(fileId);

      request.onsuccess = () => {
        console.log(`[FileStorage] File deleted: ${fileId}`);
        resolve();
      };

      request.onerror = () => {
        console.error('[FileStorage] Failed to delete file:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 모든 파일 목록 가져오기
   */
  async getAllFiles(): Promise<StoredFile[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log(`[FileStorage] Retrieved ${request.result.length} files`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[FileStorage] Failed to get all files:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 저장소 용량 확인
   */
  async getStorageInfo(): Promise<{ usage: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return {
        usage,
        quota,
        percentage
      };
    }

    // 폴백: 기본값 반환
    return {
      usage: 0,
      quota: 0,
      percentage: 0
    };
  }

  /**
   * 파일을 Base64로 변환
   */
  static async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Base64를 Blob으로 변환
   */
  static base64ToBlob(base64: string, mimeType?: string): Blob {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeType || 'application/octet-stream' });
  }

  /**
   * 저장 전략 결정
   */
  static determineStorageStrategy(file: File): 'base64' | 'indexedDB' | 'server' {
    const SIZE_LIMIT_BASE64 = 100 * 1024;        // 100KB
    const SIZE_LIMIT_INDEXEDDB = 50 * 1024 * 1024; // 50MB

    if (file.size <= SIZE_LIMIT_BASE64) {
      return 'base64';  // localStorage에 Base64로 저장
    } else if (file.size <= SIZE_LIMIT_INDEXEDDB) {
      return 'indexedDB';  // IndexedDB에 Blob으로 저장
    } else {
      return 'server';  // 서버에 업로드 (향후 구현)
    }
  }

  /**
   * 파일 체크섬 생성 (Web Worker를 사용한 최적화 버전)
   */
  static async generateChecksum(file: File | Blob, onProgress?: (progress: number) => void): Promise<string> {
    // Phase 5.3: Web Worker를 사용한 체크섬 생성
    return generateFileChecksum(file, onProgress);
  }
}

// 싱글톤 인스턴스
export const fileStorage = new FileStorageService();