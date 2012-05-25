/**
 * Reset the tokenizer by clearing its buffer and rules
 *
 * @param {boolean} keep rules set (default=false)
 * @return {Atok}
 * @api public
 */
Atok.prototype.clear = function (keepRules) {
//var keepRules = true
//include("Atok_properties.js")

  this.clearProps()

  return this
}
/**
 * Extract data from the buffer
 *
 * @param {number} starting index
 * @param {number} ending index
 * @return {Object} extracted data
 * @api private
 */
Atok.prototype._slice = function (start, end) {
  if (arguments.length === 0) start = this.offset
  if (arguments.length <= 1) end = this.length
  return this._bufferMode
    ? this.buffer.slice(start, end)
    : this.buffer.substr(start, end - start)
}
/**
 * Terminate the current tokenizing and return the current buffer
 *
 * @return {Object} left over data
 * @api public
 */
Atok.prototype.flush = function () {
  var data = this._slice()
  
  this.clear(true) // Keep rules!

  return data
}
/**
 * Set the string encoding
 *
 * @param {string} encoding to be used
 * @return {Atok}
 * @api public
 */
Atok.prototype.setEncoding = function (enc) {
  switch (enc) {
    case 'UTF-8':
    case 'utf-8':
    case 'utf8':
    default:
      this._encoding = 'UTF-8'
  }
  return this
}
/**
 * Turn debug mode on or off. Emits the [debug] event.
 * The #loadRuleSet method is also put in debug mode.
 * All handlers log their arguments.
 *
 * @param {boolean} toggle debug mode on and off
 * @return {Atok}
 * @api public
 */
Atok.prototype.debug = function (flag) {
  var _debug = !!flag

  // Nothing to do if already in same mode
  if (_debug === this.debugMode) return this
  this.debugMode = _debug

  // Apply debug mode to all defined rules...
  this._rulesForEach(function (rule) {
    rule.setDebug()
  })

  // Apply debug mode to some methods
  var self = this
  ;[ 'loadRuleSet' ].forEach(function (method) {
    if (_debug) {
      var prevMethod = self[method]

      self[method] = function () {
        self.emit_debug( 'Atok#', method, arguments )
        return prevMethod.apply(self, arguments)
      }
      // Save the previous method
      self[method].prevMethod = prevMethod
    } else if (self[method].prevMethod) {
      // Restore the method
      self[method] = self[method].prevMethod
    }
  })

  return this
}
/**
 * Apply an iterator to all current rules
 *
 * @param {function()} iterator
 * @api private
 */
Atok.prototype._rulesForEach = function (fn) {
  this._rules.forEach(fn)

  var saved = this._savedRules
  Object.keys(saved).forEach(function (ruleSet) {
    saved[ruleSet].rules.forEach(fn)
  })
}
