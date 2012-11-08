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
 * Extract data from the buffer (Atok#slice)
 *
 * @param {number} starting index
 * @param {number} ending index
 * @return {Object} extracted data
 * @api public
 */
Atok.prototype.slice = function (start, end) {
  return this.buffer.slice(start, end)
}
/**
 * Terminate the current tokenizing and return the current buffer
 *
 * @return {Object} left over data
 * @api public
 */
Atok.prototype.flush = function () {
  var data = this.slice()
  
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
  switch ( String(enc) ) {
    case 'null':
    case 'undefined':
      this._encoding = null
    break
    case 'UTF-8':
    case 'utf-8':
    case 'utf8':
    default:
      this._encoding = 'UTF-8'
  }
  this._stringDecoder = this._encoding
    ? new StringDecoder(this._encoding)
    : null

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
  var self = this
  this._rulesForEach(function (rule) {
    rule.setDebug(_debug, self)
  })

  // Apply debug mode to some methods
  ;[ 'loadRuleSet' ].forEach(function (method) {
    if (_debug) {
      var prevMethod = self[method]

      self[method] = function () {
        self.emit_debug( 'Atok#', method, arguments )
        return prevMethod.apply(self, arguments)
      }
    } else {
      // Restore the prototype method
      delete self[method]
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
/**
 * Get the current rule set name
 *
 * @return {String} rule set name
 * @api public
 */
Atok.prototype.currentRule = function () {
  return this._firstRule ? this._firstRule.currentRule : null
}