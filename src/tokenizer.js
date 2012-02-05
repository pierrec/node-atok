/**
 * class Tokenizer
 *
 * Stream based tokenizer for nodejs
 *
**/
/*
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
**/
var assert = require('assert')
  , Stream = require('stream').Stream
  , fs = require('fs')
  , path = require('path')
  , vm = require('vm')

var inherits = require('inherits')
  // , Buffers = require('buffers')

var RuleString = require('./string/rule')
// var RuleBuffer = require('./buffer/ruleBuffer')

var slice = Array.prototype.slice
var isArray = require('util').isArray
var defaultEncoding = 'UTF-8'
function noOp () {}

module.exports = Tknzr

/**
 * new Tokenizer(options)
 * - options (Object):
 * - options.bufferMode (Boolean): use Buffers instead of string (false)
 * - options.encoding (String): encoding to be used (utf8)
 *
**/
function Tknzr (options) {
  if (!(this instanceof Tknzr))
    return new Tknzr(options)

  Stream.call(this)
  this.writable = true
  this.readable = true

  // Options
  options = options || {}
  this._bufferMode = (options.bufferMode === true)
  this._encoding = options.encoding || defaultEncoding

  // Initializations
  // Status flags
  this.ended = false      // Flag indicating stream has ended
  this.paused = false     // Flag indicating stream is paused
  this.needDrain = false  // Flag indicating stream needs drain

  this.clear()
}
inherits(Tknzr, Stream)
Tknzr.prototype._error = function (err) {
  this.emit('error', err)
  return this
}
/*
 * Stream compatible methods
 */
/*
 * Tokenizer#write(data) -> Boolean
 * - data (String | Buffer): data to be processed
 *
 * Apply the current rules to the incoming data.
 * When false is returned (the tokenizer is paused), the data is buffered but
 * no processing occurs until the tokenizer is resumed.
**/
Tknzr.prototype.write = function (data) {
  if (this.ended) {
    this._error( new Error('Tokenizer#write: write after end') )
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
      case 'utf-8':
      case 'utf8':
        if (this.lastByte >= 0) { // Process the missing utf8 character
          this.buffer += new Buffer([ this.lastByte, data[0] ]).toString('UTF-8')
          this.length++

          this.lastByte = -1
          data = data.slice(1)
        }
        var c = data[data.length-1]
        if (c == 0xC2 || c == 0xC3) {
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
Tknzr.prototype.end = function (data) {
  this.write(data)
  this.ended = true
  return this._end()
}
Tknzr.prototype.pause = function () {
  this.paused = true
  return this
}
Tknzr.prototype.resume = function () {
  this.paused = false
  return this._tokenize()
}
Tknzr.prototype.destroy = noOp
/*
 * Tokenizer private methods
 */
Tknzr.prototype._end = function () {
  var buf = this.buffer
    , mode = this._bufferMode
    , rule = this.currentRule
  
  if (buf.length > 0)
    this.emit('end', mode ? buf.slice() : buf, -1, rule)
  else
    this.emit('end')
  
  this.clear()
}
Tknzr.prototype._done = function () {
  if (this.needDrain) {
    this.needDrain = false
    this.emit('drain')
  }

  if (this.ended) {
    this._end()
    return false
  }

  return true
}
Tknzr.prototype._tokenize = function () {
  // NB. Rules and buffer can be reset by the token handler
  if (this.offset < this.length) {
    for (
        var i = 0, p, matched
      ; this.offset < this.length && i < this.rules.length
      ; i++
      )
    {
      p = this.rules[i]
      // Return the size of the matched data (0 is valid!)
      matched = p.test(this.buffer, this.offset)
      // console.log('tokenize:', p, this.offset, matched)
      if ( matched >= 0 ) {
        this.offset += matched
        // Is the token to be processed?
        if ( !p.ignore ) {
          // Emit the data by default, unless the handler is set
          if (p.handler) p.handler(p.token, p.idx, p.type)
          else this.emit('data', p.token, p.idx, p.type)
        }
        // Load a new set of rules
        if (p.next) this.loadRuleSet(p.next)
        // Hold on if the stream was paused
        if (this.paused) {
          this.needDrain = true
          return false
        }
        // Continue?
        if (p.continue >= 0) {
          i += p.continue
        } else {
          // Skip the token and keep going, unless rule returned 0
          if (matched > 0) i = -1
        }
        this.bytesRead += matched
      }
    }
  }
  if (this.offset > 0) {
    // Remove tokenized data from the buffer
    if (this.offset == this.length) {
      this.offset = 0
      this.buffer = this._bufferMode ? new Buffer : ''
      this.length = 0
      if (this.emptyHandler) this.emptyHandler()
    } else if (this.offset > this.length) {
      // Can only occurs after #seek was called
      this.offset = this.offset - this.length
      this.buffer = this._bufferMode ? new Buffer : ''
      this.length = 0
    } else {
      this.buffer = this._bufferMode
        ? this.buffer.splice( this.offset )
        : this.buffer.substr( this.offset )
      this.length -= this.offset
      this.offset = 0
    }
  }
  
  return this._done()
}
//include(methods_misc.js)
//include(methods_ruleprops.js)
//include(methods_ruleset.js)