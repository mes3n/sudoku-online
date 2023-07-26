const ASSETS = [
    'index.html',
    'images/sudoku-pink.svg',
    'images/sudoku-white.svg',

    'pages/board.html',
    'pages/info.html',

    'scripts/main.js',
    'scripts/board.js',
    'scripts/info.js',
    'scripts/view.js',

    'styles/main.css',
    'styles/board.css',
    'styles/info.css',
]
const CACHE_NAME = 'js13kPWA-v1'

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                for (let asset of ASSETS) {
                    cache.add(new Request(asset))
                    console.log(asset)
                }
                console.log(cache)
                return cache
            })
    )
})

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key)
                }
            }))
        })
    )
    return self.clients.claim()
})

self.addEventListener('fetch', event => {
    let { request } = event

    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin')
        return;

    console.log("request for: ", request.url)

    event.respondWith(
        // do network first
        fetch(request)
            .then(async response => {
                return caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(request.url, response.clone())
                        return response
                    })
            })
            // then try cache
            .catch(async error => {
                return caches.match(request)
                    .then(response => {
                        if (response === undefined) {
                            // offline and no cache
                        }
                        return response
                    })
            })
    )
    //     caches.match(request).then(response => {
    //         if (response)
    //             return response

    //         return fetch(request)
    //             .then(response => response)
    //             .catch(error => {
    //                 console.log("error at: ", request.url)
    //                 throw error
    //             })
    //     })
    // )
})