const CACHE_NAME = 'cache-v1'
const resources = [
  '/'
]

this.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(resources)))
})

this.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter(() => false)
        .map((name) => caches.delete(name))
    ))
  )
})

const MAX_AGE = 86400

this.addEventListener('fetch', (event) => {
  event.respondWith(
    // ищем запрошенный ресурс
    caches.match(event.request).then((cachedResponse) => {
      let lastModified
      const fetchRequest = event.request.clone()

      // если ресурса нет в кэше
      if (!cachedResponse) {
        return fetch(fetchRequest)
          .then((response) => {
            const responseClone = response.clone()

            updateCache(event.request, responseClone)
            return response
          })
      }

      // если ресурс есть в кэше
      lastModified = new Date(cachedResponse.headers.get('last-modified'))
      // если ресурс устаревший
      if (lastModified && (Date.now() - lastModified.getTime()) > MAX_AGE) {
        return fetch(fetchRequest).then((response) => {
          if (!response || response.status > 500) {
            return cachedResponse
          }
          updateCache(event.request, response.clone())
          return response
        }).catch(() => cachedResponse)
      }

      return cachedResponse;
    })
  )
})

const updateCache = (req, res) => {
  caches.open(CACHE_NAME).then((cache) => {
    cache.put(req, res)
  })
}
