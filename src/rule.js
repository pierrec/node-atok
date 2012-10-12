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
 * @param {string|number|null=} rule type (set if handler is not)
 * @param {function} rule handler (set if type is not)
 * @param {Object} atok instance
 * @constructor
 * @api private
 */
function Rule (subrules, type, handler, atok) {
  var self = this

  this.atok = atok
  this.props = atok.getProps()

  // Required by Atok#_resolveRules
  this.groupStart = atok._groupStart

  this.type = type
  this.handler = handler

  // For debug
  this.prevHandler = null
  this.id = this.type !== null ? this.type : handler
  // Id for debug
  this._id = (handler !== null ? (handler.name || '#emit()') : this.type)

  // Subrule pattern index that matched (-1 if only 1 pattern)
  this.idx = -1

  // First subrule
  var subrule = this.first = SubRule.firstSubRule( subrules[0], this.props, atok._encoding )

  // First subrule pattern length (max of all patterns if many)
  // - used in infinite loop detection
  this.length = this.first.length


  // Instantiate and link the subrules
  var prev = subrule
  for (var i = 1, n = subrules.length; i < n; i++) {
    subrule = SubRule.SubRule( subrules[i], this.props, atok._encoding )
    prev.next = subrule
    prev = subrule
  }
  prev.next = SubRule.lastSubRule

  // Last subrule (used for trimRight)
  // Set to the dummy last rule if only one rule
  this.last = n > 1 ? subrule : prev.next

  // Set the first and last subrules length based on trim properties
  if (!this.props.trimLeft) this.first.length = 0
  if (!this.props.trimRight) this.last.length = 0

  //TODO micro optimizations (empty subrule...)
}
Rule.prototype.test = function (buf, offset) {
  return this.first.test(buf, offset) - offset
}

/**
 * Set debug mode on/off
 *
 * @api private
 */
Rule.prototype.setDebug = function (init) {
  var self = this
  var atok = this.atok
  var debug = atok.debugMode

  if (this.rules.length > 0)
    // Set the #test() method according to the flags
    _MaskSetter.call(
      this
    , 'test'
    , this.genToken
    , this.trimLeft
    , this.trimRight
    , debug
    )

  if (!init) {
    // Wrap/unwrap handlers
    if (debug) {
      var handler = this.handler
      var id = this._id + ( this.atok.currentRule ? '@' + this.atok.currentRule : '' )

      // Save the previous handler
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
      // Restore the handler
      this.handler = this.prevHandler
      this.prevHandler = null
    }

    // Special methods
    ;[ 'noop', 'all', 'allNoToken' ].forEach(function (method) {
      if (debug) {
        var prevMethod = self[method]

        self[method] = function () {
          atok.emit_debug( 'Handler#', method, arguments )
          prevMethod.apply(atok, arguments)
        }
        // Save the previous method
        self[method].prevMethod = prevMethod
      } else {
        // Restore the method
          self[method] = self[method].prevMethod
      }
    })
  }
}