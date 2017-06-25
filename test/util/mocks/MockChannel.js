const EventEmitter = require('events')

module.exports = class MockChannel extends EventEmitter {
  constructor () {
    super()
    this._closed = false
  }

  assertQueue (queueName, options) {
    return Promise.resolve()
  }

  prefetch (prefetchValue) {
    return Promise.resolve()
  }

  consume (queueName, onMessage) {
    this.on('test-message', (testMessage) => {
      onMessage(testMessage)
    })
  }

  ack (message) {
    return Promise.resolve()
  }

  nack (message) {
    return Promise.resolve()
  }

  cancel (tag) {
    return Promise.resolve()
  }

  close () {
    if (this._closed) {
      throw new Error('Already closed')
    }
    this._closed = true
  }
}
