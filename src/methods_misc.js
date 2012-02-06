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
  this.matchEventHandler = null

  // Rule flags
  this._clearRuleProp()

  if (!keepRules) {
    this.currentRule = null   // Name of the current rule  
    this.emptyHandler = null  // Handler to trigger when the buffer becomes empty
    this.endHandler = null    // Handler to trigger when the tokenizer ends
    this.rules = []           // Rules to be checked against
    this.handler = null       // Matched token default handler
    this.saved = {}           // Saved rules
  }

  return this
}
Tknzr.prototype._clearRuleProp = function () {
  this._ignore = false     // Get the token size and skip
  this._quiet = false      // Get the token size and call the handler with no data
  this._escape = false     // Pattern must not be escaped
  this._trimLeft = true    // Remove the left pattern from the token
  this._trimRight = true   // Remove the right pattern from the token
  this._next = null        // Next rule to load
  this._continue = null    // Next rule index to load
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
  this._encoding = enc || defaultEncoding
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