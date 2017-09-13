const EventEmitter = require('events')
const Promise = require('bluebird')

module.exports = class MockProducer extends EventEmitter {
  emitError () {
    this.emit('error', new Error('mockProducer error'))
  }
  stop () {
    return Promise.resolve()
  }
  sendMessage () {
    return Promise.resolve()
  }
}
