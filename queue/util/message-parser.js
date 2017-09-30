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

  // Always report errors for Event model wrapping. These properties should
  // always exist even if the underlying data in the Event is corrupt.
  const errors = []
  const event = Event.wrap(message, errors)

  if (errors.length) {
    throw new Error(`Error decoding event. Errors: "${errors.join(',')}"`)
  }

  const convertDataErrors = []

  // Convert the event's "data" property back to its orignal model type
  event.convertData(convertDataErrors)

  if (convertDataErrors.length) {
    throw new Error(`Error converting data from decode: "${convertDataErrors.join(',')}"`)
  }

  return event
}
