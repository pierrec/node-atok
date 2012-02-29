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
  // Set the test method according to static properties
  var test_flags = []

  test_flags.push(
    this.genToken
  , this.trimLeft
  , this.trimRight
  , this.atok.debugMode
  )

  this.test = this[ 'test_' + test_flags.join('_') ]
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
Rule.prototype.test_true_true_true_false = // include("src/string/rule#test.js")
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


  this.countStat++
  return matchedTotal
}
Rule.prototype.test_true_false_true_false = // include("src/string/rule#test.js")
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


  this.countStat++
  return matchedTotal
}
Rule.prototype.test_true_false_false_false = // include("src/string/rule#test.js")
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


  this.countStat++
  return matchedTotal
}
Rule.prototype.test_true_true_false_false = // include("src/string/rule#test.js")
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


  this.countStat++
  return matchedTotal
}

Rule.prototype.test_false_true_true_false = // include("src/string/rule#test.js")
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
        : data.substr( offset + trimLeftSize, tokenLength )

  this.countStat++
  return matchedTotal
}
Rule.prototype.test_false_false_true_false = // include("src/string/rule#test.js")
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
        : data.substr( offset + trimLeftSize, tokenLength )

  this.countStat++
  return matchedTotal
}
Rule.prototype.test_false_false_false_false = // include("src/string/rule#test.js")
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
        : data.substr( offset + trimLeftSize, tokenLength )

  this.countStat++
  return matchedTotal
}
Rule.prototype.test_false_true_false_false = // include("src/string/rule#test.js")
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
        : data.substr( offset + trimLeftSize, tokenLength )

  this.countStat++
  return matchedTotal
}

Rule.prototype.test_true_true_true_true = // include("src/string/rule#test.js")
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
    ,   'subrule'
    , [ 
        this.type === null ? this.handler.name : this.type
      , i + 1
      , n
      , start
      , matched
      ]
    )
    if (rule[i].token && matched !== -1) { // Set the token
      this.atok.emit_debug('Rule#test', 'token', matched)
      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule
  this.atok.emit_debug('Rule#test', 'end', [ offset, -1 ])
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


  this.countStat++
  this.atok.emit_debug('Rule#test', 'end', [ offset, matchedTotal ])
  return matchedTotal
}
Rule.prototype.test_true_false_true_true = // include("src/string/rule#test.js")
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
    ,   'subrule'
    , [ 
        this.type === null ? this.handler.name : this.type
      , i + 1
      , n
      , start
      , matched
      ]
    )
    if (rule[i].token && matched !== -1) { // Set the token
      this.atok.emit_debug('Rule#test', 'token', matched)
      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule
  this.atok.emit_debug('Rule#test', 'end', [ offset, -1 ])
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


  this.countStat++
  this.atok.emit_debug('Rule#test', 'end', [ offset, matchedTotal ])
  return matchedTotal
}
Rule.prototype.test_true_false_false_true = // include("src/string/rule#test.js")
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
    ,   'subrule'
    , [ 
        this.type === null ? this.handler.name : this.type
      , i + 1
      , n
      , start
      , matched
      ]
    )
    if (rule[i].token && matched !== -1) { // Set the token
      this.atok.emit_debug('Rule#test', 'token', matched)
      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule
  this.atok.emit_debug('Rule#test', 'end', [ offset, -1 ])
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


  this.countStat++
  this.atok.emit_debug('Rule#test', 'end', [ offset, matchedTotal ])
  return matchedTotal
}
Rule.prototype.test_true_true_false_true = // include("src/string/rule#test.js")
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
    ,   'subrule'
    , [ 
        this.type === null ? this.handler.name : this.type
      , i + 1
      , n
      , start
      , matched
      ]
    )
    if (rule[i].token && matched !== -1) { // Set the token
      this.atok.emit_debug('Rule#test', 'token', matched)
      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule
  this.atok.emit_debug('Rule#test', 'end', [ offset, -1 ])
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


  this.countStat++
  this.atok.emit_debug('Rule#test', 'end', [ offset, matchedTotal ])
  return matchedTotal
}

Rule.prototype.test_false_true_true_true = // include("src/string/rule#test.js")
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
    ,   'subrule'
    , [ 
        this.type === null ? this.handler.name : this.type
      , i + 1
      , n
      , start
      , matched
      ]
    )
    if ( matched < 0 ) { // Invalid rule
  this.atok.emit_debug('Rule#test', 'end', [ offset, -1 ])
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
        : data.substr( offset + trimLeftSize, tokenLength )

  this.countStat++
  this.atok.emit_debug('Rule#test', 'end', [ offset, matchedTotal ])
  return matchedTotal
}
Rule.prototype.test_false_false_true_true = // include("src/string/rule#test.js")
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
    ,   'subrule'
    , [ 
        this.type === null ? this.handler.name : this.type
      , i + 1
      , n
      , start
      , matched
      ]
    )
    if ( matched < 0 ) { // Invalid rule
  this.atok.emit_debug('Rule#test', 'end', [ offset, -1 ])
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
        : data.substr( offset + trimLeftSize, tokenLength )

  this.countStat++
  this.atok.emit_debug('Rule#test', 'end', [ offset, matchedTotal ])
  return matchedTotal
}
Rule.prototype.test_false_false_false_true = // include("src/string/rule#test.js")
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
    ,   'subrule'
    , [ 
        this.type === null ? this.handler.name : this.type
      , i + 1
      , n
      , start
      , matched
      ]
    )
    if ( matched < 0 ) { // Invalid rule
  this.atok.emit_debug('Rule#test', 'end', [ offset, -1 ])
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
        : data.substr( offset + trimLeftSize, tokenLength )

  this.countStat++
  this.atok.emit_debug('Rule#test', 'end', [ offset, matchedTotal ])
  return matchedTotal
}
Rule.prototype.test_false_true_false_true = // include("src/string/rule#test.js")
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
    ,   'subrule'
    , [ 
        this.type === null ? this.handler.name : this.type
      , i + 1
      , n
      , start
      , matched
      ]
    )
    if ( matched < 0 ) { // Invalid rule
  this.atok.emit_debug('Rule#test', 'end', [ offset, -1 ])
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
        : data.substr( offset + trimLeftSize, tokenLength )

  this.countStat++
  this.atok.emit_debug('Rule#test', 'end', [ offset, matchedTotal ])
  return matchedTotal
}
