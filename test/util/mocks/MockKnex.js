class MockKnex {
  constructor (config) {
    this._config = config
  }

  insert () {
    return this
  }

  into () {
    return this
  }

  returning () {
    return this
  }

  select () {
    this._select = true
    return this
  }

  from () {
    return this
  }

  where () {
    return this
  }

  limit () {
    return this
  }

  destroy () {
    return Promise.resolve()
  }

  async then () {
    return Promise.resolve()
  }
}

module.exports = function mockKnex (config) {
  return new MockKnex(config)
}
