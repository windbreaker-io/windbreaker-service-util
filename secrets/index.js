const secretsMap = {}

module.exports = {
  getSecret: function (key) {
    return secretsMap[key] || process.env['SERVICE_UTILS_SECRET_' + key]
  },
  setSecret: function (key, value) {
    secretsMap[key] = value
  }
}
