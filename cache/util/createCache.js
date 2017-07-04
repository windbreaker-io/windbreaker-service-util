const Cache = require('../Cache')

// see Cache.js for the accepted options
module.exports = async function createCache (options) {
  const cache = new Cache(options)

  return new Promise((resolve, reject) => {
    async function onError (error) {
      cache.removeListener('ready', onReady)
      await cache.close()
      reject(error)
    }

    function onReady () {
      cache.removeListener('error', onError)
      resolve(cache)
    }

    cache.once('error', onError)
    cache.once('ready', onReady)
  })
}
