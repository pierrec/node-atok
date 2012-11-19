/*
 * class Rule
 *
 * Rule for stream based tokenizer
 *
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
**/
var SubRule = require('./subrule')

module.exports = Rule

/**
 * Atok Rule constructor
 *
 * @param {array} list of subrules
 * @param {string|number|null} rule type (set if handler is not)
 * @param {function} rule handler (set if type is not)
 * @param {Object} atok instance
 * @constructor
 * @api private
 */
function Rule (subrules, type, handler, props, groupProps, encoding) {
  var self = this
  var n = subrules.length

  this.props = props

  this.debug = false

  // Used for cloning
  this.subrules = subrules

  // Required by Atok#_resolveRules
  for (var p in groupProps)
    this[p] = groupProps[p]

  // Runtime values for continue props
  this.continue = this.props.continue[0]
  this.continueOnFail = this.props.continue[1]

  this.type = type
  this.handler = handler

  // For debug
  this.prevHandler = null
  this.id = this.type !== null ? this.type : handler
  // Id for debug
  this._id = (handler !== null ? (handler.name || '#emit()') : this.type)

  // Subrule pattern index that matched (-1 if only 1 pattern)
  this.idx = -1

  // Single subrule: special case for trimRight
  this.single = (n === 1)

  // First subrule
  var subrule = this.first = n > 0
    ? SubRule.firstSubRule( subrules[0], this.props, encoding, this.single )
    // Special case: no rule given -> passthrough
    : SubRule.emptySubRule

  // Special case: one empty rule -> tokenize whole buffer
  if (n === 1 && subrule.length === 0) {
    subrule = this.first = SubRule.allSubRule
    // Make infinite loop detection ignore this
    this.length = -1
  } else {
    // First subrule pattern length (max of all patterns if many)
    // - used in infinite loop detection
    this.length = this.first.length
  }

  // Instantiate and link the subrules
  // { test: {Function}
  // , next: {SubRule|undefined}
  // }
  var prev = subrule
  // Many subrules or none
  for (var i = 1; i < n; i++) {
    subrule = SubRule.SubRule( subrules[i], this.props, encoding )
    prev.next = subrule
    subrule.prev = prev // Useful in some edge cases
    prev = subrule
    if (this.length < subrule.length) this.length = subrule.length
  }

  // Last subrule (used for trimRight and matched idx)
  this.last = subrule

  // Set the first and last subrules length based on trim properties
  if (!this.props.trimLeft) this.first.length = 0
  if (!this.single && !this.props.trimRight) this.last.length = 0

  this.next = null
  this.nextFail = null
  this.currentRule = null
}

/**
  Test the rule against data

  @param {Buffer|String} input data
  @param {Number} offset in the input data
  @return {Number} number of bytes/characters matched (success if >=0)
 */
Rule.prototype.test = function (buf, offset) {
  return this.first.test(buf, offset) - offset
}

/**
 * Set debug mode on/off
 *
 * @api private
 */
function wrapDebug (rule, id, atok) {
  rule._test = rule.test
  return function (buf, offset) {
    atok.emit_debug( 'SubRule', id, arguments )
    return rule._test(buf, offset)
  }
}
Rule.prototype.setDebug = function (debug, atok) {
  var self = this

  // Rule already in debug mode
  if (this.debug === debug) return

  var subrule = this.first

  this.debug = true

  if (debug) {
    // Wrap subrules
    var id = this._id + ( this.currentRule ? '@' + this.currentRule : '' )

    while (subrule && subrule.next) {
      subrule.test = wrapDebug(subrule, id, atok)
      subrule = subrule.next
    }

    // Save the previous handler
    var handler = this.handler

    this.prevHandler = handler    
    this.handler = handler
      ? function () {
          atok.emit_debug( 'Handler', id, arguments )
          handler.apply(null, arguments)
        }
      : function () {
          atok.emit_debug( 'Handler', id, arguments )
          atok.emit_data.apply(atok, arguments)
        }

  } else {
    // Unwrap subrules
    while (subrule && subrule.next) {
      delete subrule.test
      subrule._test = null
      subrule = subrule.next
    }

    // Restore previous handler
    this.handler = this.prevHandler
    delete this.prevHandler
  }
}
/**
 * Clone the Rule object
 *
 * @api private
 */
Rule.prototype.clone = function (name) {
  var rule = new Rule(this.subrules, this.type, this.handler, this.props, this)
  rule.currentRule = name
  return rule
}
