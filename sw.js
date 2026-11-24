/* Focus Service Worker v4.1
 * 离线缓存 + 移动端通知。
 * 注意：SW 必须是真实的同源 http(s) 文件，浏览器拒绝 blob:/data: URL 注册。
 */
const CACHE = 'focus-v4.1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html'])));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.github.com') return;   // Gist 同步永远走网络
  if (url.origin !== self.location.origin) return; // 跨源请求不接管

  // 页面导航：网络优先（在线拿最新版），离线回退缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      }).catch(() =>
        caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))
      )
    );
    return;
  }

  // 其他同源静态资源：缓存优先
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
      }
      return res;
    }))
  );
});

// 点击通知 → 聚焦已打开的应用窗口（没有则新开）
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
      for (const w of ws) {
        if ('focus' in w) return w.focus();
      }
      return self.clients.openWindow('./');
    })
  );
});
