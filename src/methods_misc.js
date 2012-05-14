/**
 * Reset the tokenizer by clearing its buffer and rules
 *
 * @param {boolean} keep rules set (default=false)
 * @return {Atok}
 * @api public
 */
Atok.prototype.clear = function (keepRules) {
  // Public properties
  this.buffer = this._bufferMode ? new Buffer : ''
  this.length = 0
  this.bytesRead = 0
  this.offset = 0
  this.ruleIndex = 0

  // Private properties
  this._resetRuleIndex = false
  this._lastByte = -1

  // Rule flags
  this.clearProps()

  if (!keepRules) {
    this.currentRule = null   // Name of the current rule  
    this.emptyHandler = []    // Handler to trigger when the buffer becomes empty
    this.rules = []           // Rules to be checked against
    this.handler = null       // Matched token default handler
    this.saved = {}           // Saved rules
    this.savedProps = {}      // Saved rules properties
  }

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
 * Move the cursor on the current buffer by a given amount.
 * Positive buffer overrun supported (will offset on the next data chunk)
 *
 * @param {number} move by this amount (can be negative)
 * @return {Atok}
 * @api public
 */
Atok.prototype.seek = function (i) {
  this.bytesRead += i
  this.offset += i
  if (this.offset < 0)
    return this._error( new Error('Atok#seek: negative offset: ' + this.offset + ' from ' + i) )
  return this
}
/**
 * Turn debug mode on or off. Emits the [debug] event.
 * The #seek and #loadRuleSet methods are also put in debug mode.
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

  // Apply debug mode to the #seek() and #loadRuleSet() methods
  var self = this
  ;[ 'seek', 'loadRuleSet' ].forEach(function (method) {
    if (_debug) {
      var prevMethod = self[method]

      self[method] = function () {
        // self.emit_debug.apply( self, ['Atok#' + method].concat( sliceArguments(arguments, 0) ) )
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
  this.rules.forEach(fn)

  var saved = this.saved
  Object.keys(saved).forEach(function (ruleSet) {
    saved[ruleSet].rules.forEach(fn)
  })
}
