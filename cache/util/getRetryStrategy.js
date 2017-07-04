// simple retry strategy (with a little jitter)

// default max delay in milliseconds
const DEFAULT_MAX_DELAY = 60000

module.exports = function getRetryStrategy (maxDelay) {
  const maximumDelay = maxDelay || DEFAULT_MAX_DELAY

  return function (retryCount) {
    return Math.min((Math.random() * 1000) + 1000 +
      (retryCount * 1000), maximumDelay)
  }
}
