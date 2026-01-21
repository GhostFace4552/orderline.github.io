const CACHE_NAME = 'orderline-personal-v2';
const DATA_PROTECTION_CACHE = 'orderline-data-protection';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Data protection during updates
const PROTECTED_STORAGE_KEYS = [
  'orderline-tasks',
  'orderline-data-version',
  // Keep all backup keys
  /^orderline-backup-/
];

// Data backup before install
function backupUserData() {
  try {
    const protectedData = {};
    
    PROTECTED_STORAGE_KEYS.forEach(key => {
      if (typeof key === 'string') {
        const value = localStorage.getItem(key);
        if (value) protectedData[key] = value;
      } else if (key instanceof RegExp) {
        // Handle regex patterns for backup keys
        Object.keys(localStorage).forEach(storageKey => {
          if (key.test(storageKey)) {
            protectedData[storageKey] = localStorage.getItem(storageKey);
          }
        });
      }
    });
    
    return caches.open(DATA_PROTECTION_CACHE)
      .then(cache => {
        const dataBlob = new Blob([JSON.stringify(protectedData)], {
          type: 'application/json'
        });
        const response = new Response(dataBlob);
        return cache.put('user-data-backup', response);
      });
  } catch (error) {
    console.error('Failed to backup user data:', error);
    return Promise.resolve();
  }
}

// Install event - cache resources and backup data
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache application resources
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('Opened cache');
          return cache.addAll(urlsToCache);
        }),
      // Backup user data before update
      backupUserData()
    ]).catch(error => {
      console.error('Failed to cache resources during install:', error);
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(error => {
        console.error('Fetch failed:', error);
        // For navigation requests, return the cached index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        throw error;
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  console.log('Push event received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('Failed to parse push data:', error);
      data = { title: 'Task Reminder', body: 'You have outstanding tasks to complete' };
    }
  }
  
  const title = data.title || 'Task Reminder';
  const options = {
    body: data.body || "You've got tasks waiting—tap to pick the top one",
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'orderline-reminder',
    requireInteraction: true,
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open Tasks' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Handle 'open' action or notification body click
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        
        // Open new window/tab if app is not open
        return clients.openWindow(urlToOpen);
      })
  );
});

// Background sync for task updates (if supported)
self.addEventListener('sync', event => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'task-sync') {
    event.waitUntil(
      // Sync task changes when back online
      fetch('/api/notifications/sync', { method: 'POST' })
        .catch(error => console.error('Background sync failed:', error))
    );
  }
});

// Data recovery after activation
function restoreUserData() {
  return caches.open(DATA_PROTECTION_CACHE)
    .then(cache => cache.match('user-data-backup'))
    .then(response => {
      if (!response) return;
      
      return response.json().then(protectedData => {
        // Restore data to localStorage if it doesn't exist or is corrupted
        Object.entries(protectedData).forEach(([key, value]) => {
          const existing = localStorage.getItem(key);
          if (!existing || existing.length < value.length) {
            localStorage.setItem(key, value);
            console.log(`Restored data for key: ${key}`);
          }
        });
      });
    })
    .catch(error => {
      console.error('Failed to restore user data:', error);
    });
}

// Activate event - clean up old caches and restore data
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_PROTECTION_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Restore user data if needed
      restoreUserData()
    ])
  );
});

// Background sync for offline task management
self.addEventListener('sync', event => {
  if (event.tag === 'task-sync') {
    event.waitUntil(
      // Handle any offline task operations when connection is restored
      console.log('Background sync: task-sync')
    );
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
