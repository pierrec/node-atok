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
  this.emit('seek', i)
  this.bytesRead += i
  this.offset += i
  if (this.offset < 0)
    return this._error( new Error('Tokenizer#seek: negative offset: ' + this.offset + ' from ' + i) )
  return this
}