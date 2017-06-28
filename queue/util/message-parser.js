const msgpack = require('msgpack-lite')
const Model = require('~/models/Model')
const Event = require('~/models/events/Event')

/**
* Encode an object or a fashion-model
* @param message {Object|Model}
* @return {Buffer} - Encoded message using msgpack
*/
exports.encode = function (message) {
  let data = Model.isModel(message) ? message.clean() : message
  return msgpack.encode(data)
}

/**
* Decodes a message and wraps in an Event model
* @param message {Buffer} - Buffer to decode and wrap into an Event model
*/
exports.decode = function (message) {
  message = msgpack.decode(message)
  return Event.wrap(message)
}
