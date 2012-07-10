/**
 * Atok - stream based tokenizer
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
 */

var assert = require('assert')
  , Stream = require('stream')
  , StringDecoder = require('string_decoder').StringDecoder
  , EV = require('ev')
  , sliceArguments = require('fnutils').slice

var inherits = require('inherits')
  // , Buffers = require('buffers')

var RuleString = require('./string/rule')
// var RuleBuffer = require('./buffer/ruleBuffer')

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
  this._encoding = options.encoding
  // Apply the default encoding value
  this.setEncoding(options.encoding)

  // Initializations
  // Debug flag
  this.debugMode = false

  // Status flags
  this.ended = false        // Flag indicating stream has ended
  this.ending = false       // Set when end() invokes write()
  this.paused = false       // Flag indicating stream is paused
  this.needDrain = false    // Flag indicating stream needs drain

//var keepRules = false
//include("Atok_properties.js")

//include("Atok_rule_properties.js")


  this._defaultProps = Object.keys(this)
    .filter(function (prop) {
      return prop.substr(0, 3) === '_p_'
        && !/_p_(continueOnFail|nextIndex)/.test(prop)
    })
    .map(function (prop) {
      return prop.substr(3)
    })
}
inherits(Atok, EV, Stream.prototype)

Atok.prototype._error = function (err) {
  this.readable = false
  this.writable = false

  this.emit_error(err)

  return this
}

//include("methods_*.js")
