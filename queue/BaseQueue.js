const EventEmitter = require('events')
const conflogger = require('conflogger')

class BaseQueue extends EventEmitter {
  constructor ({queueName, connection, tag, logger}) {
    super()
    this._queueName = queueName
    this._connection = connection
    this._logger = conflogger.configure(logger)
    this._channel = null
    this._tag = tag
  }

  getQueueName () {
    return this._queueName
  }

  getTag () {
    return this._tag
  }

  async cancelChannel () {
    return this._channel.cancel(this._tag)
  }

  async closeChannel () {
    return this._channel.close()
  }

  async stop () {
    if (this._channel) {
      try {
        await this.cancelChannel()
        await this.closeChannel()
      } catch (err) {
        this._logger.info('Error closing channel', err)
      } finally {
        this._channel = null
      }
    }
  }

  getConnection () {
    return this._connection
  }
}

module.exports = BaseQueue
