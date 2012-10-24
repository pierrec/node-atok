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
  if (this.length > 0) {
    // Process strings and Buffers separately
    // Once a type has been written to the stream, it must stay the same thereon
    if (typeof data === 'string') {
      this.buffer += this._stringDecoder.write(data)
    } else {
      this.buffer = this.buffer.concat(data)
      // this.buffer = Buffer.concat( [ this.buffer, data ], this.length )
    }
  } else {
    this.buffer = data
  }
  this.length = this.buffer.length

  // ... hold on until tokenization completed on the current data set
  // or consume the data
  if (this.paused) {
    this.needDrain = true
    return false
  }

  // Check rules resolution
  if (this._rulesToResolve) this._resolveRules()

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

  this.readable = false
  this.writable = false

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
Atok.prototype.destroy = function () {
  this.readable = false
  this.writable = false
}

/**
 * Private methods
 */

/**
 * End a stream by emitting the `end` event with remaining data
 * @private
 */
Atok.prototype._end = function () {
  this.emit_end( this.buffer, -1, this.currentRule )
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
  this._tokenizing = true

  // NB. Rules and buffer can be reset by the token handler
  var i = this._ruleIndex, p, props, matched
  var token

  this._ruleIndex = 0
  this._resetRuleIndex = false

  for (
    ; this.offset < this.length && i < this._rules.length
    ; i++
    )
  {
    p = this._rules[i]
    props = p.props

    // Return the size of the matched data (0 is valid!)
    matched = p.test(this.buffer, this.offset)

    if ( matched >= 0 ) {
      // Is the token to be processed?
      if ( !props.ignore ) {
        // Emit the data by default, unless the handler is set
        token = props.quiet
          ? matched - (p.single ? 0 : p.last.length) - p.first.length
          : this.buffer.slice(
              this.offset + p.first.length
            , this.offset + matched - (p.single ? 0 : p.last.length)
            )

        if (p.handler) p.handler(token, p.last.idx, p.type)
        else this.emit_data(token, p.last.idx, p.type)
      }
      this.offset += matched
      // Load a new set of rules
      if (props.next[0]) this.loadRuleSet(props.next[0], props.next[1])

      // Rule set may have changed...from loadRuleSet() or handler()
      if (this._resetRuleIndex) {
        this._resetRuleIndex = false
        i = this._ruleIndex - 1
      } else {
        i += p.continue
      }

      // NB. `break()` prevails over `pause()`
      if (props.break) {
        i++
        break
      }

      // Hold on if the stream was paused
      if (this.paused) {
        this._ruleIndex = i + 1
        this.needDrain = true
        this._tokenizing = false
        return false
      }
    } else {
      i += p.continueOnFail
    }
  }
  
  // Keep track of the rule index we are at
  this._ruleIndex = i < this._rules.length ? i : 0

  // Truncate the buffer if possible: min(offset, markedOffset)
  if (this.markedOffset < 0) {
    // No marked offset or beyond the current offset
    if (this.offset === this.length) {
      this.offset = 0
      this.buffer = null
      this.length = 0
      this.emit_empty(this.ending)

    } else if (this.offset < this.length) {
      this.buffer = this.slice(this.offset)
      this.length = this.buffer.length
      this.offset = 0

    } else {
      // Can only occurs if offset was manually incremented
      this.offset = this.offset - this.length
      this.buffer = null
      this.length = 0
    }

  } else {
    var maxOffset = 'markedOffset'
    var minOffset = 'offset'
    var _

    if (this.markedOffset < this.offset) {
      _ = maxOffset
      maxOffset = minOffset
      minOffset = _
    }

    if (this[minOffset] === this.length) {
      this[maxOffset] -= this[minOffset]
      this[minOffset] = 0
      this.buffer = null
      this.length = 0
      this.emit_empty(this.ending)

    } else if (this[minOffset] < this.length) {
      this[maxOffset] -= this[minOffset]
      this.buffer = this.slice(this[minOffset])
      this.length = this.buffer.length
      this[minOffset] = 0

    } else {
      // Can only occurs if offset was manually incremented
      this[maxOffset] -= this.length
      this[minOffset] -= this.length
      this.buffer = null
      this.length = 0
    }
  }

  this._tokenizing = false
  
  return this._done()
}
