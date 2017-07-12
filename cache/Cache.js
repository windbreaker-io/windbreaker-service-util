const EventEmitter = require('events')
const msgpack = require('msgpack-lite')
const conflogger = require('conflogger')
const _createRedisClient = require('./util/createRedisClient')
const _getCleanArray = require('../models/util/getCleanArray')

// default entry expiration time in seconds
const DEFAULT_EXPIRATION = 86400

class Cache extends EventEmitter {
  constructor ({ logger, nodes, defaultTtl, redisClientOptions }) {
    super()
    this._logger = conflogger.configure(logger)
    this._defaultTtl = defaultTtl || DEFAULT_EXPIRATION

    this._onReady = () => this.emit('ready')
    this._onError = (err) => this.emit('error', err)
    this._onReconnecting = () => this.emit('reconnecting')
    this._onNodeError = (err) => this.emit('node-error', err)

    this._nodes = _getCleanArray(nodes)

    const redisClient = this._redisClient =
      _createRedisClient(nodes, redisClientOptions)

    // forward events to clients so that they
    // can handle situations appropriately
    redisClient
      .on('ready', this._onReady)
      .on('reconnecting', this._onReconnecting)
      .on('node error', this._onNodeError)
      .on('error', this._onError)
  }

  async get (key) {
    let encoded

    try {
      encoded = await this._redisClient.getBuffer(key)
    } catch (err) {
      this._logger.error(`Error occurred while fetching ${key}`, err)
      throw err
    }

    return encoded ? msgpack.decode(encoded) : encoded
  }

  async set (key, value, ttl) {
    const data = msgpack.encode(value)
    return this._redisClient.setex(key, ttl || this._defaultTtl, data)
  }

  async getEntity (key, ModelType) {
    let data = await this.get(key)
    if (!data) {
      return null
    }

    const errors = []
    data = ModelType.wrap(data, errors)

    if (errors.length) {
      const err = new Error(`Error(s) occured while wrapping model: ' +
        '${errors.join(',')}`)
      this._logger.error(err.message)
      throw err
    }

    return data
  }

  async setEntity (key, model, ttl) {
    const value = model.clean()
    return this.set(key, value, ttl)
  }

  async close () {
    // remove all listeners
    this._redisClient
      .removeListener('ready', this._onReady)
      .removeListener('reconnecting', this._onReconnecting)
      .removeListener('node error', this._onNodeError)
      .removeListener('error', this._onError)

    return this._redisClient.quit()
  }
}

module.exports = Cache
