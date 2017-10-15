const koaBodyParser = require('koa-bodyparser')()

module.exports = function getCommonMiddleware () {
  return [
    koaBodyParser
  ]
}
