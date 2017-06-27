/**
 * A very high level consumer
 *
 * Mainly used to encapsulate reconnect logic and
 * allow for consumers to know
 */
const EventEmitter = require('events')

const _createConsumer = require('./util/createConsumer')

const DEFAULT_RECONNECT_TIMEOUT = 5000

// TODO: Only restart this X number of times before stopping and reporting
// back to the user that there was a fatal error. Otherwise, we may get stuck
// in an infinite loop of trying to restart a consumer that will never start.
function _restartConsumer (managedConsumer, createConsumerOptions) {
  const reconnectTimeout = createConsumerOptions.reconnectTimeout || DEFAULT_RECONNECT_TIMEOUT
  const consumerOptions = createConsumerOptions.consumerOptions

  if (consumerOptions) {
    // Dispose of the orignal connection object that was passed, so we can start
    // with a fresh connection
    delete consumerOptions.connection
  }

  setTimeout(async () => {
    try {
      await managedConsumer.start()
      const consumer = managedConsumer.getConsumer()
      managedConsumer._simpleConsumer = consumer

      // emit an event notifying users that a consumer was restarted
      managedConsumer.emit('consumer-restarted', consumer)
    } catch (err) {
      managedConsumer.emit('consumer-restart-failed', err)
    }
  }, reconnectTimeout)
}

class ManagedConsumer extends EventEmitter {
  constructor (options) {
    super()

    const {
      logger,
      amqUrl,
      restart,
      reconnectTimeout,
      consumerOptions,
      onMessage
    } = options

    this._logger = logger
    this._amqUrl = amqUrl
    this._restart = !!restart
    this._reconnectTimeout = reconnectTimeout || DEFAULT_RECONNECT_TIMEOUT
    this._simpleConsumerOptions = consumerOptions
    this._onMessage = onMessage
    this._simpleConsumer = null
  }

  async start () {
    const createConsumerOptions = {
      logger: this._logger,
      amqUrl: this._amqUrl,
      reconnectTimeout: this._reconnectTimeout,
      consumerOptions: this._simpleConsumerOptions,
      onMessage: this._onMessage
    }

    const consumer = this._simpleConsumer = await _createConsumer(createConsumerOptions)

    // consumer will emit an error if a channel or connection unexpectedly closes
    // only handle error once
    consumer.once('error', (err) => {
      this._simpleConsumer = null
      this.emit('consumer-stopped', err)
      // if set to restartConsumer, listen for a stopped event to be emit
      if (this._restart) {
        _restartConsumer(this, createConsumerOptions)
      }
    })

    return consumer
  }

  async stop () {
    const consumer = this._simpleConsumer
    if (consumer) {
      await consumer.stop()
    }
  }

  getConsumer () {
    return this._simpleConsumer
  }
}

module.exports = ManagedConsumer
