/**
 * Phase 5.3: Web Worker for checksum generation
 * 백그라운드 스레드에서 체크섬 계산하여 UI 블로킹 방지
 */

self.addEventListener('message', async (e) => {
  const { type, payload } = e.data;

  if (type === 'CALCULATE_CHECKSUM') {
    try {
      const { fileData, chunkSize = 1024 * 1024 } = payload; // 1MB chunks

      // ArrayBuffer로 변환
      const buffer = new Uint8Array(fileData);
      const chunks = Math.ceil(buffer.length / chunkSize);
      const hashParts = [];

      // 진행률 보고를 위한 변수
      let processedBytes = 0;

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min((i + 1) * chunkSize, buffer.length);
        const chunk = buffer.slice(start, end);

        // SHA-256 해싱
        const hashBuffer = await crypto.subtle.digest('SHA-256', chunk);
        hashParts.push(new Uint8Array(hashBuffer));

        // 진행률 보고
        processedBytes += (end - start);
        const progress = Math.round((processedBytes / buffer.length) * 100);

        self.postMessage({
          type: 'PROGRESS',
          payload: { progress, processedBytes, totalBytes: buffer.length }
        });

        // 다른 작업에 CPU 양보 (10청크마다)
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // 모든 청크 해시 결합
      const totalLength = hashParts.reduce((acc, part) => acc + part.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;

      for (const part of hashParts) {
        combined.set(part, offset);
        offset += part.length;
      }

      // 최종 해시 생성
      const finalHashBuffer = await crypto.subtle.digest('SHA-256', combined);
      const hashArray = Array.from(new Uint8Array(finalHashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // 결과 반환 (처음 16자만)
      self.postMessage({
        type: 'CHECKSUM_COMPLETE',
        payload: {
          checksum: hashHex.substring(0, 16),
          fullHash: hashHex
        }
      });

    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        payload: {
          message: error.message || 'Checksum calculation failed'
        }
      });
    }
  }
});

// Worker 준비 완료 신호
self.postMessage({ type: 'READY' });