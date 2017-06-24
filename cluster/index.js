const os = require('os')
const clusterMaster = require('cluster-master')

const numOfCpus = os.cpus().length

exports.register = function (fileToExec, args) {
  return clusterMaster({
    exec: fileToExec,
    size: numOfCpus,
    args
  })
}
