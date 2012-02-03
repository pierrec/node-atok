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

  // Rule flags
  this._clearRuleProp()

  if (!keepRules) {
    this.currentRule = ''     // Name of the current rule  
    this.emptyHandler = null  // Handler to trigger when the buffer becomes empty
    this.rules = []           // Rules to be checked against
    this.handler = null       // Matched token default handler
    this.saved = {}           // Saved rules
  }

  return this
}
Tknzr.prototype._clearRuleProp = function () {
  this._ignore = false     // Get the token size and skip
  this._quiet = false      // Get the token size and call the handler with no data
  this._escape = false     // Pattern must not be escaped
  this._trimLeft = true    // Remove the left pattern from the token
  this._trimRight = true   // Remove the right pattern from the token
  this._next = null        // Next rule to load
  this._continue = -1      // Next rule index to load
}
/**
 * Tokenizer#flush()
 *
 * Terminate the current tokenizing and return the current buffer
**/
Tknzr.prototype.flush = function () {
  var buf = this.buffer
    , offset = this.offset
    , mode = this._bufferMode
  
  this.clear(true) // Keep rules!

  return mode ? buf.slice(offset) : buf.substr(offset)
}
/** chainable
 * Tokenizer#setEncoding(encoding)
 * - encoding (String): encoding to be used
 *
 * Set the string encoding
**/
Tknzr.prototype.setEncoding = function (enc) {
  this._encoding = enc || defaultEncoding
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
  this.bytesRead += i > 0 ? i : -i // Bytes read always increase!
  this.offset += i
  if (this.offset < 0)
    return this._error( new Error('Tokenizer#seek: negative offset: ' + this.offset + ' from ' + i) )
  return this
}/** chainable
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
  this._next = ruleSet
  return this
}
/** chainable
 * Tokenizer#ignore(flag)
 * - flag (Boolean): flag
 *
 * Skip matched data silently for all subsequent rules
**/
Tknzr.prototype.ignore = function (flag) {
  this._ignore = (flag === true)
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
  this._quiet = (flag === true)
  return this
}
/** chainable
 * Tokenizer#trimLeft(flag)
 * - flag (Boolean): flag
 *
 * Remove the left matched pattern for all subsequent rules
**/
Tknzr.prototype.trimLeft = function (flag) {
  this._trimLeft = (flag === true)
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
  this._trimRight = (flag === true)
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
  this._escape = typeof flag === 'string' && flag.length > 0
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
  if (arguments.length === 0) jump = -1

  if (typeof jump !== 'number')
    this._error( new Error('Tokenizer#continue: Invalid jump (must be an integer):' + jump) )
  
  this._continue = jump
  return this
}/*
 * Tokenizer public methods
 */
/** chainable, related to: Tokenizer#addRule
 * Tokenizer#addRuleFirst(firstRule, firstMatch[, nextMatch], type)
 * - beforeRule (String | Function): name of the rule to add before
 *
 * Add a rule as the first one
**/
Tknzr.prototype.addRuleFirst = function (rule, /*rule, ... */ type) {
  this.addRule.apply( this, slice.call(arguments, 0) )
  this.rules.unshift( this.rules.pop() )

  return this
}
/** chainable, related to: Tokenizer#addRule
 * Tokenizer#addRuleBefore(beforeRule, firstMatch[, nextMatch], type)
 * - beforeRule (String | Function): name of the rule to add before
 *
 * Add a rule before an existing one
**/
Tknzr.prototype.addRuleBefore = function (existingRule, rule, /*rule, ... */ type) {
  for (var rules = this.rules, i = 0, n = rules.length; i < n; i++)
    if ( (rules[i].type !== null ? rules[i].type : rules[i].handler) === existingRule ) break

  if ( i == n )
    return this._error( new Error('Tokenizer#addRuleBefore: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, slice.call(arguments, 1) )
  rules.splice( i, 0, rules.pop() )

  return this
}
/** chainable, related to: Tokenizer#addRule
 * Tokenizer#addRuleAfter(afterRule, firstMatch[, nextMatch], type)
 * - afterRule (String | Function): name of the rule to add after
 *
 * Add a rule after an existing one
**/
Tknzr.prototype.addRuleAfter = function (existingRule, rule, /*rule, ... */ type) {
  for (var rules = this.rules, i = 0, n = rules.length; i < n; i++)
    if ( (rules[i].type !== null ? rules[i].type : rules[i].handler) === existingRule ) break

  if ( i == n )
    return this._error( new Error('Tokenizer#addRuleAfter: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, slice.call(arguments, 1) )
  rules.splice( i + 1, 0, rules.pop() )

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
  var args = slice.call(arguments, 0)

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
      return this._error( new Error('Tokenizer#addRule: invalid type/handler, must be String/Function') )
  }

  // first===0: following arguments are ignored
  if ( first === 0 ) { // Empty buffer rule
    var self = this
    this.emptyHandler = handler || function () {
      self.emit('data', null, -1, type)
    }
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
 * Remove a rule
**/
Tknzr.prototype.removeRule = function (/* name ... */) {
  var args = arguments
  var n = args.length

  this.rules = this.rules.filter(function (rule) {
    var type = rule.type !== null ? rule.type : rule.handler
    for (var i = 0; i < n; i++)
      if (args[i] === type) return false
    return true
  })

  return this
}
/** chainable
 * Tokenizer#clearRule()
 *
 * Remove all rules
**/
Tknzr.prototype.clearRule = function () {
  this._clearRuleProp()
  this.rules = []
  this.handler = null
  return this
}
/** chainable
 * Tokenizer#saveRuleSet(name)
 * - name (String): name of the rule set
 *
 * Save all rules
**/
Tknzr.prototype.saveRuleSet = function (name) {
  if (arguments.length == 0)
    return this._error( new Error('Tokenizer#saveRuleSet: No rule name supplied') )
  
  this.saved[name] = {
    rules: this.rules
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

  return this
}
/** chainable
 * Tokenizer#getRuleSets()
 *
 * Get the list of rule sets
**/
Tknzr.prototype.getRuleSets = function () {
  return this.saved
}