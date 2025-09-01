const CACHE_NAME = "workerfacts-offline-v1";
const urlsToCache = [
  // Essential images for homepage
  "/workerfacts-logo.png",
  "/home_page_background_image.jpg",
  "/close-up-bearded-neurology-specialist-checking.jpg",
  "/FunctionalCapacity.png",
  "/Job_demands.png",
  "/Copilot_20250609_184324-min.png",
  "/Rehab-min.jpg",
  "/Key_Points-min.jpg",

  // 3D Overview images
  "/3d-overview/fce-report.webp",
  "/3d-overview/activity-rating-chart.webp",
  "/3d-overview/facts-test-results.webp",
  "/3d-overview/facts-pinch-strength.webp",
  "/3d-overview/pain-illustration.webp",

  // Human body images for pain illustration
  "/humanBody/front_view.png",
  "/humanBody/back_view.png",
  "/humanBody/left_view.png",
  "/humanBody/right_view.png",

  // Testimonial images
  "/testimonials/health-safety-professional.jpg",
  "/testimonials/physical-therapist.jpg",
  "/testimonials/case-manager.jpg",

  // Sample PDF
  "/sample_FCE_report.pdf",

  // App shell
  "/",
  "/client/App.tsx",
  "/manifest.json",
];

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        console.log("[ServiceWorker] Caching app shell and critical images");

        // Cache resources one by one to handle failures gracefully
        const cachePromises = urlsToCache.map(async (url) => {
          try {
            const response = await fetch(url, { mode: "no-cors" });
            if (response.status === 200 || response.status === 0) {
              // 0 for opaque responses
              await cache.put(url, response);
              console.log(`[ServiceWorker] Cached: ${url}`);
            }
          } catch (error) {
            console.warn(`[ServiceWorker] Failed to cache ${url}:`, error);
          }
        });

        await Promise.allSettled(cachePromises);
        console.log("[ServiceWorker] Initial caching completed");
      })
      .catch((error) => {
        console.error("[ServiceWorker] Cache installation failed:", error);
      }),
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[ServiceWorker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle image requests with cache-first strategy
  if (
    event.request.destination === "image" ||
    event.request.url.includes(".png") ||
    event.request.url.includes(".jpg") ||
    event.request.url.includes(".jpeg") ||
    event.request.url.includes(".webp") ||
    event.request.url.includes(".svg") ||
    event.request.url.includes(".ico")
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return cached version if available
        if (response) {
          console.log("[ServiceWorker] Serving from cache:", event.request.url);
          return response;
        }

        // Otherwise, fetch from network and cache for future use
        return fetch(event.request)
          .then((response) => {
            // Check if response is valid
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // If network fails, try to serve a placeholder
            console.log(
              "[ServiceWorker] Network failed for:",
              event.request.url,
            );

            // Return placeholder for images when offline
            if (event.request.url.includes("logo")) {
              return caches.match("/placeholder.svg");
            }

            // For other images, return a generic placeholder
            return new Response(
              '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">Image Offline</text></svg>',
              {
                headers: {
                  "Content-Type": "image/svg+xml",
                },
              },
            );
          });
      }),
    );
    return;
  }

  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network is available, return fresh content
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            console.log(
              "[ServiceWorker] Serving from cache (offline):",
              event.request.url,
            );
            return response;
          }

          // If no cache, return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }

          // For other requests, return a basic offline response
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      }),
  );
});

// Handle background sync for when connection is restored
self.addEventListener("sync", (event) => {
  console.log("[ServiceWorker] Background sync triggered");

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Perform any background sync tasks here
      console.log("[ServiceWorker] Performing background sync"),
    );
  }
});

// Listen for messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_CACHE_STATUS") {
    caches.keys().then((cacheNames) => {
      event.ports[0].postMessage({
        type: "CACHE_STATUS",
        caches: cacheNames,
        currentCache: CACHE_NAME,
      });
    });
  }
});
