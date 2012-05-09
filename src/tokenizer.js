/**
 * Atok - stream based tokenizer
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
 */

var assert = require('assert')
  , Stream = require('stream')
  , EV = require('ev')
  , sliceArguments = require('fnutils').slice

var inherits = require('inherits')
  // , Buffers = require('buffers')

var RuleString = require('./string/rule')
// var RuleBuffer = require('./buffer/ruleBuffer')

/**
 * Do nothing function
 * @private
 */
function noop () {}

/**
 * Expose the atok constructor
 */
module.exports = Atok

/**
 * Export atok default events
 */
Atok.events = {
  // Standard Stream events
  data: 3
, end: 3
, drain: 0
, open: 1
, close: 1
, listening: 0
, pipe: 1
// Atok specific events
, debug: 3
, empty: 1
}

/**
 * Export atok version
 */
Atok.version = require('../package.json').version

/**
 * An atok stream
 *
 * @param {Object=} atok stream options
 *  - options.bufferMode {boolean}: use Buffers instead of string (false)
 *  - options.encoding {string}: encoding to be used (utf8)
 * @constructor
 */
function Atok (options) {
  if (!(this instanceof Atok))
    return new Atok(options)

  // Possible events are defined at instanciation for better performance
  EV.call(this, Atok.events)
  this.writable = true
  this.readable = true

  // Options
  options = options || {}
  this._bufferMode = (options.bufferMode === true)
  this._encoding = options.encoding
  // Apply the default encoding value
  this.setEncoding(options.encoding)

  this.buffer = this._bufferMode ? new Buffer : ''
  this.length = 0
  this.lastByte = -1
  this.bytesRead = 0
  this.offset = 0
  this.ruleIndex = 0
  this._resetRuleIndex = false

  // Initializations
  // Debug flag
  this.debugMode = false

  // Status flags
  this.ended = false        // Flag indicating stream has ended
  this.ending = false       // Set when end() invokes write()
  this.paused = false       // Flag indicating stream is paused
  this.needDrain = false    // Flag indicating stream needs drain
  this.offsetBuffer = -1    // Flag indicating whether the buffer should be kept when write() ends

  // Rules flags
  this.clearProps()

  // Rules properties
  this.currentRule = null   // Name of the current rule  
  this.emptyHandler = []    // Handler to trigger when the buffer becomes empty
  this.rules = []           // Rules to be checked against
  this.handler = null       // Matched token default handler
  this.saved = {}           // Saved rules
  this.savedProps = {}      // Saved rules properties
}
inherits(Atok, EV, Stream.prototype)

Atok.prototype._error = function (err) {
  this.emit_error(err)
  return this
}

//include("methods_*.js")
