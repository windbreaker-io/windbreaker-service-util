const Koa = require('koa')
const Router = require('koa-path-router')
const conflogger = require('conflogger')
const getCommonMiddleware = require('./util/getCommonMiddleware')

function registerRoute (router, route, logger) {
  let { middleware, method, path, handler } = route
  method = method.toUpperCase()

  logger.info('Registering route: ', method, path)
  router.register({ path, method, middleware, handler })
}

/**
* Creates a generic HTTP server
*
* @param options {Object}
*  - options.routes {Object[]} - A route object containing { middlware, method, path, handler }
*  - options.httpServerPort {Number} - The port that the HTTP server should listen on
*  - options.logger {Object}
*/
exports.createServer = function ({ routes, httpServerPort, logger }) {
  logger = conflogger.configure(logger)

  const app = new Koa()
  const router = new Router()

  getCommonMiddleware().forEach((middleware) => app.use(middleware))
  routes.forEach((route) => registerRoute(router, route, logger))

  app.use(router.getRequestHandler())

  // TODO: Use koa-sslify to add certs
  const server = app.listen(httpServerPort)

  logger.info('Starting on port: ', httpServerPort)
  return server
}
