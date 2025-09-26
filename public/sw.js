/**
 * Service Worker for Offline Support
 * PWA 기능을 위한 서비스 워커
 */

const CACHE_NAME = 'v2-dashboard-v1';
const DYNAMIC_CACHE = 'v2-dashboard-dynamic-v1';

// 캐시할 정적 자산들
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// 캐시 우선 전략을 사용할 경로
const CACHE_FIRST_ROUTES = [
  '/static/',
  '/assets/',
  '/fonts/'
];

// 네트워크 우선 전략을 사용할 경로
const NETWORK_FIRST_ROUTES = [
  '/api/',
  '/ws/'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  self.clients.claim();
});

// Fetch 이벤트
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 캐시 우선 전략
  if (CACHE_FIRST_ROUTES.some(route => url.pathname.includes(route))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 네트워크 우선 전략
  if (NETWORK_FIRST_ROUTES.some(route => url.pathname.includes(route))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 기본: 네트워크 우선, 실패 시 캐시
  event.respondWith(networkFirst(request));
});

// 캐시 우선 전략
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// 네트워크 우선 전략
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);

  if (event.tag === 'sync-kpi-data') {
    event.waitUntil(syncKPIData());
  }
});

// KPI 데이터 동기화
async function syncKPIData() {
  try {
    const cache = await caches.open('kpi-sync-queue');
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Sync failed for:', request.url);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// 메시지 처리
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    cacheUrls(event.data.urls);
  }
});

// 특정 URL들을 캐시
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.error('Failed to cache:', url);
    }
  }
}