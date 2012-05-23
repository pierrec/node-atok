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

/**
 * Atok Rule constructor
 *
 * @param {array} list of subrules
 * @param {string|number|null=} rule type (set if handler is not)
 * @param {function()=} rule handler (set if type is not)
 * @param {Object=} rule options (inherited from the atok options)
 * @constructor
 * @api private
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
  this.nextIndex = options._p_nextIndex
  this.continue = options._p_continue
  this.continueOnFail = options._p_continueOnFail
  this.break = options._p_break

  this.bufferMode = (options._bufferMode === true)

  this.atok = options

  this.type = type || null
  this.handler = handler
  this.prevHandler = null
  this.id = this.type !== null ? this.type : (handler && handler.name ? handler.name : '#emit()' )

  this.rules = []
  this.idx = -1     // Subrule pattern index that matched (-1 if only 1 pattern)
  this.length = 0   // First subrule pattern length (max of all patterns if many)
  // Does the rule generate any token?
  this.noToken = this.quiet || this.ignore
  // Generated token
  this.token = this.noToken ? 0 : ''
  // In some cases, we know the token will be empty, no matter what
  // NB. this.noToken is tested before emptyToken
  this.emptyToken = false

  // Special case: addRule(0)
  if (subrules === 0) return this

  // Special case: addRule()
  if (subrules.length === 0) {
    this.test = this.nothing
    return this
  }

  // Instantiate all sub rules
  for (var r, i = 0, n = subrules.length; i < n; i++) {
    r = SubRuleString(subrules[i], i, n, this)
    this.rules.push(r)
    this.length = Math.max(this.length, r.length)
  }
  
  // Do we have an empty token?
  this.emptyToken = (n === 1 && this.trimLeft && !this.rules[0].token)
  
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
    this.setDebug(true)
  }
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
      var id = this.id, handler = this.handler

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
    ;[ 'nothing', 'all', 'allNoToken' ].forEach(function (method) {
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
/**
 * Return 0
 *
 * @return {number} always 0
 * @api private
 */
Rule.prototype.nothing = function () {
  return 0
}
/**
 * Return the amount of data left
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {Object}
 * @api private
 */
Rule.prototype.allNoToken = function (data, offset) {
  this.token = data.length - offset
  return this.token
}
/**
 * Return remaining data
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
Rule.prototype.all = function (data, offset) {
  this.token = data.substr(offset)
  return this.token.length
}

// Test all subrules
// rule#test_masked.js is generated by the build system based on rule#test.js
// include("rule#test_masked.js")
// The content of this file was automatically generated during build time
function _MaskSetter (method /* , flag1, flag2... */) {
  for (var int = 0, j = 33; --j;) {
    int = int | (arguments[j] ? 1 : 0)
    if (j > 1) int = int << 1
  }
  this[method] = this[ method + "_" + int ]
}

// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=0
Rule.prototype.test_0 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)


    if ( matched < 0 ) { // Invalid rule

      return -1
    } else { // Valid rule

      matchedTotal += matched
      matched = matchedTotal
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do



      var tokenLength = matchedTotal - trimLeftSize

      this.token = this.noToken
        // Set the token to the size of what would have been extracted
        ? tokenLength
        // By default, the token is stripped out from the left and last right patterns
        : this.emptyToken ? '' : data.substr( offset + trimLeftSize, tokenLength )



  return matchedTotal
}
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=0
Rule.prototype.test_1 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)


    if (rule[i].token && matched !== -1) { // Set the token

      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule

      return -1
    } else if (!token) { // Valid rule with no token

      matchedTotal += matched
      matched = matchedTotal
    } else { // Valid rule with token
      matchedForToken += matched
      matched = matchedForToken
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do




  return matchedTotal
}
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=0
Rule.prototype.test_2 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)


    if ( matched < 0 ) { // Invalid rule

      return -1
    } else { // Valid rule

      if (i === 0) trimLeftSize = firstRule.size

      matchedTotal += matched
      matched = matchedTotal
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do



      var tokenLength = matchedTotal - trimLeftSize

      this.token = this.noToken
        // Set the token to the size of what would have been extracted
        ? tokenLength
        // By default, the token is stripped out from the left and last right patterns
        : this.emptyToken ? '' : data.substr( offset + trimLeftSize, tokenLength )



  return matchedTotal
}
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=0
Rule.prototype.test_3 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)


    if (rule[i].token && matched !== -1) { // Set the token

      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule

      return -1
    } else if (!token) { // Valid rule with no token

      if (i === 0) trimLeftSize = firstRule.size

      matchedTotal += matched
      matched = matchedTotal
    } else { // Valid rule with token
      matchedForToken += matched
      matched = matchedForToken
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do




  return matchedTotal
}
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=0
Rule.prototype.test_4 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)


    if ( matched < 0 ) { // Invalid rule

      return -1
    } else { // Valid rule

      matchedTotal += matched
      matched = matchedTotal
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do



      var tokenLength = matchedTotal - trimLeftSize - lastRule.size

      this.token = this.noToken
        // Set the token to the size of what would have been extracted
        ? tokenLength
        // By default, the token is stripped out from the left and last right patterns
        : this.emptyToken ? '' : data.substr( offset + trimLeftSize, tokenLength )



  return matchedTotal
}
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=0
Rule.prototype.test_5 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)


    if (rule[i].token && matched !== -1) { // Set the token

      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule

      return -1
    } else if (!token) { // Valid rule with no token

      matchedTotal += matched
      matched = matchedTotal
    } else { // Valid rule with token
      matchedForToken += matched
      matched = matchedForToken
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do




  return matchedTotal
}
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=0
Rule.prototype.test_6 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)


    if ( matched < 0 ) { // Invalid rule

      return -1
    } else { // Valid rule

      if (i === 0) trimLeftSize = firstRule.size

      matchedTotal += matched
      matched = matchedTotal
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do



      var tokenLength = matchedTotal - trimLeftSize - lastRule.size

      this.token = this.noToken
        // Set the token to the size of what would have been extracted
        ? tokenLength
        // By default, the token is stripped out from the left and last right patterns
        : this.emptyToken ? '' : data.substr( offset + trimLeftSize, tokenLength )



  return matchedTotal
}
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=0
Rule.prototype.test_7 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)


    if (rule[i].token && matched !== -1) { // Set the token

      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule

      return -1
    } else if (!token) { // Valid rule with no token

      if (i === 0) trimLeftSize = firstRule.size

      matchedTotal += matched
      matched = matchedTotal
    } else { // Valid rule with token
      matchedForToken += matched
      matched = matchedForToken
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do




  return matchedTotal
}
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=1
Rule.prototype.test_8 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)

    this.atok.emit_debug(
        'Rule#test'
    ,   'subrule-START'
    , [ 
        this.id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if ( matched < 0 ) { // Invalid rule

  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, -1 ])

      return -1
    } else { // Valid rule

      matchedTotal += matched
      matched = matchedTotal
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do



      var tokenLength = matchedTotal - trimLeftSize

      this.token = this.noToken
        // Set the token to the size of what would have been extracted
        ? tokenLength
        // By default, the token is stripped out from the left and last right patterns
        : this.emptyToken ? '' : data.substr( offset + trimLeftSize, tokenLength )



  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, matchedTotal ])

  return matchedTotal
}
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=1
Rule.prototype.test_9 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)

    this.atok.emit_debug(
        'Rule#test'
    ,   'subrule-START'
    , [ 
        this.id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if (rule[i].token && matched !== -1) { // Set the token

      this.atok.emit_debug('Rule#test', 'token', [ matched ])

      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule

  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, -1 ])

      return -1
    } else if (!token) { // Valid rule with no token

      matchedTotal += matched
      matched = matchedTotal
    } else { // Valid rule with token
      matchedForToken += matched
      matched = matchedForToken
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do




  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, matchedTotal ])

  return matchedTotal
}
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=1
Rule.prototype.test_10 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)

    this.atok.emit_debug(
        'Rule#test'
    ,   'subrule-START'
    , [ 
        this.id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if ( matched < 0 ) { // Invalid rule

  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, -1 ])

      return -1
    } else { // Valid rule

      if (i === 0) trimLeftSize = firstRule.size

      matchedTotal += matched
      matched = matchedTotal
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do



      var tokenLength = matchedTotal - trimLeftSize

      this.token = this.noToken
        // Set the token to the size of what would have been extracted
        ? tokenLength
        // By default, the token is stripped out from the left and last right patterns
        : this.emptyToken ? '' : data.substr( offset + trimLeftSize, tokenLength )



  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, matchedTotal ])

  return matchedTotal
}
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=1
Rule.prototype.test_11 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)

    this.atok.emit_debug(
        'Rule#test'
    ,   'subrule-START'
    , [ 
        this.id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if (rule[i].token && matched !== -1) { // Set the token

      this.atok.emit_debug('Rule#test', 'token', [ matched ])

      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule

  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, -1 ])

      return -1
    } else if (!token) { // Valid rule with no token

      if (i === 0) trimLeftSize = firstRule.size

      matchedTotal += matched
      matched = matchedTotal
    } else { // Valid rule with token
      matchedForToken += matched
      matched = matchedForToken
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do




  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, matchedTotal ])

  return matchedTotal
}
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=1
Rule.prototype.test_12 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)

    this.atok.emit_debug(
        'Rule#test'
    ,   'subrule-START'
    , [ 
        this.id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if ( matched < 0 ) { // Invalid rule

  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, -1 ])

      return -1
    } else { // Valid rule

      matchedTotal += matched
      matched = matchedTotal
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do



      var tokenLength = matchedTotal - trimLeftSize - lastRule.size

      this.token = this.noToken
        // Set the token to the size of what would have been extracted
        ? tokenLength
        // By default, the token is stripped out from the left and last right patterns
        : this.emptyToken ? '' : data.substr( offset + trimLeftSize, tokenLength )



  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, matchedTotal ])

  return matchedTotal
}
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=1
Rule.prototype.test_13 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)

    this.atok.emit_debug(
        'Rule#test'
    ,   'subrule-START'
    , [ 
        this.id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if (rule[i].token && matched !== -1) { // Set the token

      this.atok.emit_debug('Rule#test', 'token', [ matched ])

      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule

  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, -1 ])

      return -1
    } else if (!token) { // Valid rule with no token

      matchedTotal += matched
      matched = matchedTotal
    } else { // Valid rule with token
      matchedForToken += matched
      matched = matchedForToken
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do




  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, matchedTotal ])

  return matchedTotal
}
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=1
Rule.prototype.test_14 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)

    this.atok.emit_debug(
        'Rule#test'
    ,   'subrule-START'
    , [ 
        this.id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if ( matched < 0 ) { // Invalid rule

  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, -1 ])

      return -1
    } else { // Valid rule

      if (i === 0) trimLeftSize = firstRule.size

      matchedTotal += matched
      matched = matchedTotal
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do



      var tokenLength = matchedTotal - trimLeftSize - lastRule.size

      this.token = this.noToken
        // Set the token to the size of what would have been extracted
        ? tokenLength
        // By default, the token is stripped out from the left and last right patterns
        : this.emptyToken ? '' : data.substr( offset + trimLeftSize, tokenLength )



  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, matchedTotal ])

  return matchedTotal
}
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=1
Rule.prototype.test_15 = // include("rule#test.js")
/**
 * Test method for Rule: result >=0 means the rule was latched and this is the
 * amount of matched data, <0: rule did not match
 *
 * @param {Object} incoming data
 * @param {number} data offset
 * @return {number}
 * @api private
 */
function (data, offset) {
  var matched = 0       // SubRule result: Integer: matched size, Other: token
  var matchedTotal = 0  // Total jump
  var matchedForToken = 0  // Offset when a token was set
  var start = offset    // Buffer start
  var s = data
  var token = false

  var rule = this.rules
  var n = rule.length
  var firstRule = rule[0]
  var lastRule = rule[n-1]
  var trimLeftSize = 0

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)

    this.atok.emit_debug(
        'Rule#test'
    ,   'subrule-START'
    , [ 
        this.id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if (rule[i].token && matched !== -1) { // Set the token

      this.atok.emit_debug('Rule#test', 'token', [ matched ])

      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule

  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, -1 ])

      return -1
    } else if (!token) { // Valid rule with no token

      if (i === 0) trimLeftSize = firstRule.size

      matchedTotal += matched
      matched = matchedTotal
    } else { // Valid rule with token
      matchedForToken += matched
      matched = matchedForToken
    }

  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do




  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, matchedTotal ])

  return matchedTotal
}
