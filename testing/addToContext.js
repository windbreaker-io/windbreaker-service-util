module.exports = function addToContext (t, obj) {
  if (t.context) {
    Object.assign(t.context, obj)
  } else {
    t.context = obj
  }
}
