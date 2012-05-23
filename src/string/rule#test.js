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
//if(DEBUG)
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
//endif
//if(RULE_GENERATES_TOKEN)
    if (rule[i].token && matched !== -1) { // Set the token
//if(DEBUG)
      this.atok.emit_debug('Rule#test', 'token', [ matched ])
//endif
      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule
//if(DEBUG)
  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, -1 ])
//endif
      return -1
    } else if (!token) { // Valid rule with no token
//if(RULE_TRIMLEFT)
      if (i === 0) trimLeftSize = firstRule.size
//endif
      matchedTotal += matched
      matched = matchedTotal
    } else { // Valid rule with token
      matchedForToken += matched
      matched = matchedForToken
    }
//else
    if ( matched < 0 ) { // Invalid rule
//if(DEBUG)
  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, -1 ])
//endif
      return -1
    } else { // Valid rule
//if(RULE_TRIMLEFT)
      if (i === 0) trimLeftSize = firstRule.size
//endif
      matchedTotal += matched
      matched = matchedTotal
    }
//endif
  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do

//if(!RULE_GENERATES_TOKEN)
//if(RULE_TRIMRIGHT)
      var tokenLength = matchedTotal - trimLeftSize - lastRule.size
//else
      var tokenLength = matchedTotal - trimLeftSize
//endif
      this.token = this.noToken
        // Set the token to the size of what would have been extracted
        ? tokenLength
        // By default, the token is stripped out from the left and last right patterns
        : this.emptyToken ? '' : data.substr( offset + trimLeftSize, tokenLength )
//endif

//if(DEBUG)
  this.atok.emit_debug('Rule#test', 'subrule-END', [ offset, matchedTotal ])
//endif
  return matchedTotal
}
