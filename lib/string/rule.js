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
  options
  trackMatches {Boolean} keep track of all matched indexes in a subrule (default=false)
 */
function Rule (subrules, type, handler, options) {
  if ( !(this instanceof Rule) )
    return new Rule(subrules, type, handler, options)
  
  var self = this
  options = options || {}

  // Rule options
  // this.trimLeft = (options._trimLeft === true)
  // this.trimRight = (options._trimRight === true)
  // this.ignore = (options._ignore === true)
  // this.quiet = (options._quiet === true)
  // this.escape = (options._escape === true)
  this.trimLeft = options._trimLeft
  this.trimRight = options._trimRight
  this.ignore = options._ignore
  this.quiet = options._quiet
  this.escape = options._escape
  this.next = (typeof options._next === 'string') ? options._next : null

  this.bufferMode = (options._bufferMode === true)

  this.type = type || null
  this.handler = handler

  this.countStat = 0
  this.idx = -1
  this.token = ''

  // Instantiate all sub rules
  // var ctr = this.bufferMode ? SubRuleBuffer: SubRuleString
  this.rules = []
  for (var r, i = 0, n = subrules.length; i < n; i++) {
    r = SubRuleString(subrules[i], i, n, this)
    this.rules.push(r)
  }
  
  // Does the rule generate any token?
  this.noToken = (n == 1 && this.trimLeft && !this.rules[0].token) || this.quiet || this.ignore

  // Disable trimRight if only 1 rule
  if (this.rules.length == 1)
    this.trimRight = false

  // Filter out non rules
  this.rules = this.rules.filter(function (r, i) {
    var flag = typeof r.exec === 'function'
    // Disable left trimming if the first rule does not exist
    if (i == 0 && !flag) self.trimLeft = false
    return flag
  })
  // No rule left...will return all data
  if (this.rules.length == 0)
    this.test = this.all
}

Rule.prototype.all = function (data, offset) {
  this.token = data.substr(offset)
  return this.token.length
}
Rule.prototype.test = function (data, offset) {
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
    // console.log('subrule['+(i+1)+'/'+n+']', start, matched)
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)
    if (typeof matched !== 'number') { // Token was returned
      // console.log('=> TOKEN', matched)
      token = true
      matchedTotal += matched.length + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule
      // console.log('=> FAIL')
      return -1
    } else if (!token) { // Valid rule with no token
      if (i == 0) trimLeftSize = this.trimLeft ? firstRule.size : 0
      // console.log('=>', matched)
      matchedTotal += matched
      matched = matchedTotal
    } else { // Valid rule with token
      matchedForToken += matched
      matched = matchedForToken
    }
  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do

  if (!this.noToken && !token) {
    // By default, the token is stripped out from the left and last right patterns
    this.token = data.substr(
      offset + trimLeftSize
    , matchedTotal - ( trimLeftSize + (this.trimRight ? lastRule.size : 0) )
    )
  }

  this.countStat++
  // console.log('=> OK', matchedTotal)
  return matchedTotal
}