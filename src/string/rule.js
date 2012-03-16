/*
 * class Rule
 *
 * Rule for stream based tokenizer
 *
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
**/
var SubRuleString = require('./subrule')

module.exports = Rule

/*
  Rule constructor
 */
function Rule (subrules, type, handler, options) {
  if ( !(this instanceof Rule) )
    return new Rule(subrules, type, handler, options)
  
  var self = this
  options = options || {}

  // Rule options
  this.trimLeft = options._p_trimLeft
  this.trimRight = options._p_trimRight
  this.ignore = options._p_ignore
  this.quiet = options._p_quiet
  this.escape = options._p_escape
  this.next = (typeof options._p_next === 'string') ? options._p_next : null
  this.continue = options._p_continue
  this.break = options._p_break

  this.bufferMode = (options._bufferMode === true)

  this.atok = options

  this.type = type || null
  this.handler = handler

  this.countStat = 0
  this.idx = -1
  this.token = ''
  this.noToken = this.quiet || this.ignore

  // Special case: addRule(0)
  if (subrules === 0) {
    this.handler = handler || function atokDefaultHandler () {
      options.emit_data(options.ending, -1, self.type)
    }
    return this
  }

  // Instantiate all sub rules
  this.rules = []
  for (var r, i = 0, n = subrules.length; i < n; i++) {
    r = SubRuleString(subrules[i], i, n, this)
    this.rules.push(r)
  }
  
  // Does the rule generate any token?
  this.noToken = (n === 1 && this.trimLeft && !this.rules[0].token) || this.noToken
  
  // Disable trimRight if only 1 rule
  if (this.rules.length === 1)
    this.trimRight = false

  // Filter out non rules
  this.rules = this.rules.filter(function (r, i) {
    var flag = typeof r.exec === 'function'
    // Disable left trimming if the first rule does not exist
    if (i === 0 && !flag) self.trimLeft = false
    return flag
  })
  // No rule left...will return all data
  if (this.rules.length === 0) {
    this.test = this.noToken ? this.allNoToken : this.all
  } else {
    // Does the rule generate any token regardless of its properties?
    for (var i = 0, n = this.rules.length; i < n; i++)
      if (this.rules[i].token) break

    this.genToken = (i < n)
    this.setDebug()
  }
}

// Set debug mode on/off
Rule.prototype.setDebug = function () {
  _MaskSetter.call(
    this
  , 'test'
  , this.genToken
  , this.trimLeft
  , this.trimRight
  , this.atok.debugMode
  )
}

// Return the amount of data left
Rule.prototype.allNoToken = function (data, offset) {
  this.token = data.length - offset
  return this.token
}

// Return remaining data
Rule.prototype.all = function (data, offset) {
  this.token = data.substr(offset)
  return this.token.length
}

// Test all subrules
//include("rule#test_masked.js")
