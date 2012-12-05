/**
 * Atok - stream based tokenizer
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
 */

var assert = require('assert')
  , Stream = require('stream')
  , EV = require('ev')
  , sliceArguments = require('fnutils').slice
  , StringDecoder = require('string_decoder').StringDecoder


// Augment the Buffer object with new useful methods
var buffertools = require('buffertools')

var inherits = require('inherits')

var Rule = require('./rule')

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
  this._encoding = null
  if (options.encoding) this.setEncoding( options.encoding )

  // Initializations
  // Debug flag
  this.debugMode = false

  // Status flags
  this.ended = false        // Flag indicating stream has ended
  this.ending = false       // Set when end() invokes write()
  this.paused = false       // Flag indicating stream is paused
  this.needDrain = false    // Flag indicating stream needs drain

// include("Atok_properties.js")
  // Public properties
  this.buffer = null
  this.length = 0
  this.offset = 0
  this.markedOffset = -1    // Flag indicating whether the buffer should be kept when write() ends

  // Private properties
  this._firstRule = null        // Initial rule to be triggered
  this._resetRule = false       // Rule set was changed
  this._stringDecoder = this._encoding ? new StringDecoder(this._encoding) : null
  this._rulesToResolve = false  // Rules need to be resolved (continue() prop)
  this._rulesToLink = false     // Rules need to be relinked (after a rule set change)
  this._group = -1
  this._groupStart = 0
  this._groupEnd = 0
  this._groupStartPrev = []


    this._rules = []              // Rules to be checked against
    this._defaultHandler = null   // Matched token default handler
    this._savedRules = {}         // Saved rules

// include("Atok_rule_properties.js")
  this._p_ignore = false        // Get the token size and skip
  this._p_quiet = false         // Get the token size and call the handler with no data
  this._p_escape = false        // Pattern must not be escaped
  this._p_trimLeft = true       // Remove the left pattern from the token
  this._p_trimRight = true      // Remove the right pattern from the token
  this._p_next = null           // Next rule to load
  this._p_nextIndex = 0         // Index for the next rule to load
  this._p_continue = null       // Next rule index to load
  this._p_continueOnFail = null // Next rule index to load when rule fails
  this._p_break = false         // Abort current rule set

  this._defaultProps = Object.keys(this)
    .filter(function (prop) {
      return /^_p_/.test(prop) && !/(continueOnFail|nextIndex)$/.test(prop)
    })
    .map(function (prop) {
      return prop.substr(3)
    })
}
inherits(Atok, EV, Stream.prototype)

// Atok.prototype.__defineGetter__('currentRule', function () {
//   return this._firstRule ? this._firstRule.currentRule : null
// })

Atok.prototype._error = function (err) {
  this.readable = false
  this.writable = false

  this.emit_error(err)

  return this
}

// include("methods_misc.js")
/**
 * Reset the tokenizer by clearing its buffer and rules
 *
 * @param {boolean} keep rules set (default=false)
 * @return {Atok}
 * @api public
 */
Atok.prototype.clear = function (keepRules) {
// include("Atok_properties.js")
  // Public properties
  this.buffer = null
  this.length = 0
  this.offset = 0
  this.markedOffset = -1    // Flag indicating whether the buffer should be kept when write() ends

  // Private properties
  this._firstRule = null        // Initial rule to be triggered
  this._resetRule = false       // Rule set was changed
  this._stringDecoder = this._encoding ? new StringDecoder(this._encoding) : null
  this._rulesToResolve = false  // Rules need to be resolved (continue() prop)
  this._rulesToLink = false     // Rules need to be relinked (after a rule set change)
  this._group = -1
  this._groupStart = 0
  this._groupEnd = 0
  this._groupStartPrev = []


  if (!keepRules) {

    this._rules = []              // Rules to be checked against
    this._defaultHandler = null   // Matched token default handler
    this._savedRules = {}         // Saved rules

  }

  this.clearProps()

  return this
}
/**
 * Extract data from the buffer (Atok#slice)
 *
 * @param {number} starting index
 * @param {number} ending index
 * @return {Object} extracted data
 * @api public
 */
Atok.prototype.slice = function (start, end) {
  return this.buffer.slice(start, end)
}
/**
 * Terminate the current tokenizing and return the current buffer
 *
 * @return {Object} left over data
 * @api public
 */
Atok.prototype.flush = function () {
  var data = this.slice()
  
  this.clear(true) // Keep rules!

  return data
}
/**
 * Set the string encoding
 *
 * @param {string} encoding to be used
 * @return {Atok}
 * @api public
 */
Atok.prototype.setEncoding = function (enc) {
  switch ( String(enc) ) {
    case 'null':
    case 'undefined':
      this._encoding = null
    break
    case 'UTF-8':
    case 'utf-8':
    case 'utf8':
    default:
      this._encoding = 'UTF-8'
  }
  this._stringDecoder = this._encoding
    ? new StringDecoder(this._encoding)
    : null

  return this
}
/**
 * Turn debug mode on or off. Emits the [debug] event.
 * The #loadRuleSet method is also put in debug mode.
 * All handlers log their arguments.
 *
 * @param {boolean} toggle debug mode on and off
 * @return {Atok}
 * @api public
 */
Atok.prototype.debug = function (flag) {
  var _debug = !!flag

  // Nothing to do if already in same mode
  if (_debug === this.debugMode) return this
  this.debugMode = _debug

  // Apply debug mode to all defined rules...
  var self = this
  this._rulesForEach(function (rule) {
    rule.setDebug(_debug, self)
  })

  // Apply debug mode to some methods
  ;[ 'loadRuleSet' ].forEach(function (method) {
    if (_debug) {
      var prevMethod = self[method]

      self[method] = function () {
        self.emit_debug( 'Atok#', method, arguments )
        return prevMethod.apply(self, arguments)
      }
    } else {
      // Restore the prototype method
      delete self[method]
    }
  })

  return this
}
/**
 * Apply an iterator to all current rules
 *
 * @param {function()} iterator
 * @api private
 */
Atok.prototype._rulesForEach = function (fn) {
  this._rules.forEach(fn)

  var saved = this._savedRules
  Object.keys(saved).forEach(function (ruleSet) {
    saved[ruleSet].rules.forEach(fn)
  })
}
/**
 * Get the current rule set name
 *
 * @return {String} rule set name
 * @api public
 */
Atok.prototype.currentRule = function () {
  return this._firstRule ? this._firstRule.currentRule : null
}// include("methods_ruleprops.js")
/**
 * Set the default handler.
 * Triggered on all subsequently defined rules if the handler is not supplied
 *
 * @param {function(string, number, string|null)} rules handler (it is better to name it for debugging)
 *   handler is called with (token, index, type)
 * @return {Atok}
 * @api public
 */
Atok.prototype.setDefaultHandler = function (handler) {
  this._defaultHandler = typeof handler === 'function' ? handler : null
  return this
}
/**
 * Skip matched data silently for all subsequent rules
 *
 * @param {string} name of the rule set to load if rule successful
 * @param {number} index to start at
 * @return {Atok}
 * @api public
 */
Atok.prototype.next = function (ruleSet, index) {
  this._p_next = typeof ruleSet === 'string' ? ruleSet : null
  this._p_nextIndex = typeof index === 'number' ? index : 0
  return this
}
/**
 * Skip matched data silently for all subsequent rules
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.ignore = function (flag) {
  this._p_ignore = (flag === true)
  return this
}
/**
 * Do not supply matched data to the handler for all subsequent rules.
 * This is used when the token data does not matter but a handler 
 * still needs to be called. Faster than standard handler call.
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.quiet = function (flag) {
  this._p_quiet = (flag === true)
  return this
}
/**
 * Remove the left matched pattern for all subsequent rules
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.trimLeft = function (flag) {
  this._p_trimLeft = (flag === true)
  return this
}
/**
 * Remove the right matched pattern for all subsequent rules
 * If only 1 pattern, it is ignored
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.trimRight = function (flag) {
  this._p_trimRight = (flag === true)
  return this
}
/**
 * Remove the left and right matched patterns for all subsequent rules
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.trim = function (flag) {
  return this.trimLeft(flag).trimRight(flag)
}
/**
 * Do not remove the left and right matched patterns for all subsequent rules
 * The default escape character is \, can be changed by specifying it instead of a Boolean
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.escape = function (flag) {
  this._p_escape = flag === true
    ? '\\'
    : flag && flag.length > 0
      ? flag.toString(this._encoding || 'utf8').charAt(0)
      : false
  return this
}
/**
 * Continue the rules flow if rule matches at the specified rule index
 *
 * @param {number|null|undefined} number of rules to skip before continuing
 * @param {number|null|undefined} when the rule fails, number of rules to skip before continuing
 * @return {Atok}
 * @api public
 */
Atok.prototype.continue = function (jump, jumpOnFail) {
  if (arguments.length === 0) {
    this._p_continue = null
    this._p_continueOnFail = null

    return this
  }

  if ( jump !== null && !/(number|string|function)/.test(typeof jump) )
    this._error( new Error('Atok#continue: Invalid jump (must be an integer/function/string): ' + jump) )
  
  if (arguments.length === 1)
    jumpOnFail = null
  else if ( jumpOnFail !== null && !/(number|string|function)/.test(typeof jumpOnFail) )
    this._error( new Error('Atok#continue: Invalid jump (must be an integer/function/string): ' + jumpOnFail) )
  
  this._p_continue = jump
  this._p_continueOnFail = jumpOnFail

  return this
}
/**
 * Abort a current rule set. Use continue(-1) to resume at the current subrule.
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.break = function (flag) {
  this._p_break = (flag === true)
  return this
}
/**
 * Restore properties
 *
 * @param {Object} properties to be loaded
 * @return {Atok}
 * @api public
 */
Atok.prototype.setProps = function (props) {
  var propNames = Object.keys(props || {})

  for (var prop, i = 0, n = propNames.length; i < n; i++) {
    prop = propNames[i]
    if ( this.hasOwnProperty('_p_' + prop) )
      switch (prop) {
        // Special case: continue has 2 properties
        case 'continue':
          this._p_continue = props[ prop ][0]
          this._p_continueOnFail = props[ prop ][1]
        break
        // Special case: next has 2 properties
        case 'next':
          this._p_next = props[ prop ][0]
          this._p_nextIndex = props[ prop ][1]
        break
        default:
          this[ '_p_' + prop ] = props[ prop ]
      }
  }

  return this
}
/**
 * Reset properties to their default values
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.clearProps = function () {
// include("Atok_rule_properties.js")
  this._p_ignore = false        // Get the token size and skip
  this._p_quiet = false         // Get the token size and call the handler with no data
  this._p_escape = false        // Pattern must not be escaped
  this._p_trimLeft = true       // Remove the left pattern from the token
  this._p_trimRight = true      // Remove the right pattern from the token
  this._p_next = null           // Next rule to load
  this._p_nextIndex = 0         // Index for the next rule to load
  this._p_continue = null       // Next rule index to load
  this._p_continueOnFail = null // Next rule index to load when rule fails
  this._p_break = false         // Abort current rule set
  return this
}
/**
 * Reset properties to their default values
 *
 * @return {Object}
 * @api public
 */
Atok.prototype.getProps = function () {
  // Empty object with no prototype
  var props = Object.create(null)
  var propNames = arguments.length > 0
        ? sliceArguments(arguments, 0)
        : this._defaultProps

  for (var prop, i = 0, num = propNames.length; i < num; i++) {
    prop = propNames[i]
    if ( this.hasOwnProperty('_p_' + prop) )
      switch (prop) {
        // Special case: continue has 2 properties
        case 'continue':
          props[ prop ] = [ this._p_continue, this._p_continueOnFail ]
        break
        // Special case: next has 2 properties
        case 'next':
          props[ prop ] = [ this._p_next, this._p_nextIndex ]
        break
        default:
          props[ prop ] = this[ '_p_' + prop ]
      }
  }

  return props
}
// include("methods_ruleset.js")
/**
 * Add a rule as the first one
 *
 * @param {string|number|function()} name of the rule to be added first
 * @param {...string|number|function()} rule item
 * @param {string|number|function()} rule type
 * @return {Atok}
 * @api public
 * @see Atok#addRule
 */
Atok.prototype.addRuleFirst = function (rule, /*rule, ... */ type) {
  this.addRule.apply( this, sliceArguments(arguments, 0) )
  this._rules.unshift( this._rules.pop() )

  return this
}
/**
 * Get the index of a rule by id
 *
 * @param {string|number|function()} rule type
 * @return {number}
 * @api private
 */
Atok.prototype._getRuleIndex = function (id) {
  for (var rules = this._rules, i = 0, n = rules.length; i < n; i++)
    if (rules[i].id === id) return i
  
  return -1
}
/**
 * Add a rule before an existing one
 *
 * @param {string|number|function()} name of the rule to add before
 * @param {...string|number|function()} rule item
 * @param {string|number|function()} rule type
 * @return {Atok}
 * @api public
 * @see Atok#addRule
 */
Atok.prototype.addRuleBefore = function (existingRule, rule, /*rule, ... */ type) {
  var i = this._getRuleIndex(existingRule)

  if ( i < 0 )
    return this._error( new Error('Atok#addRuleBefore: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, sliceArguments(arguments, 1) )
  this._rules.splice( i, 0, this._rules.pop() )

  return this
}
/**
 * Add a rule after an existing one
 *
 * @param {string|number|function()} name of the rule to add after
 * @param {...string|number|function()} rule item
 * @param {string|number|function()} rule type
 * @return {Atok}
 * @api public
 * @see Atok#addRule
 */
Atok.prototype.addRuleAfter = function (existingRule, rule, /*rule, ... */ type) {
  var i = this._getRuleIndex(existingRule)

  if ( i < 0 )
    return this._error( new Error('Atok#addRuleAfter: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, sliceArguments(arguments, 1) )
  this._rules.splice( i + 1, 0, this._rules.pop() )

  return this
}
/**
 * Add a rule
 *
 * @param {...string|number|function()} match at current buffer position (String: expect string, Integer: expect n characters, Array: expect one of the items). If not needed, use ''
 * @param {false|string|number|function()} rule name/id (if no default handler set, emit a data event) or handler (executed when all matches are valid). If false, the rule is ignored.
 * @return {Atok}
 * @api public
 */
Atok.prototype.addRule = function (/*rule1, rule2, ... type|handler*/) {
  var args = sliceArguments(arguments, 0)

  if (args.length < 1) {
    this._error( new Error('Atok#addRule: Missing arguments (/*rule1, rule2 ...*/ type|handler)') )
    return this
  }

  var last = args.pop()

  // Ignore the rule if the handler/type is false
  if (last === false) return this

  var first = args[0]
  var type = null
    , handler = this._defaultHandler

  switch ( typeof(last) ) {
    case 'function':
      handler = last
      break
    case 'number':
    case 'string':
      type = last
      break
    default:
      this._error( new Error('Atok#addRule: invalid type/handler, must be Number/String/Function') )
      return this
  }

  if ( first === 0 )
    this._error( new Error('Atok#addRule: invalid first subrule, must be > 0') )
  else {
    var groupProps = Object.create(null)
    groupProps.group = this._group
    groupProps.groupStart = this._groupStart
    groupProps.groupEnd = this._groupEnd
    this._rules.push(
      new Rule(
        args
      , type
      , handler
      , this.getProps()
      , groupProps
      , this._encoding
      )
    )
  }

  this._rulesToResolve = true

  return this
}
/**
 * Remove a rule (first instance only)
 *
 * @param {string} name of the rule to be removed
 * @return {Atok}
 * @api public
 */
Atok.prototype.removeRule = function (/* name ... */) {
  if (arguments.length === 0) return this
  
  for (var idx, i = 0, n = arguments.length; i < n; i++) {
    idx = this._getRuleIndex(arguments[i])
    if (idx >= 0) {
      this._rules.splice(idx, 1)
    }
  }
  this._rulesToResolve = true

  return this
}
/**
 * Remove all rules
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.clearRule = function () {
  this.clearProps()
  this._firstRule = null
  this._rules = []
  this._defaultHandler = null
  this._rulesToResolve = false

  return this
}
/**
 * Save all rules and clear them
 *
 * @param {string} name of the rule set
 * @return {Atok}
 * @api public
 */
Atok.prototype.saveRuleSet = function (name) {
  if (arguments.length === 0 || name === null)
    return this._error( new Error('Atok#saveRuleSet: invalid rule name supplied') )

  this._savedRules[name] = {
    rules: this._rules
      .map(function (rule) {    // Clone and assign the current rule set name
        return rule.clone(name)
      })
  }

  // Resolve and check continues
  this._resolveRules(name)

  return this
}
/**
 * Load a rule set
 *
 * @param {string} name of the rule set
 * @param {number} index to start at
 * @return {Atok}
 * @api public
 */
Atok.prototype.loadRuleSet = function (name, index) {
  var ruleSet = this._savedRules[name]
  if (!ruleSet)
    return this._error( new Error('Atok#loadRuleSet: Rule set ' + name + ' not found') )

  index = typeof index === 'number' ? index : 0

  this._rules = ruleSet.rules
  // Set the rule index
  this._firstRule = this._rules[index]
  this._resetRule = true

  return this
}
/**
 * Delete a rule set
 *
 * @param {string} name of the rule set
 * @return {Atok}
 * @api public
 */
Atok.prototype.removeRuleSet = function (name) {
  delete this._savedRules[name]

  return this
}
/**
 * Resolve a rule or all of them if none specified:
 * - translate non number continue() to numbers
 * - check continue() stay within bounds
 * - adjust the continue() jumps based on groups
 *
 * Also detects infinite loops
 * Rules are linked if no name supplied
 *
 * @param {string} name of the rule set (optional)
 * @api private
 */
Atok.prototype._resolveRules = function (name) {
  var self = this
  // Check and set the continue values
  var rules = name ? this._savedRules[name].rules : this._rules

  function getErrorData (i) {
    return ( self.currentRule() ? '@' + self.currentRule() : ' ' )
      + (arguments.length > 0
          ? '[' + i + ']'
          : ''
        )
  }

  // Perform various checks on a continue type property
  function resolveId (prop) {
    if (rule[prop] === null || typeof rule[prop] === 'number') return

    // Resolve the property to an index
    var j = self._getRuleIndex(rule.id)
    if (j < 0)
      self._error( new Error('Atok#_resolveRules: ' + prop + '() value not found: ' + rule.id) )
      
    rule[prop] = i - j
  }

  // prop: continue type
  // idx: continue type index
  function checkContinue (prop, idx) {
    if (typeof rule[prop] !== 'number') return

    // incr: 1 or -1 (positive/negative continue)
    // offset: 0 or 1 (positive/negative continue)
    function setContinue (incr, offset) {
      // j = current index to be checked
      // count = number of indexes to check
      for (
        var j = i + incr, count = 0, m = Math.abs(cont + offset)
      ; count < m
      ; j += incr, count++
      ) {
        // Scan all rules from the current one to the target one
        var _rule = rules[j]

        // Jumping to the last rule is valid
        if (j === n && count === m - 1) return

        if (j < 0 || j >= n)
          self._error( new Error('Atok#_resolveRules: ' + prop + '() value out of bounds: ' + cont + getErrorData(i)) )

        // Only process rules bound to a group below the current one
        // Or at the same level but different
        if (_rule.group > rule.group
        || (_rule.group === rule.group && _rule.groupStart !== rule.groupStart)
        ) {
          // Get to the right group
          while (_rule.group > rule.group + 1) {
            j = incr > 0 ? _rule.groupEnd + 1 : _rule.groupStart - 1
            // Jump to the end of the rules is ignored
            if (j > n) {
              cont = null
              return
            }

            _rule = rules[j]
          }
          j = incr > 0 ? _rule.groupEnd : _rule.groupStart
          cont += incr * (_rule.groupEnd - _rule.groupStart)
        }
      }
    }

    // Use the backup value
    var cont = rule.props.continue[idx]

    // continue(0) and continue(-1) do not need any update
    if (cont > 0)
      // Positive jump
      setContinue(1, 0)
    else if (cont < -1)
      // Negative jump
      setContinue(-1, 1)
    
    // Check the continue boundaries
    var j = i + cont + 1
    // Cannot jump to a rule before the first one or beyond the last one.
    // NB. jumping to a rule right after the last one is accepted since
    // it will simply stop the parsing
    if (j < 0 || j > n)
      self._error( new Error('Atok#_resolveRules: ' + prop + '() value out of bounds: ' + cont + getErrorData(i)) )

    // Save the next rule index
    rule[prop] = cont
  }

  // Process all rules
  // Adjust continue jumps according to groups
  for (var i = 0, n = rules.length; i < n; i++) {
    var rule = rules[i]
    // Check each rule continue property
    checkContinue('continue', 0)
    checkContinue('continueOnFail', 1)

    // Set values for null
    if (rule.continue === null)
      // Go to the start of the rule set
      rule.continue = -(i + 1)

    if (rule.continueOnFail === null)
      // Go to the next rule
      rule.continueOnFail = 0

    // Check the continue property
    resolveId('continue')

    // Check the continueOnFail property
    resolveId('continueOnFail')

    // Check the group is terminated
    if (rule.group >= 0 && rule.groupEnd === 0)
      this._error( new Error('Atok#_resolveRules: non terminated group starting at index ' + rule.groupStart ) )

  }

  // Infinite loop detection
  // An infinite loop is created when:
  // - a 0 length rule points to another 0 length one
  // - linked continueOnFails create a loop
  for (var i = 0, n = rules.length; i < n; i++) {
    var rule = rules[i]

    // Zero length rules

    if ( rule.length === 0
      && (n === 1
        || (
          // continue may point to the end of the list
              i + 1 + rule.continue < n
          && rules[ i + 1 + rule.continue ].length === 0
          // continueOnFail may point to the end of the list
          && i + 1 + rule.continueOnFail < n
          && rules[ i + 1 + rule.continueOnFail ].length === 0
          )
        )
      )
        this._error( new Error('Atok#_resolveRules: zero-length rules infinite loop' + getErrorData(i)) )

    // Looped failures
    var failList = []
    for (var j = i; j > -1 && j < n; j += rules[j].continueOnFail + 1) {
      if ( failList.indexOf(j) >= 0 )
        this._error( new Error('Atok#_resolveRules: infinite loop' + getErrorData(i)) )

      failList.push(j)
    }
  }

  // Resolution successfully completed
  this._rulesToResolve = false

  // Rules need to be relinked:
  // - Delay if rules resolution was called in a saveRuleSet(name)
  // - Link immediately otherwise
  if (name) this._rulesToLink = true
  else this._linkRules()
}
/**
 * Bind rules to the same index
 *
 * @param {Boolean} toggle grouping on/off
 * @return {Atok}
 * @api public
 */
Atok.prototype.groupRule = function (flag) {
  var rules = this._rules

  if (flag) {
    this._group++
    this._groupStartPrev.push(this._groupStart)
    this._groupStart = rules.length

    return this
  }

  // Ignore invalid groupRule()
  if (this._group < 0) return this
  
  // 1 or 0 rule within the group, ignored it
  if (rules.length - this._groupStart < 2) {
    for (var i = this._groupStart, n = rules.length; i < n; i++) {
      rules[i].group = -1
      rules[i].groupStart = 0
      rules[i].groupEnd = 0
    }
  } else {
    // Set the last index of the group to all rules belonging to the current group
    for (var i = this._groupStart, n = rules.length; i < n; i++)
      if (rules[i].group === this._group)
        rules[i].groupEnd = n - 1
  }

  this._group--
  this._groupStart = this._groupStartPrev.pop() || 0
  this._groupEnd = 0

  return this
}
/**
 * Link rules
 *
 * @return {Atok}
 * @api private
 */
Atok.prototype._linkRules = function () {
  var self = this
  var _savedRules = this._savedRules
  var rules = this._rules

  if (this._rules.length === 0)
    this._error( new Error('Atok#_linkRules: no rule defined') )

  link(rules)
  Object.keys(_savedRules)
    .forEach(function (k) {
      link( _savedRules[k].rules )
  })

  // Rules entry point
  this._firstRule = rules[0]

  // Rules are now linked
  this._rulesToLink = false

  function getRuleFromSet (arr) {
    var ruleSet = arr[0]
    var rule = _savedRules[ ruleSet ]
    if (!rule)
        self._error( new Error('Atok#_linkRules: missing rule set: ' + ruleSet ) )

    return _savedRules[ ruleSet ].rules[ arr[1] ]
  }

  function link (rules) {
    // Link rules
    for (var i = 0, n = rules.length; i < n; i++) {
      var rule = rules[i]
      var props = rule.props
      var next = props.next

      // On rule success
      rule.next =  next[0]
        ? getRuleFromSet(next)
        : ( rules[ i + rule.continue + 1 ] || null )

      // On rule failure
      rule.nextFail = rules[ i + rule.continueOnFail + 1 ] || null
    }
  }
}
// include("methods_stream.js")
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

  // Setting the encoding by default when receiving a string
  if ( typeof data === 'string' && !this._encoding ) this.setEncoding('utf-8')

  // Buffer the incoming data...
  if (this.length > 0) {
    // Process strings and Buffers separately
    if ( this._encoding ) {
      this.buffer += this._stringDecoder.write( data.toString() )
    } else {
      this.buffer = this.buffer.concat(data)
      // this.buffer = Buffer.concat( [ this.buffer, data ], this.length )
    }
  } else {
    this.buffer = this._encoding ? data.toString() : data
  }
  this.length = this.buffer.length

  // Check rules resolution (pause __can__ be called before write)
  if (this._rulesToResolve) this._resolveRules() // Does linking too
  // No resolution but linking may be required
  else if (this._rulesToLink) this._linkRules()

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
  // NB. Rules and buffer can be reset by the token handler
  var p, props, matched
  var token

  p = this._firstRule
  this._resetRule = false

  while ( p && this.offset < this.length ) {
    props = p.props

    // Return the size of the matched data (0 is valid!)
    matched = p.test(this.buffer, this.offset)

    if ( matched < 0 ) {
      // End of the rule set, end the loop
      if (!p.nextFail) break

      // Next rule exists, carry on
      p = p.nextFail
      continue
    }

    // Is the token to be processed?
    if ( props.ignore ) {
      p = p.next
    } else {
      // Emit the data by default, unless the handler is set
      token = props.quiet
        ? matched - (p.single ? 0 : p.last.length) - p.first.length
        : this.buffer.slice(
            this.offset + p.first.length
          , this.offset + matched - (p.single ? 0 : p.last.length)
          )

      if (p.handler) p.handler(token, p.last.idx, p.type)
      else this.emit_data(token, p.last.idx, p.type)

      // Handler has changed rules, resolve and relink
      if (this._rulesToResolve) this._resolveRules()

      // RuleSet may have be changed by the handler
      if (this._resetRule) {
        this._resetRule = false
        p = this._firstRule
      } else {
        p = p.next
      }
    }

    this.offset += matched

    // NB. `break()` prevails over `pause()`
    if (props.break) break

    // Hold on if the stream was paused
    if (this.paused) {
      this._firstRule = p
      this.needDrain = true
      return false
    }
  }

  // Keep track of the rule we are at
  if (p) this._firstRule = p

  // Truncate the buffer if possible: min(offset, markedOffset)
  if (this.markedOffset < 0) {
    // No marked offset or beyond the current offset
    if (this.offset === this.length) {
      this.offset = 0
      this.buffer = null
      this.length = 0
      this.emit_empty(this.ending)

    } else if (this.offset < this.length) {
      this.buffer = this.buffer.slice(this.offset)
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
      this.buffer = this.buffer.slice(this[minOffset])
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

  return this._done()
}
