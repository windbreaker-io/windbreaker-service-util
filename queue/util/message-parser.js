const msgpack = require('msgpack-lite')

exports.encode = function (message) {
  return msgpack.encode(message)
}

exports.decode = function (message) {
  return msgpack.decode(message)
}
