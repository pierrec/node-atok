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
  , Stream = require('stream')
  , EV = require('ev')

var inherits = require('inherits')
  // , Buffers = require('buffers')

var RuleString = require('./string/rule')
// var RuleBuffer = require('./buffer/ruleBuffer')

function sliceArguments (args, index) {
  if (args.length === 0) return []

  for (
    var i = index, n = args.length, a = new Array(n - index)
  ; i < n
  ; i++
  )
    a[i - index] = args[i]
  return a
}

var isArray = require('util').isArray
function noop () {}

module.exports = Tknzr

// Export default events
Tknzr.events = {
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

// Export version
Tknzr.version = require('../package.json').version

/**
 * new Tokenizer(options)
 * - options (Object):
 * - options.bufferMode (Boolean): use Buffers instead of string (false)
 * - options.encoding (String): encoding to be used (utf8)
 *
**/
function error (err) {
  if (err instanceof Error)
    throw err
  else
    throw new Error("Uncaught, unspecified 'error' event.")
}
function Tknzr (options) {
  if (!(this instanceof Tknzr))
    return new Tknzr(options)

  // Possible events are defined at instanciation for better performance
  EV.call(this, Tknzr.events)
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
  this.ended = false      // Flag indicating stream has ended
  this.ending = false     // Set when end() invokes write()
  this.paused = false     // Flag indicating stream is paused
  this.needDrain = false  // Flag indicating stream needs drain

  // Rules flags
  // this._p_ignore = false     // Get the token size and skip
  // this._p_quiet = false      // Get the token size and call the handler with no data
  // this._p_escape = false     // Pattern must not be escaped
  // this._p_trimLeft = true    // Remove the left pattern from the token
  // this._p_trimRight = true   // Remove the right pattern from the token
  // this._p_next = null        // Next rule to load
  // this._p_continue = null    // Next rule index to load
  // this._p_break = false      // Abort current rule set
  this.clearProps()

  // Rules properties
  this.currentRule = null   // Name of the current rule  
  this.emptyHandler = null  // Handler to trigger when the buffer becomes empty
  this.rules = []           // Rules to be checked against
  this.handler = null       // Matched token default handler
  this.saved = {}           // Saved rules
  this.savedProps = {}      // Saved rules properties
}
inherits(Tknzr, EV, Stream.prototype)

Tknzr.prototype._error = function (err) {
  this.emit_error(err)
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
Tknzr.prototype.end = function (data) {
  this.ending = true
  this.write(data)
  this.ended = true
  this.ending = false
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
Tknzr.prototype.destroy = noop
/*
 * Tokenizer private methods
 */
Tknzr.prototype._end = function () {
  var buf = this.buffer
    , mode = this._bufferMode
    , rule = this.currentRule
  
  if (buf.length > 0)
    this.emit_end(mode ? buf.slice() : buf, -1, rule)
  else
    this.emit_end()
  
  this.clear()
}
Tknzr.prototype._done = function () {
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
Tknzr.prototype._tokenize = function () {
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
      }
    }
  }
  if (this.offset > 0) {
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
      this.buffer = this._slice()
      this.length -= this.offset
      this.offset = 0
    }
  }
  
  return this._done()
}
// include("methods_misc.js")
/** chainable
 * Tokenizer#clear(keepRules)
 * - keepRules (Boolean): keep rules set (default=false)
 *
 * Reset the tokenizer by clearing its buffer and rules
**/
Tknzr.prototype.clear = function (keepRules) {
  // Buffered data
  this.buffer = this._bufferMode ? new Buffer : ''
  this.length = 0
  this.lastByte = -1
  this.bytesRead = 0
  this.offset = 0
  this.ruleIndex = 0
  this._resetRuleIndex = false

  // Rule flags
  this.clearProps()

  if (!keepRules) {
    this.currentRule = null   // Name of the current rule  
    this.emptyHandler = noop  // Handler to trigger when the buffer becomes empty
    this.rules = []           // Rules to be checked against
    this.handler = null       // Matched token default handler
    this.saved = {}           // Saved rules
    this.savedProps = {}      // Saved rules properties
  }

  return this
}
Tknzr.prototype._slice = function (start, end) {
  if (arguments.length === 0) start = this.offset
  if (arguments.length <= 1) end = this.length
  return this._bufferMode
    ? this.buffer.slice(start, end)
    : this.buffer.substr(start, end - start)
}
/**
 * Tokenizer#flush()
 *
 * Terminate the current tokenizing and return the current buffer
**/
Tknzr.prototype.flush = function () {
  var data = this._slice()
  
  this.clear(true) // Keep rules!

  return data
}
/** chainable
 * Tokenizer#setEncoding(encoding)
 * - encoding (String): encoding to be used
 *
 * Set the string encoding
**/
Tknzr.prototype.setEncoding = function (enc) {
  switch (enc) {
    case 'UTF-8':
    case 'utf-8':
    case 'utf8':
    default:
      this._encoding = 'UTF-8'
  }
  return this
}
/** chainable
 * Tokenizer#seek(i)
 * - i (Integer): move by this amount (can be negative)
 *
 * Move the cursor on the current buffer by a given amount.
 * Positive buffer overrun supported (will offset on the next data chunk)
**/
Tknzr.prototype.seek = function (i) {
  this.bytesRead += i
  this.offset += i
  if (this.offset < 0)
    return this._error( new Error('Tokenizer#seek: negative offset: ' + this.offset + ' from ' + i) )
  return this
}
/** chainable
 * Tokenizer#debug(flag)
 * - flag (Boolean): toggle debug mode on and off.
 *
 * Turn debug mode on or off. Emits the [debug] event.
 * The #seek and #loadRuleSet methods are also put in debug mode.
**/
Tknzr.prototype.debug = function (flag) {
  var _debug = !!flag

  // Nothing to do if already in same mode
  if (_debug === this.debugMode) return this
  this.debugMode = _debug

  // Apply debug mode to all defined rules...
  this._rulesForEach(function (rule) {
    rule.setDebug()
  })

  // Apply debug mode to the #seek() and #loadRuleSet() methods
  var self = this
  ;[ 'seek', 'loadRuleSet' ].forEach(function (method) {
    if (_debug) {
      var prevMethod = self[method]

      self[method] = function () {
        self.emit_debug.apply( self, ['Tokenizer#' + method].concat( sliceArguments(arguments, 0) ) )
        return prevMethod.apply(self, arguments)
      }
      // Save the previous method
      self[method].prevMethod = prevMethod
    } else {
      self[method] = self[method].prevMethod
    }
  })

  return this
}

Tknzr.prototype._rulesForEach = function (fn) {
  this.rules.forEach(fn)

  var saved = this.saved
  Object.keys(saved).forEach(function (ruleSet) {
    saved[ruleSet].rules.forEach(fn)
  })
}
// include("methods_ruleprops.js")
/** chainable
 * Tokenizer#setDefaultHandler(handler)
 * - handler (Function): named rules handler
 *
 * Set the default handler.
 * Triggered on all subsequently defined rules if the handler is not supplied
**/
Tknzr.prototype.setDefaultHandler = function (handler) {
  this.handler = typeof handler === 'function' ? handler : null
  return this
}
/** chainable
 * Tokenizer#next(ruleSet)
 * - ruleSet (String): name of the rule set to load if rule successful
 *
 * Skip matched data silently for all subsequent rules
**/
Tknzr.prototype.next = function (ruleSet) {
  this._p_next = ruleSet
  return this
}
/** chainable
 * Tokenizer#ignore(flag)
 * - flag (Boolean): flag
 *
 * Skip matched data silently for all subsequent rules
**/
Tknzr.prototype.ignore = function (flag) {
  this._p_ignore = (flag === true)
  return this
}
/** chainable
 * Tokenizer#quiet(flag)
 * - flag (Boolean): flag
 *
 * Do not supply matched data to the handler for all subsequent rules.
 * This is used when the token data does not matter but a handler 
 * still needs to be called. Faster than standard handler call.
**/
Tknzr.prototype.quiet = function (flag) {
  this._p_quiet = (flag === true)
  return this
}
/** chainable
 * Tokenizer#trimLeft(flag)
 * - flag (Boolean): flag
 *
 * Remove the left matched pattern for all subsequent rules
**/
Tknzr.prototype.trimLeft = function (flag) {
  this._p_trimLeft = (flag === true)
  return this
}
/** chainable
 * Tokenizer#trimRight(flag)
 * - flag (Boolean): flag
 *
 * Remove the right matched pattern for all subsequent rules
 * If only 1 pattern, it is ignored
**/
Tknzr.prototype.trimRight = function (flag) {
  this._p_trimRight = (flag === true)
  return this
}
/** chainable
 * Tokenizer#trim(flag)
 * - flag (Boolean): flag
 *
 * Remove the left and right matched patterns for all subsequent rules
**/
Tknzr.prototype.trim = function (flag) {
  return this.trimLeft(flag).trimRight(flag)
}
/** chainable
 * Tokenizer#escaped(flag)
 * - flag (Boolean|String): flag
 *
 * Do not remove the left and right matched patterns for all subsequent rules
 * The default escape character is \, can be changed by specifying it instead of a Boolean
**/
Tknzr.prototype.escaped = function (flag) {
  this._p_escape = typeof flag === 'string' && flag.length > 0
    ? flag[0]
    : flag === true
      ? '\\'
      : false
  return this
}
/** chainable
 * Tokenizer#continue(jump)
 * - jump (Integer): number of rules to skip before continuing
 *
 * Continue the rules flow if rule matches at the specified rule index
**/
Tknzr.prototype.continue = function (jump) {
  if (arguments.length === 0) {
    this._p_continue = null
    return this
  }
  
  if ( !/(number|string|function)/.test(typeof jump) )
    this._error( new Error('Tokenizer#continue: Invalid jump (must be an integer/function/string): ' + jump) )
  
  this._p_continue = jump
  return this
}
/** chainable
 * Tokenizer#break()
 *
 * Abort a current rule set. Use continue(-1) to resume at the current subrule.
**/
Tknzr.prototype.break = function (flag) {
  this._p_break = (flag === true)
  return this
}
/** chainable
 * Tokenizer#saveProps(name)
 * - name (String): saved properties id
 *
 * Save all properties
**/
Tknzr.prototype.saveProps = function (name) {
  this.savedProps[name || 'default'] = {
    ignore: this._p_ignore
  , quiet: this._p_quiet
  , escape: this._p_escape
  , trimLeft: this._p_trimLeft
  , trimRight: this._p_trimRight
  , next: this._p_next
  , continue: this._p_continue
  , break: this._p_break
  }
  
  return this
}
/** chainable
 * Tokenizer#loadProps(name)
 * - name (String): saved properties id
 *
 * Restore saved proterties
**/
Tknzr.prototype.loadProps = function (name) {
  name = name || 'default'
  var p = this.savedProps[name]
  delete this.savedProps[name]

  this._p_ignore = p.ignore
  this._p_quiet = p.quiet
  this._p_escape = p.escape
  this._p_trimLeft = p.trimLeft
  this._p_trimRight = p.trimRight
  this._p_next = p.next
  this._p_continue = p.continue
  this._p_break = p.break

  return this
}
/** chainable
 * Tokenizer#clearProps()
 *
 * Reset properties to their default values
**/
Tknzr.prototype.clearProps = function () {
  this._p_ignore = false     // Get the token size and skip
  this._p_quiet = false      // Get the token size and call the handler with no data
  this._p_escape = false     // Pattern must not be escaped
  this._p_trimLeft = true    // Remove the left pattern from the token
  this._p_trimRight = true   // Remove the right pattern from the token
  this._p_next = null        // Next rule to load
  this._p_continue = null    // Next rule index to load
  this._p_break = false      // Abort current rule set

  return this
}
// include("methods_ruleset.js")
/*
 * Tokenizer public methods
 */
/** chainable, related to: Tokenizer#addRule
 * Tokenizer#addRuleFirst(firstRule, firstMatch[, nextMatch], type)
 * - beforeRule (String | Function): name of the rule to add before
 *
 * Add a rule as the first one
**/
Tknzr.prototype.addRuleFirst = function (rule, /*rule, ... */ type) {
  this.addRule.apply( this, sliceArguments(arguments, 0) )
  this.rules.unshift( this.rules.pop() )

  return this
}
Tknzr.prototype._getRuleIndex = function (id) {
  for (var rules = this.rules, i = 0, n = rules.length; i < n; i++)
    if ( (rules[i].type !== null ? rules[i].type : rules[i].handler) === id ) break
  
  return i === n ? -1 : i
}
/** chainable, related to: Tokenizer#addRule
 * Tokenizer#addRuleBefore(beforeRule, firstMatch[, nextMatch], type)
 * - beforeRule (String | Function): name of the rule to add before
 *
 * Add a rule before an existing one
**/
Tknzr.prototype.addRuleBefore = function (existingRule, rule, /*rule, ... */ type) {
  var i = this._getRuleIndex(existingRule)

  if ( i < 0 )
    return this._error( new Error('Tokenizer#addRuleBefore: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, sliceArguments(arguments, 1) )
  this.rules.splice( i, 0, this.rules.pop() )

  return this
}
/** chainable, related to: Tokenizer#addRule
 * Tokenizer#addRuleAfter(afterRule, firstMatch[, nextMatch], type)
 * - afterRule (String | Function): name of the rule to add after
 *
 * Add a rule after an existing one
**/
Tknzr.prototype.addRuleAfter = function (existingRule, rule, /*rule, ... */ type) {
  var i = this._getRuleIndex(existingRule)

  if ( i < 0 )
    return this._error( new Error('Tokenizer#addRuleAfter: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, sliceArguments(arguments, 1) )
  this.rules.splice( i + 1, 0, this.rules.pop() )

  return this
}
/** chainable
 * Tokenizer#addRule(firstMatch[, nextMatch], type)
 * - firstMatch (String | Integer | Array): match at current buffer position (String: expect string, Integer: expect n characters, Array: expect one of the items). If not needed, use ''
 * - nextMatch (String | Integer | Array): next match after previous matches. Can have as many as required (String: expect string, Integer: expect n characters, Array: expect one of the items)
 * - type (String | Function | Number): rule name/id (if no default handler set, emit a data event) or handler (executed when all matches are valid)
 *
 * Add a rule
**/
Tknzr.prototype.addRule = function (/*rule1, rule2, ... type|handler*/) {
  var args = sliceArguments(arguments, 0)

  if (args.length < 2)
    return this._error( new Error('Tokenizer#addRule: Missing arguments (rule1, /*rule2 ...*/ type|handler)') )
  
  var first = args[0]
  var last = args.pop()
  var type, handler = this.handler

  switch ( typeof(last) ) {
    case 'function':
      handler = last
      break
    case 'number':
    case 'string':
      type = last
      break
    default:
      return this._error( new Error('Tokenizer#addRule: invalid type/handler, must be Number/String/Function') )
  }

  // first <= 0: following arguments are ignored
  if ( first === 0 ) { // Empty buffer rule
    this.emptyHandler = RuleString(
        0
      , type
      , handler
      , this
      )
  } else {
    this.rules.push(
      RuleString(
        args
      , type
      , handler
      , this
      )
    )
  }

  return this
}
/** chainable
 * Tokenizer#removeRule(name)
 * - name (String): name of the rule to be removed
 *
 * Remove a rule (first instance only)
**/
Tknzr.prototype.removeRule = function (/* name ... */) {
  if (arguments.length === 0) return this
  
  for (var idx, i = 0, n = arguments.length; i < n; i++) {
    idx = this._getRuleIndex(arguments[i])
    if (idx >= 0)
      this.rules.splice(idx, 1)
  }

  return this
}
/** chainable
 * Tokenizer#clearRule()
 *
 * Remove all rules
**/
Tknzr.prototype.clearRule = function () {
  this.clearProps()
  this.rules = []
  this.handler = null
  this.currentRule = null
  return this
}
/** chainable
 * Tokenizer#saveRuleSet(name)
 * - name (String): name of the rule set
 *
 * Save all rules
**/
Tknzr.prototype.saveRuleSet = function (name) {
  if (arguments.length === 0 || name === null)
    return this._error( new Error('Tokenizer#saveRuleSet: invalid rule name supplied') )
  
  // Check and set the continue values
  var rules = this.rules
    , rule, id, j
  for (var i = 0, n = rules.length; i < n; i++) {
    rule = rules[i]
    id = rule.type !== null ? rule.type : rule.handler
    if (rule.continue !== null && typeof rule.continue !== 'number') {
      j = this._getRuleIndex(id)
      if (j < 0)
        this._error( new Error('Tokenizer#saveRuleSet: continue() value not found: ' + id) )
      
      rule.continue = i - j - 1
    }
  }

  this.saved[name] = {
    rules: this.rules
  , emptyHandler: this.emptyHandler
  }
  this.currentRule = name

  return this
}
/** chainable
 * Tokenizer#loadRuleSet(name)
 * - name (String): name of the rule set
 *
 * Load a rule set
**/
Tknzr.prototype.loadRuleSet = function (name) {
  var ruleSet = this.saved[name]
  if (!ruleSet)
    return this._error( new Error('Tokenizer#loadRuleSet: Rule set ' + name + ' not found') )

  this.currentRule = name
  this.rules = ruleSet.rules
  this.emptyHandler = ruleSet.emptyHandler
  // Reset the rule index...
  this.ruleIndex = 0
  this._resetRuleIndex = true

  return this
}
/** chainable
 * Tokenizer#deleteRuleSet(name)
 * - name (String): name of the rule set
 *
 * Delete a rule set
**/
Tknzr.prototype.deleteRuleSet = function (name) {
  delete this.saved[name]

  return this
}
/**
 * Tokenizer#getRuleSet()
 *
 * Get the current rule set
**/
Tknzr.prototype.getRuleSet = function () {
  return this.currentRule
}
/**
 * Tokenizer#getAllRuleSet()
 *
 * Get the list of rule sets
**/
Tknzr.prototype.getAllRuleSet = function () {
  return this.saved
}
/**
 * Tokenizer#existsRule(name[, name2]) -> Boolean
 * - name (String): name of the rule to check
 *
 * Check the existence of a rule
**/
Tknzr.prototype.existsRule = function (/* name ... */) {
  var args = sliceArguments(arguments, 0)
  var self = this

  var res = args.map(function (rule) {
    return self._getRuleIndex(rule) >= 0
  })

  return args.length === 1 ? res[0] : res
}
