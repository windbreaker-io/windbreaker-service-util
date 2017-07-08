const EventEmitter = require('events')

class MockRedisClient extends EventEmitter {
  setex (key, ttl, value) {
    return Promise.resolve()
  }

  getBuffer (key) {
    return Promise.resolve()
  }

  quit () {
    return Promise.resolve()
  }
}

module.exports = MockRedisClient
