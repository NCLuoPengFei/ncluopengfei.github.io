'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "index.html": "fd2106a08cd79c1b7a86b56570b4650b",
"/": "fd2106a08cd79c1b7a86b56570b4650b",
"main.dart.js": "4917093856a634be25026b8e74f3a45a",
"favicon.png": "cf2d7f5b6884e2b7fd2fe63b1ba6e4f3",
"icons/Icon-192.png": "d6e56c7b48b44cc550ba3b8228767fee",
"icons/Icon-512.png": "160c54203db80cbe48f91daa9ae72bb2",
"manifest.json": "7ce505a855ab3980e1fce1858144bcbb",
"assets/AssetManifest.json": "e4e21454fe778af9cb1ca7d2b69f7fba",
"assets/NOTICES": "c4e9381c20c149b122000ec2809adf68",
"assets/FontManifest.json": "01700ba55b08a6141f33e168c4a6c22f",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"assets/fonts/MaterialIcons-Regular.ttf": "56d3ffdef7a25659eab6a68a3fbfaf16",
"assets/assets/banner2.jpg": "20dc45bdea0981b7b9ebae773987d553",
"assets/assets/banner1.jpg": "92c1d3de8c22f0d3546dba89f917395d",
"assets/assets/top3.png": "4579acff8773037a9234f41bff540f99",
"assets/assets/card3.jpg": "deade95681da2e1b82878400727f9987",
"assets/assets/img5.jpg": "5f8cc073706ec041f8eda6e743b519b7",
"assets/assets/22.jpeg": "00105d75de1ff25f813de44a3b4aa703",
"assets/assets/img4.jpg": "4fdc5f84aad5ee38e39584655af2bb8e",
"assets/assets/card2.jpg": "4fba4a3e8f1c7e352fc38feddb786948",
"assets/assets/top2.png": "43d807d73431b762ca743997d3c6b6bc",
"assets/assets/img6.jpg": "50cd9ce328046403b3b6f5393ec27756",
"assets/assets/img7.jpg": "1ab9f4086d67186bc1a4528ee967a2a0",
"assets/assets/card1.jpg": "93e95f6e4526eaeaa9dca81f6d8c8cdd",
"assets/assets/top1.png": "8317426cec7c2a0c93b86a92ee93b1a8",
"assets/assets/img3.jpg": "32cf4f43dde417d34c61d96aa647c76f",
"assets/assets/img2.jpg": "ef6fd9718311a442208cf5bc8c2ec5e8",
"assets/assets/top4.png": "99e8cd03f3fb4c91a77edf9d8dfadeae",
"assets/assets/ip11.png": "60fe78029e1026910f5db23f03ed40ac",
"assets/assets/img1.jpg": "8714b66d2db9962820a735f2ec5add11",
"assets/assets/2.jpeg": "a37d5995a86e0130b1738e18f2293930",
"assets/assets/next.png": "e4115f7d16897f9d224682a27dda4423",
"assets/assets/club.png": "447a5c6b47c22960e240d6f6bc25f827"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/LICENSE",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      // Provide a no-cache param to ensure the latest version is downloaded.
      return cache.addAll(CORE.map((value) => new Request(value, {'cache': 'no-cache'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');

      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }

      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#')) {
    key = '/';
  }
  // If the URL is not the the RESOURCE list, skip the cache.
  if (!RESOURCES[key]) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache. Ensure the resources are not cached
        // by the browser for longer than the service worker expects.
        var modifiedRequest = new Request(event.request, {'cache': 'no-cache'});
        return response || fetch(modifiedRequest).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.message == 'skipWaiting') {
    return self.skipWaiting();
  }

  if (event.message = 'downloadOffline') {
    downloadOffline();
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.add(resourceKey);
    }
  }
  return Cache.addAll(resources);
}
