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
  this.next = options._p_next
  this.nextIndex = options._p_nextIndex
  this.continue = options._p_continue
  this.continueOnFail = options._p_continueOnFail
  this.break = options._p_break
  this.continueGroup = options._p_continueGroup
  this.continueOnFailGroup = options._p_continueOnFailGroup

  // Backup continue values for Atok#resolveRules()
  this.backup = { continue: this.continue, continueOnFail: this.continueOnFail }

  this.group = options._group
  this.groupStart = options._groupStart
  this.groupEnd = options._groupEnd

  this.atok = options

  this.type = type
  this.handler = handler
  this.prevHandler = null
  this.id = this.type !== null ? this.type : handler
  // Id for debug
  this._id = (handler !== null ? (handler.name || '#emit()') : this.type)

  this.rules = []
  this.idx = -1     // Subrule pattern index that matched (-1 if only 1 pattern)
  this.length = 0   // First subrule pattern length (max of all patterns if many) - used in infinite loop detection
  // Does the rule generate any token?
  this.noToken = this.quiet || this.ignore
  // Generated token
  this.token = this.noToken ? 0 : ''
  // In some cases, we know the token will be empty, no matter what
  // NB. this.noToken is tested before emptyToken
  this.emptyToken = false
  // Rule index (only used with addRule(0) since it is invoked out of normal rules list)
  this.ruleIndex = -1

  // Special case: addRule()
  if (subrules.length === 0) {
    this.test = this.noop
    return this
  }

  // To ensure rule index is not reset if single subrule has no length
  this.length = -1
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
/**
 * Do nothing
 *
 * @return {number} always 1
 * @api private
 */
Rule.prototype.noop = function () {
  // This will result in the offset staying the same while resetting the rule index
  this.atok.offset--
  return 1
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
  for (var list = new Array(32), i = 0; i < 32; i++) {
    list[i] = arguments[32 - i] ? 1 : 0
  }
  this[method] = this[ method + "_" + parseInt(list.join(""), 2) ]
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
      matchedTotal += (typeof matched === 'number' ? matched : matched.length) + rule[i].size
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
      matchedTotal += (typeof matched === 'number' ? matched : matched.length) + rule[i].size
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
      matchedTotal += (typeof matched === 'number' ? matched : matched.length) + rule[i].size
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
      matchedTotal += (typeof matched === 'number' ? matched : matched.length) + rule[i].size
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
        this._id
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
        this._id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if (rule[i].token && matched !== -1) { // Set the token

      this.atok.emit_debug('Rule#test', 'token', [ matched ])

      token = true
      matchedTotal += (typeof matched === 'number' ? matched : matched.length) + rule[i].size
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
        this._id
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
        this._id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if (rule[i].token && matched !== -1) { // Set the token

      this.atok.emit_debug('Rule#test', 'token', [ matched ])

      token = true
      matchedTotal += (typeof matched === 'number' ? matched : matched.length) + rule[i].size
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
        this._id
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
        this._id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if (rule[i].token && matched !== -1) { // Set the token

      this.atok.emit_debug('Rule#test', 'token', [ matched ])

      token = true
      matchedTotal += (typeof matched === 'number' ? matched : matched.length) + rule[i].size
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
        this._id
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
        this._id
      , i + 1
      , n
      , start
      , matched
      ]
    )


    if (rule[i].token && matched !== -1) { // Set the token

      this.atok.emit_debug('Rule#test', 'token', [ matched ])

      token = true
      matchedTotal += (typeof matched === 'number' ? matched : matched.length) + rule[i].size
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
