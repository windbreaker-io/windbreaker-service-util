const EventEmitter = require('events')

module.exports = class MockConnection extends EventEmitter {
  constructor (channel) {
    super()
    this._mockChannel = channel
  }

  createChannel () {
    return Promise.resolve(this._mockChannel)
  }
}
