const fs = require('fs')
const path = require('path')
const request = require('superagent')
const addToContext = require('./addToContext')
const integrationTest = require('./integration-test')

function buildTest ({ testFile, context, dir, file, beforeEach, afterEach, buildEndpoint }) {
  let payload
  try {
    payload = require(path.join(dir, file, 'payload.json'))
  } catch (err) {
    payload = {}
  }

  const expectError = testFile.expectError

  return async (t) => {
    let runAfterEach = false

    addToContext(t, { testFile, payload })

    try {
      if (beforeEach) {
        await beforeEach(t)
      }

      const { httpServerPort } = context

      addToContext(t, { httpServerPort })

      // First check if there is a `buildEndpoint` function exported from the
      // test file. If there isn't, fall back to the default one that is
      // provided in the integration test file that was called to register
      // these tests
      let endpoint
      if (testFile.buildEndpoint) {
        endpoint = testFile.buildEndpoint(t)
      } else if (buildEndpoint) {
        endpoint = buildEndpoint(t)
      }

      if (!endpoint) {
        throw new Error('Invalid endpoint. Either export "buildEndpoint" function from the test file ' +
          'or provide one in the "buildEndpoint" hook')
      }

      addToContext(t, { endpoint, request })

      let response
      try {
        if (testFile.request) {
          response = await testFile.request(t)
        }

        if (expectError === true) {
          throw new Error('An error was expected in this request')
        }
      } catch (err) {
        if (expectError !== true) {
          throw err
        }

        response = err.response
      }

      const snapshot = {
        body: response.body,
        status: response.status
      }

      if (response.error) {
        snapshot.error = response.error.text
      }

      t.snapshot(snapshot)

      runAfterEach = true

      if (afterEach) {
        await afterEach(t)
      }
    } catch (err) {
      if (afterEach && !runAfterEach) {
        await afterEach(t)
      }

      throw err
    }
  }
}

exports.register = function ({ test, dir, beforeEach, afterEach, buildEndpoint, startupTasks, server }) {
  const { httpServerPort } = integrationTest.register({
    test,
    startupTasks,
    server
  })

  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const testFile = require(path.join(dir, file, 'test.js'))

    let testDescription = `payload test "${file}"`

    if (testFile.description) {
      testDescription += ` - ${testFile.description}`
    }

    test(testDescription, buildTest({
      testFile,
      context: {
        httpServerPort
      },
      dir,
      file,
      beforeEach,
      afterEach,
      buildEndpoint
    }))
  })
}
