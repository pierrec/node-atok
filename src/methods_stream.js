/**
 * Applies the current rules to the incoming data.
 * When false is returned (the tokenizer is paused), the data is buffered but
 * no processing occurs until the tokenizer is resumed.
 *
 * @param {string|Buffer} data to be processed
 * @return {boolean} whether `Atok#write()` can be called again
 * @api public
 */
Atok.prototype.write = function (data) {
  if (this.ended) {
    this._error( new Error('Atok#write: write after end') )
    return false
  }

  if (!data || data.length === 0) return true

  // Buffer the incoming data...
  if (this._bufferMode) {
    this.buffer.push( data )
    this.length += data.length
  } else {
    // Check for cut off UTF-8 characters
    switch (this._encoding) {
      case 'UTF-8':
        if (this._lastByte >= 0) { // Process the missing utf8 character
          this.buffer += new Buffer([ this._lastByte, data[0] ]).toString('UTF-8')
          this.length++

          this._lastByte = -1
          data = data.slice(1)
        }
        var c = data[data.length-1]
        if (c === 0xC2 || c === 0xC3) {
          // Keep track of the cut off byte and remove it from the current Buffer
          this._lastByte = c
          data = data.slice(0, data.length-1)
        }
      break
      default:
    }
    var str = data.toString( this._encoding )
    this.buffer += str
    this.length += str.length
  }
  // ... hold on until tokenization completed on the current data set
  // or consume the data
  if (this.paused) {
    this.needDrain = true
    return false
  }
  return this._tokenize()
}
/**
 * Ends the stream and emit the `end` event. Any remaining data is passed to 
 * the listeners.
 *
 * @param {string|Buffer} data to be processed
 * @return {Atok}
 * @api public
 */
Atok.prototype.end = function (data) {
  this.ending = true
  this.write(data)
  this.ended = true
  this.ending = false
  this._end()
  return this
}
/**
 * Pauses the stream - data is buffered until the 
 *  stream is resumed with `Atok#resume()`
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.pause = function () {
  this.paused = true
  return this
}
/**
 * Resumes the stream - buffered data is immediately processed
 *
 * @return {boolean} same as `Atok#write()`
 * @api public
 */
Atok.prototype.resume = function () {
  this.paused = false
  return this._tokenize()
}
/**
 * Placeholder for `Atok#destroy()`
 *
 * @api public
 */
Atok.prototype.destroy = function () {}

/**
 * Private methods
 */

/**
 * End a stream by emitting the `end` event with remaining data
 * @private
 */
Atok.prototype._end = function () {
  this.emit_end( this._slice(), -1, this.currentRule)
  this.clear()
}
/**
 * End of `Atok#write()`: emit the `drain` event if required
 * @private
 */
Atok.prototype._done = function () {
  if (this.needDrain) {
    this.needDrain = false
    this.emit_drain()
  }

  if (this.ended) {
    this._end()
    return false
  }

  return true
}
/**
 * The core of Atok. Loops through the rules and check them against the data,
 * calling handler or emitting the `data` event and branching appropriately.
 * 
 * @return {boolean}
 * @private
 */
Atok.prototype._tokenize = function () {
  // NB. Rules and buffer can be reset by the token handler
  var i = this.ruleIndex, p, matched

  this.ruleIndex = 0
  this._resetRuleIndex = false

  for (
    ; this.offset < this.length && i < this.rules.length
    ; i++
    )
  {
    p = this.rules[i]
    // Check that there is enough data to check the first rule
    if (p.length > 0 && (this.length - this.offset) < p.length) break

    // Return the size of the matched data (0 is valid!)
    matched = p.test(this.buffer, this.offset)
    if ( matched >= 0 ) {
      this.offset += matched
      this.bytesRead += matched
      this.ruleIndex = i
      // Is the token to be processed?
      if ( !p.ignore ) {
        // Emit the data by default, unless the handler is set
        if (p.handler) p.handler(p.token, p.idx, p.type)
        else this.emit_data(p.token, p.idx, p.type)
      }
      // Load a new set of rules
      if (p.next) this.loadRuleSet(p.next, p.nextIndex)

      // Rule set may have changed...
      if (this._resetRuleIndex) {
        this._resetRuleIndex = false
        i = this.ruleIndex - 1
      // Continue?
      } else if (p.continue !== null) {
        i += p.continue
        if (i > this.rules.length || i < -1)
          this._error( new Error('Out of bound rules index: ' + i + ' = ' +
            (i - p.continue) + ' + ' + p.continue + ' > ' + this.rules.length
          ))
        // Keep track of the rule index we are at
        this.ruleIndex = i + 1
        // Skip the token and keep going, unless rule returned 0
      } else if (matched > 0) {
        i = -1
        this.ruleIndex = 0
      }

      if (p.break) break

      // Hold on if the stream was paused
      if (this.paused) {
        // Keep track of the rule index we are at
        this.ruleIndex = i + 1
        this.needDrain = true
        return false
      }
    } else if (p.continueOnFail !== null) {
      i += p.continueOnFail
      if (i > this.rules.length || i < -1)
        this._error( new Error('Out of bound rules index: ' + i + ' = ' +
          (i - p.continueOnFail) + ' + ' + p.continueOnFail + ' > ' + this.rules.length
        ))
      // Keep track of the rule index we are at
      this.ruleIndex = i + 1
    }
  }

  if (this.offsetBuffer < 0) {
    // Remove tokenized data from the buffer
    if (this.offset === this.length) {
      this.offset = 0
      this.buffer = this._bufferMode ? new Buffer : ''
      this.length = 0
      this.emit_empty(this.ending)

      var emptyHandler = this.emptyHandler, n = emptyHandler.length
      if (n > 0) {
        for (i = 0, n = emptyHandler.length; i < n; i++) {
          p = emptyHandler[i]

          if ( !p.ignore ) {
            if (p.handler) p.handler(this.ending)
            else this.emit_data(p.token, p.idx, p.type)
          }

          if (p.next) this.loadRuleSet(p.next, p.nextIndex)

          if (this._resetRuleIndex) this._resetRuleIndex = false
          else if (p.continue !== null) this.ruleIndex = i + 1

          if (this.paused) {
            this.ruleIndex = i + 1
            this.needDrain = true
            return false
          }
        }
      }
    } else if (this.offset > this.length) {
      // Can only occurs after #seek was called
      this.offset = this.offset - this.length
      this.buffer = this._bufferMode ? new Buffer : ''
      this.length = 0
    } else {
      this.buffer = this._slice(this.offset)
      this.length -= this.offset
      this.offset = 0
    }
  }
  
  return this._done()
}
