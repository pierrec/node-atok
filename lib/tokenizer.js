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
  this.buffer = this._bufferMode ? new Buffer : ''
  this.length = 0
  this.offset = 0
  this.markedOffset = -1    // Flag indicating whether the buffer should be kept when write() ends

  // Private properties
  this._tokenizing = false
  this._ruleIndex = 0
  this._resetRuleIndex = false
  this._stringDecoder = new StringDecoder(this._encoding)
  this._rulesToResolve = false
  this._group = -1
  this._groupStart = 0
  this._groupEnd = 0
  this._groupStartPrev = []


    this.currentRule = null       // Name of the current rule
    this._emptyHandler = []       // Handler to trigger when the buffer becomes empty
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
      return prop.substr(0, 3) === '_p_'
        && !/_p_(continueOnFail|nextIndex)/.test(prop)
    })
    .map(function (prop) {
      return prop.substr(3)
    })

  this.slice = this._bufferMode ? this._sliceBuffer : this._sliceString
}
inherits(Atok, EV, Stream.prototype)

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
  this.buffer = this._bufferMode ? new Buffer : ''
  this.length = 0
  this.offset = 0
  this.markedOffset = -1    // Flag indicating whether the buffer should be kept when write() ends

  // Private properties
  this._tokenizing = false
  this._ruleIndex = 0
  this._resetRuleIndex = false
  this._stringDecoder = new StringDecoder(this._encoding)
  this._rulesToResolve = false
  this._group = -1
  this._groupStart = 0
  this._groupEnd = 0
  this._groupStartPrev = []


  if (!keepRules) {

    this.currentRule = null       // Name of the current rule
    this._emptyHandler = []       // Handler to trigger when the buffer becomes empty
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
Atok.prototype._sliceBuffer = function (start, end) {
  switch (arguments.length) {
    case 0:
      start = this.offset
    case 1:
      end = this.length
  }

  return this.buffer.slice(start, end)
}
Atok.prototype._sliceString = function (start, end) {
  switch (arguments.length) {
    case 0:
      start = this.offset
    case 1:
      end = this.length
  }

  return this.buffer.substr(start, end - start)
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
  switch (enc) {
    case 'UTF-8':
    case 'utf-8':
    case 'utf8':
    default:
      this._encoding = 'UTF-8'
  }
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
  this._rulesForEach(function (rule) {
    rule.setDebug()
  })

  // Apply debug mode to some methods
  var self = this
  ;[ 'loadRuleSet' ].forEach(function (method) {
    if (_debug) {
      var prevMethod = self[method]

      self[method] = function () {
        self.emit_debug( 'Atok#', method, arguments )
        return prevMethod.apply(self, arguments)
      }
      // Save the previous method
      self[method].prevMethod = prevMethod
    } else if (self[method].prevMethod) {
      // Restore the method
      self[method] = self[method].prevMethod
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
// include("methods_ruleprops.js")
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
  this._p_escape = typeof flag === 'string' && flag.length > 0
    ? flag[0]
    : flag === true
      ? '\\'
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
 * Continue the rules flow if rule matches at the specified rule index relative to the current group
 *
 * @param {boolean|number} relative to the current group when rule is successful, number overwrites continue's
 * @param {boolean|number} relative to the current group when rule is failed, number overwrites continue's
 * @return {Atok}
 * @api public
 */
Atok.prototype.continueGroup = function (flag, flagOnFail) {
  if (arguments.length === 0) {
    this._p_continueGroup = false
    this._p_continueOnFailGroup = false
    this._groupContinueStartPrev = 0

    return this
  }

  // Error if not in a group
  if ( this._group < 0 )
    this._error( new Error('Atok#continueGroup: not in a group') )

  // Check the arguments
  if ( !/(number|boolean)/.test(typeof flag) )
    this._error( new Error('Atok#continueGroup: Invalid flag (must be boolean/number): ' + flag) )
  
  if (arguments.length === 1)
    flagOnFail = false
  else if ( !/(number|boolean)/.test(typeof flagOnFail) )
    this._error( new Error('Atok#continueGroup: Invalid flag (must be a boolean/number): ' + flagOnFail) )
  
  // Valid arguments, set the continue() values accordingly
  if (typeof flag === 'boolean') {
    if (!this._p_continueGroup && flag)
      this._groupContinueStartPrev = this._groupStart

    this._p_continueGroup = flag
  } else {
    this._p_continueGroup = false
    this._p_continue = flag
  }

  if (typeof flagOnFail === 'boolean') {
    if (!this._p_continueOnFailGroup && flagOnFail)
      this._groupContinueStartPrev = this._groupStart

    this._p_continueOnFailGroup = flagOnFail
  } else {
    this._p_continueOnFailGroup = false
    this._p_continueOnFail = flagOnFail
  }

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
        // Special case: continueGroup has 2 properties
        case 'continueGroup':
          this._p_continueGroup = props[ prop ][0]
          this._p_continueOnFailGroup = props[ prop ][1]
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
  var props = {}
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
        // Special case: continueGroup has 2 properties
        case 'continueGroup':
          props[ prop ] = [ this._p_continueGroup, this._p_continueOnFailGroup ]
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

  if (args.length < 1)
    return this._error( new Error('Atok#addRule: Missing arguments (/*rule1, rule2 ...*/ type|handler)') )
  
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

  this._checkResolveRules()

  if ( first === 0 )
    this._error( new Error('Atok#addRule: invalid first subrule, must be > 0') )
  else
    this._rules.push(
      RuleString(
        args
      , type
      , handler
      , this
      )
    )

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
    if (idx >= 0)
      this._rules.splice(idx, 1)
  }
  this._checkResolveRules()

  return this
}
/**
 * Resolve rules righ away or delay it
 *
 * @api private
 */
Atok.prototype._checkResolveRules = function () {
  // Rules have been modified, force a resolve when required
  if (this._tokenizing)
    this._resolveRules()
  else
    this._rulesToResolve = true
}
/**
 * Remove all rules
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.clearRule = function () {
  this.clearProps()
  this._rules = []
  this._defaultHandler = null
  this.currentRule = null
  this._rulesToResolve = false

  return this
}
/**
 * Save all rules
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
  , emptyHandler: this._emptyHandler
  }
  this.currentRule = name

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

  this.currentRule = name
  this._rules = ruleSet.rules
  this._emptyHandler = ruleSet.emptyHandler
  this._rulesToResolve = false
  // Set the rule index
  this._ruleIndex = typeof index === 'number' ? index : 0
  this._resetRuleIndex = true

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
  // Make sure no reference to the rule set exists
  if (this.currentRule === name) this.currentRule = null

  return this
}
/**
 * Resolve a rule or all of them if none specified:
 * - translate non number continue() to numbers
 * - check continue() stay within bounds
 * - adjust the continue() jumps based on groups
 *
 * Also detects infinite loops
 *
 * @param {string} name of the rule set (optional)
 * @api private
 */
Atok.prototype._resolveRules = function (name) {
  var self = this
  // Check and set the continue values
  var rules = name ? this._savedRules[name].rules : this._rules
  var groupStartPrev = this._groupStartPrev

  // Perform various checks on a continue type property
  function resolveId (prop) {
    if (rule[prop] === null || typeof rule[prop] === 'number') return

    // Resolve the property to an index
    var j = self._getRuleIndex(rule.id)
    if (j < 0)
      self._error( new Error('Atok#_resolveRules: ' + prop + '() value not found: ' + rule.id) )
      
    rule[prop] = i - j
  }

  // prop: continue type property
  function checkContinue (prop) {
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

        if (j < 0 || j > n)
          self._error( new Error('Atok#_resolveRules: ' + prop + '() value out of bounds: ' + cont + ' index ' + i) )

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
    var cont = rule.backup[prop]

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
      self._error( new Error('Atok#_resolveRules: ' + prop + '() value out of bounds: ' + cont + ' index ' + i) )

    // Save the next rule index
    rule[prop] = cont
  }

  // Process all rules
  // Adjust continue jumps according to groups
  for (var i = 0, n = rules.length; i < n; i++) {
    var rule = rules[i]
    // Check each rule continue property
    checkContinue('continue')
    checkContinue('continueOnFail')

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

    // An infinite loop is created when a 0 length rule points
    // to another 0 length one
    if (rule.length === 0) {
      var nextRule = rule.continue === null
        ? rules[0]
        : rules[ i + 1 + rule.continue ]

      if (nextRule && nextRule.length === 0)
        this._error( new Error('Atok#_resolveRules: infinite loop at index ' + i + (name ? ' in ' + name : '')) )
    }
  }

  // Resolution successfully completed
  this._rulesToResolve = false
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

  // Buffer the incoming data...
  if (this._bufferMode) {
    this.buffer.push( data )
    this.length += data.length
  } else {
    this.buffer += this._stringDecoder.write(data)
    this.length = this.buffer.length
  }
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
  this.emit_end( this.slice(), -1, this.currentRule)
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
  var i = this._ruleIndex, p, matched

  this._ruleIndex = 0
  this._resetRuleIndex = false

  for (
    ; this.offset < this.length && i < this._rules.length
    ; i++
    )
  {
    p = this._rules[i]

    // Return the size of the matched data (0 is valid!)
    matched = p.test(this.buffer, this.offset)

    if ( matched >= 0 ) {
      this.offset += matched
      // Is the token to be processed?
      if ( !p.ignore ) {
        // Emit the data by default, unless the handler is set
        if (p.handler) p.handler(p.token, p.idx, p.type)
        else this.emit_data(p.token, p.idx, p.type)
      }
      // Load a new set of rules
      if (p.next) this.loadRuleSet(p.next, p.nextIndex)

      // Rule set may have changed...from loadRuleSet() or handler()
      if (this._resetRuleIndex) {
        this._resetRuleIndex = false
        i = this._ruleIndex - 1
      } else if (matched > 0)
        i += p.continue

      // NB. `break()` prevails over `pause()`
      if (p.break) {
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
  this._ruleIndex = i

  // End of buffer reached
  if (false&&this.offset === this.length) {
    var emptyHandler = this._emptyHandler, n = emptyHandler.length

    for (i = 0, n = emptyHandler.length; i < n; i++) {
      p = emptyHandler[i]

      if ( !p.ignore ) {
        if (p.handler) p.handler(this.ending)
        else this.emit_data(p.token, p.idx, p.type)
      }

      if (p.next) this.loadRuleSet(p.next, p.nextIndex)

      if (this._resetRuleIndex)
        this._resetRuleIndex = false
      else 
        this._ruleIndex = p.continue === null
          ? 0
          : p.ruleIndex + p.continue

      // NB. subsequent empty handlers will not be called
      if (this.paused) {
        this._ruleIndex = p.continue === null
          ? 0
          : p.ruleIndex + p.continue
        this.needDrain = true
        this._tokenizing = false
        return false
      }
    }
  }

  // Truncate the buffer if possible: min(offset, markedOffset)
  if (this.markedOffset < 0) {
    // No marked offset or beyond the current offset
    if (this.offset === this.length) {
      this.offset = 0
      this.buffer = this._bufferMode ? new Buffer : ''
      this.emit_empty(this.ending)

    } else if (this.offset < this.length) {
      this.buffer = this.slice(this.offset)
      this.offset = 0

    } else {
      // Can only occurs if offset was manually incremented
      this.offset = this.offset - this.length
      this.buffer = this._bufferMode ? new Buffer : ''
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
      this.buffer = this._bufferMode ? new Buffer : ''
      this.emit_empty(this.ending)

    } else if (this[minOffset] < this.length) {
      this[maxOffset] -= this[minOffset]
      this.buffer = this.slice(this[minOffset])
      this[minOffset] = 0

    } else {
      // Can only occurs if offset was manually incremented
      this[maxOffset] -= this.length
      this[minOffset] -= this.length
      this.buffer = this._bufferMode ? new Buffer : ''
    }
  }
  this.length = this.buffer.length

  this._tokenizing = false
  
  return this._done()
}
