/** chainable
 * Tokenizer#clear(keepRules)
 * - keepRules (Boolean): keep rules set (default=false)
 *
 * Reset the tokenizer by clearing its buffer and rules
**/
Tknzr.prototype.clear = function (keepRules) {
  // Buffered data
  this.buffer = this._bufferMode ? new Buffer : ''
  this.length = 0
  this.lastByte = -1
  this.bytesRead = 0
  this.offset = 0
  this.ruleIndex = 0

  // Rule flags
  this.clearProps()

  if (!keepRules) {
    this.currentRule = null   // Name of the current rule  
    this.emptyHandler = noop  // Handler to trigger when the buffer becomes empty
    this.rules = []           // Rules to be checked against
    this.handler = null       // Matched token default handler
    this.saved = {}           // Saved rules
    this.savedProps = {}      // Saved rules properties
  }

  return this
}
Tknzr.prototype._slice = function (start, end) {
  if (arguments.length === 0) start = this.offset
  if (arguments.length <= 1) end = this.length
  return this._bufferMode
    ? this.buffer.slice(start, end)
    : this.buffer.substr(start, end - start)
}
/**
 * Tokenizer#flush()
 *
 * Terminate the current tokenizing and return the current buffer
**/
Tknzr.prototype.flush = function () {
  var data = this._slice()
  
  this.clear(true) // Keep rules!

  return data
}
/** chainable
 * Tokenizer#setEncoding(encoding)
 * - encoding (String): encoding to be used
 *
 * Set the string encoding
**/
Tknzr.prototype.setEncoding = function (enc) {
  switch (enc) {
    case 'UTF-8':
    case 'utf-8':
    case 'utf8':
    default:
      this._encoding = 'UTF-8'
  }
  return this
}
/** chainable
 * Tokenizer#seek(i)
 * - i (Integer): move by this amount (can be negative)
 *
 * Move the cursor on the current buffer by a given amount.
 * Positive buffer overrun supported (will offset on the next data chunk)
**/
Tknzr.prototype.seek = function (i) {
  this.bytesRead += i
  this.offset += i
  if (this.offset < 0)
    return this._error( new Error('Tokenizer#seek: negative offset: ' + this.offset + ' from ' + i) )
  return this
}
/** chainable
 * Tokenizer#debug(flag)
 * - flag (Boolean|Function): toggle debug mode on and off.
 *
 * Turn debug mode on or off. Emits the [debug] event if no function supplied.
 * The #seek and #loadRuleSet methods are also put in debug mode.
**/
Tknzr.prototype.debug = function (flag) {
  var self = this
  var _debug = (flag === true)
    ? this.emit_debug
    : typeof flag === 'function'
      ? flag
      : false
  
  this._debug = _debug

  // Apply debug mode to all defined rules...
  this._rulesForEach(function (rule) {
    rule.setDebug(_debug)
  })

  // Apply debug mode to the #seek() and #loadRuleSet() methods
  ;[ 'seek', 'loadRuleSet' ].forEach(function (method) {
    var _method = ['Tokenizer#' + method]

    function debugFn () {
      _debug.apply( self, _method.concat( sliceArguments(arguments, 0) ) )
    }

    methodOverload(
      self
    , method
    , _debug ? debugFn : null
    )
  })

  return this
}

Tknzr.prototype._rulesForEach = function (fn) {
  this.rules.forEach(fn)

  var saved = this.saved
  Object.keys(saved).forEach(function (ruleSet) {
    saved[ruleSet].rules.forEach(fn)
  })
}
