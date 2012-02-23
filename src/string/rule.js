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
  this.split = options._p_split && (subrules.length > 2)

  this.bufferMode = (options._bufferMode === true)
  this.debug = options.debug

  this.type = type || null
  this.handler = handler

  this.countStat = 0
  this.idx = -1
  this.token = ''
  this.noToken = this.quiet || this.ignore

  // Special case: addRule(0)
  if (subrules === 0) {
    this.handler = handler || function () {
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
    // Set the test method according to static properties
    var test_flags = []
    test_flags.push(
      this.rules.reduce(function (p, r) { return p || !!r.token }, false)
    , this.trimLeft
    , this.split
    , !!this.debug
    )
    this.test = this[ 'test_' + test_flags.join('_') ]
  }

  // Set the split starting index - offset by 1 if first rule was valid
  this.splitStart = !this.split ? 0 : this.rules.length < n ? 0 : 1
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
// #test() is divided into various methods based on static flag values
//var DEBUG = false
//var RULE_GENERATES_TOKEN = true
//var RULE_TRIMLEFT = true
//var RULE_SPLIT = true
Rule.prototype.test_true_true_true_false = //include("rule#test.js")
//var RULE_TRIMLEFT = false
Rule.prototype.test_true_false_true_false = //include("rule#test.js")
//var RULE_SPLIT = false
Rule.prototype.test_true_false_false_false = //include("rule#test.js")
//var RULE_TRIMLEFT = true
Rule.prototype.test_true_true_false_false = //include("rule#test.js")

//var RULE_GENERATES_TOKEN = false
//var RULE_TRIMLEFT = true
//var RULE_SPLIT = true
Rule.prototype.test_false_true_true_false = //include("rule#test.js")
//var RULE_TRIMLEFT = false
Rule.prototype.test_false_false_true_false = //include("rule#test.js")
//var RULE_SPLIT = false
Rule.prototype.test_false_false_false_false = //include("rule#test.js")
//var RULE_TRIMLEFT = true
Rule.prototype.test_false_true_false_false = //include("rule#test.js")

//var DEBUG = true
//var RULE_GENERATES_TOKEN = true
//var RULE_TRIMLEFT = true
//var RULE_SPLIT = true
Rule.prototype.test_true_true_true_true = //include("rule#test.js")
//var RULE_TRIMLEFT = false
Rule.prototype.test_true_false_true_true = //include("rule#test.js")
//var RULE_SPLIT = false
Rule.prototype.test_true_false_false_true = //include("rule#test.js")
//var RULE_TRIMLEFT = true
Rule.prototype.test_true_true_false_true = //include("rule#test.js")

//var RULE_GENERATES_TOKEN = false
//var RULE_TRIMLEFT = true
//var RULE_SPLIT = true
Rule.prototype.test_false_true_true_true = //include("rule#test.js")
//var RULE_TRIMLEFT = false
Rule.prototype.test_false_false_true_true = //include("rule#test.js")
//var RULE_SPLIT = false
Rule.prototype.test_false_false_false_true = //include("rule#test.js")
//var RULE_TRIMLEFT = true
Rule.prototype.test_false_true_false_true = //include("rule#test.js")
