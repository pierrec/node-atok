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
  this.offsetBuffer = -1    // Flag indicating whether the buffer should be kept when write() ends

// include("Atok_properties.js")
  // Public properties
  this.buffer = this._bufferMode ? new Buffer : ''
  this.offset = 0
  this.ruleIndex = 0

  // Private properties
  this._resetRuleIndex = false
  this._stringDecoder = new StringDecoder(this._encoding)
  this._rulesToResolve = false


    this.currentRule = null   // Name of the current rule  
    this._emptyHandler = []    // Handler to trigger when the buffer becomes empty
    this._rules = []           // Rules to be checked against
    this._defaultHandler = null       // Matched token default handler
    this._savedRules = {}           // Saved rules

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
}
inherits(Atok, EV, Stream.prototype)

Atok.prototype._error = function (err) {
  this.emit_error(err)
  return this
}

Atok.prototype.__defineGetter__('length', function () {
  return this.buffer.length
})

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
  this.offset = 0
  this.ruleIndex = 0

  // Private properties
  this._resetRuleIndex = false
  this._stringDecoder = new StringDecoder(this._encoding)
  this._rulesToResolve = false


  if (!keepRules) {

    this.currentRule = null   // Name of the current rule  
    this._emptyHandler = []    // Handler to trigger when the buffer becomes empty
    this._rules = []           // Rules to be checked against
    this._defaultHandler = null       // Matched token default handler
    this._savedRules = {}           // Saved rules

  }

  this.clearProps()

  return this
}
/**
 * Extract data from the buffer
 *
 * @param {number} starting index
 * @param {number} ending index
 * @return {Object} extracted data
 * @api private
 */
Atok.prototype._slice = function (start, end) {
  if (arguments.length === 0) start = this.offset
  if (arguments.length <= 1) end = this.length
  return this._bufferMode
    ? this.buffer.slice(start, end)
    : this.buffer.substr(start, end - start)
}
/**
 * Terminate the current tokenizing and return the current buffer
 *
 * @return {Object} left over data
 * @api public
 */
Atok.prototype.flush = function () {
  var data = this._slice()
  
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
 * @param {number|null|undefined} when the rule fails, number of rules to skip before continuing (must be positive)
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
  else if (
        jumpOnFail !== null
    && (    !/(number|string|function)/.test(typeof jumpOnFail)
        ||  (typeof jumpOnFail === 'number' && jumpOnFail < 0)
       )
    )
      this._error( new Error('Atok#continue: Invalid jump (must be a positive integer/function/string): ' + jumpOnFail) )
  
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
  var props = {}

  // Default properties
  var defaultProps = Object.keys(this)
    .filter(function (prop) {
      return prop.substr(0, 3) === '_p_' && !/_p_(continueOnFail|nextIndex)/.test(prop)
    })
    .map(function (prop) {
      return prop.substr(3)
    })

  var propNames = arguments.length > 0 ? sliceArguments(arguments, 0) : defaultProps

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
    if (rules[i].id === id) break
  
  return i === n ? -1 : i
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
 * @param {string|number|function()} rule name/id (if no default handler set, emit a data event) or handler (executed when all matches are valid)
 * @return {Atok}
 * @api public
 */
Atok.prototype.addRule = function (/*rule1, rule2, ... type|handler*/) {
  var args = sliceArguments(arguments, 0)

  if (args.length < 1)
    return this._error( new Error('Atok#addRule: Missing arguments (/*rule1, rule2 ...*/ type|handler)') )
  
  var last = args.pop()
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
      return this._error( new Error('Atok#addRule: invalid type/handler, must be Number/String/Function') )
  }

  // Check if the rule is to be created
  for (var i = 0, n = args.length; i < n; i++) {
    // Discard true's, abort on false
    if (args[i] === false) return this
    if (args[i] === true) {
      args.splice(i, 1)
      i--
      n--
    }
  }

  this._rulesToResolve = true

  // first === 0: following arguments are ignored
  // Empty buffer rule
  if ( first === 0 )
    this._emptyHandler.push(
      RuleString(
        0
      , type
      , handler
      , this
      )
    )
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
  // Set the rule index
  this.ruleIndex = typeof index === 'number' ? index : 0
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
 *
 * @param {string} name of the rule set (optional)
 * @return {Atok}
 * @api public
 */
Atok.prototype._resolveRules = function (name) {
  // Check and set the continue values
  var rules = name ? this._savedRules[name].rules : this._rules
  var rule, j

  for (var i = 0, n = rules.length; i < n; i++) {
    rule = rules[i]
    if (rule.continue !== null && typeof rule.continue !== 'number') {
      j = this._getRuleIndex(rule.id)
      if (j < 0)
        this._error( new Error('Atok#_resolveRules: continue() value not found: ' + rule.id) )
      
      rule.continue = i - j
    }
    // Check the continue boundaries
    if (rule.continue < -1 || rule.continue > rules.length)
      this._error( new Error('Atok#_resolveRules: continue() value out of bounds: ' + rule.continue) )
  }

  if (!name) this._rulesToResolve = false

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
    ; this.offset < this.length && i < this._rules.length
    ; i++
    )
  {
    p = this._rules[i]
    // Check that there is enough data to check the first rule
    if (p.length > 0 && (this.length - this.offset) < p.length) break

    // Return the size of the matched data (0 is valid!)
    matched = p.test(this.buffer, this.offset)
    if ( matched >= 0 ) {
      this.offset += matched
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
      // Keep track of the rule index we are at
      this.ruleIndex = i + 1
    }
  }

  if (this.offsetBuffer < 0) {
    // Remove tokenized data from the buffer
    if (this.offset === this.length) {
      this.offset = 0
      this.buffer = this._bufferMode ? new Buffer : ''
      this.emit_empty(this.ending)

      var emptyHandler = this._emptyHandler, n = emptyHandler.length
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
      // Can only occurs if offset was manually incremented
      this.offset = this.offset - this.length
      this.buffer = this._bufferMode ? new Buffer : ''
    } else {
      this.buffer = this._slice(this.offset)
      this.offset = 0
    }
  }
  
  return this._done()
}
