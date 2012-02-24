exports.sliceArguments = function (args, index) {
  if (args.length === 0) return []

  for (
    var i = index, n = args.length, a = new Array(n - 1)
  ; i < n
  ; i++
  )
    a[i - index] = args[i]
  return a
}

exports.methodOverload = function (self, method, fn) {
  var prevMethod = fn ? self[method] : self[method].prevMethod

  if (fn) {
    self[method] = function () {
      fn.apply(self, arguments)
      return prevMethod.apply(self, arguments)
    }
    // Save the previous method
    self[method].prevMethod = prevMethod
  } else if (prevMethod) {
    // Restore the previous method
    self[method] = prevMethod
  }
}
