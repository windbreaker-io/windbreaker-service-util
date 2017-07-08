const EventEmitter = require('events')
const conflogger = require('conflogger')

class BaseQueue extends EventEmitter {
  constructor ({queueName, connection, tag, channel, logger}) {
    super()
    this._queueName = queueName
    this._connection = connection
    this._logger = conflogger.configure(logger)
    // The following is set for testing purposes, but should
    // never be passed. The QueueConsumer and QueueProducer are
    // responsible for setting the `channel` property
    this._channel = channel
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
        this._logger.error('Error closing channel', err)
        throw err
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
