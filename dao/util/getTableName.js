module.exports = function (modelType) {
  if (!modelType.typeName) {
    throw new Error('Entity model requires a "typeName" property')
  }
  return modelType.typeName.toLowerCase()
}
