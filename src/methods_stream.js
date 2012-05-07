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

  if (!data) return true

  // Buffer the incoming data...
  if (this._bufferMode) {
    this.buffer.push( data )
    this.length += data.length
  } else {
    // Check for cut off UTF-8 characters
    switch (this._encoding) {
      case 'UTF-8':
        if (this.lastByte >= 0) { // Process the missing utf8 character
          this.buffer += new Buffer([ this.lastByte, data[0] ]).toString('UTF-8')
          this.length++

          this.lastByte = -1
          data = data.slice(1)
        }
        var c = data[data.length-1]
        if (c === 0xC2 || c === 0xC3) {
          // Keep track of the cut off byte and remove it from the current Buffer
          this.lastByte = c
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
Atok.prototype.destroy = noop

/*
 * Private methods
 */

/**
 * End a stream by emitting the `end` event with remaining data
 * @private
 */
Atok.prototype._end = function () {
  var buf = this.buffer
    , mode = this._bufferMode
    , rule = this.currentRule
  
  if (buf.length > 0)
    this.emit_end(mode ? buf.slice() : buf, -1, rule)
  else
    this.emit_end()
  
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
 * @private
 */
Atok.prototype._tokenize = function () {
  this._resetRuleIndex = false
  // NB. Rules and buffer can be reset by the token handler
  if (this.offset < this.length && this.ruleIndex <= this.rules.length) {
    for (
        var i = this.ruleIndex, p, matched
      ; this.offset < this.length && i < this.rules.length
      ; i++
      )
    {
      p = this.rules[i]
      // Return the size of the matched data (0 is valid!)
      matched = p.test(this.buffer, this.offset)
      if ( matched >= 0 ) {
        this.offset += matched
        this.bytesRead += matched
        // Is the token to be processed?
        if ( !p.ignore ) {
          // Emit the data by default, unless the handler is set
          if (p.handler) p.handler(p.token, p.idx, p.type)
          else this.emit_data(p.token, p.idx, p.type)
        }
        // Load a new set of rules
        if (p.next) this.loadRuleSet(p.next)

        // Rule set may have changed...
        if (this._resetRuleIndex) {
          this._resetRuleIndex = false
          if (matched > 0) i = -1
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
        } else if (matched > 0) i = -1
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
  }
  if (this.offsetBuffer < 0) {
    // Remove tokenized data from the buffer
    if (this.offset === this.length) {
      this.offset = 0
      this.buffer = this._bufferMode ? new Buffer : ''
      this.length = 0
      this.emit_empty(this.ending)
      var p = this.emptyHandler
      if (p) {
        if ( !p.ignore ) {
          if (p.handler) p.handler(this.ending)
          else this.emit_data(this.ending)
        }
        if (p.next) this.loadRuleSet(p.next)
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