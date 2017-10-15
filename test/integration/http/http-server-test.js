const test = require('ava')
const conflogger = require('conflogger')
const porti = require('porti')
const request = require('superagent')
const { createServer } = require('~/http')

function get (endpoint, port) {
  return request.get(`:${port}${endpoint}`)
}

function post (endpoint, port, body) {
  return request
    .post(`:${port}${endpoint}`)
    .send(body)
}

test.beforeEach(async (t) => {
  const port = await porti.getUnusedPort()

  t.context = {
    logger: conflogger.configure(console),
    httpServerPort: port
  }
})

test('should allow create a sever with a GET endpoint', async (t) => {
  const { logger, httpServerPort } = t.context
  const body = { hello: 'world ' }

  const server = createServer({
    logger,
    httpServerPort,
    routes: [
      {
        method: 'GET',
        path: '/hello',
        handler (ctx) {
          ctx.body = body
        }
      }
    ]
  })

  const response = await get('/hello', httpServerPort)
  t.deepEqual(response.body, body)

  t.pass()
  server.close()
})

test('should allow create a sever with a POST endpoint', async (t) => {
  const { logger, httpServerPort } = t.context
  const body = { hello: 'world ' }

  const server = createServer({
    logger,
    httpServerPort,
    routes: [
      {
        method: 'POST',
        path: '/hello',
        handler (ctx) {
          ctx.body = ctx.request.body
        }
      }
    ]
  })

  const response = await post('/hello', httpServerPort, body)
  t.deepEqual(response.body, body)

  t.pass()
  server.close()
})
