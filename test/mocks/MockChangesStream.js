const EventEmitter = require('events')
const Promise = require('bluebird')

module.exports = class MockChangesStream extends EventEmitter {
  destroy () {
    return Promise.resolve()
  }
}
