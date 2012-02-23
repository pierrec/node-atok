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

  var split = this.split
  var matches = []

  // Check rules:
  // all must be valid for the token to be extracted
  // token is either given by one of the rule or it is set by slice(0, matched)
  // where matched is the index of the last match 
  for (var i = 0; i < n; i++) {
    // Reminder: size is dynamic!
    matched = rule[i].exec(s, start + matched, matched - trimLeftSize)
//if(DEBUG)
    this.debug('subrule['
      + (this.type === null ? this.handler.name : this.type)
      + '] ' + (i+1) + '/' + n
      + ' ' + start + ' ' + matched
    )
//endif
//if(RULE_GENERATES_TOKEN)
    if (rule[i].token && matched !== -1) { // Set the token
//if(DEBUG)
      this.debug('=> TOKEN ' + matched)
//endif
      token = true
      matchedTotal += (matched.length || matched) + rule[i].size
       // Once a token is set, following rules are applied to it
      this.token = s = matched // Set the token and apply rules to it
      matched = 0
      start = 0
    } else if ( matched < 0 ) { // Invalid rule
//if(DEBUG)
        this.debug('=> FAIL')
//endif
      return -1
    } else if (!token) { // Valid rule with no token
//if(RULE_TRIMLEFT)
      if (i === 0) trimLeftSize = firstRule.size
//endif
//if(DEBUG)
      this.debug('=> ' + matched)
//endif
//if(RULE_SPLIT)
      matches.push(matched)
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
      this.debug('=> FAIL')
//endif
      return -1
    } else { // Valid rule
//if(RULE_TRIMLEFT)
      if (i === 0) trimLeftSize = firstRule.size
//endif
//if(DEBUG)
      this.debug('=> ' + matched)
//endif
//if(RULE_SPLIT)
      matches.push(matched)
//endif
      matchedTotal += matched
      matched = matchedTotal
    }
//endif
  }
  this.idx = lastRule.idx
  // 1 rule || no token extraction || ignore token -> nothing else to do

//if(!RULE_GENERATES_TOKEN)
//if(RULE_SPLIT)
      offset += trimLeftSize
      this.token = []
//if(DEBUG)
      this.debug('matches ' + matches)
//endif
      for (i = this.splitStart; i < n; i++) {
        // trimRight applies to all sub tokens
        var tokenLength = matches[i] - ( this.trimRight ? rule[i].size : 0 )
        this.token.push( data.substr( offset, tokenLength ) )
        offset += matches[i]
      }
//else
      var tokenLength = matchedTotal - ( trimLeftSize + (this.trimRight ? lastRule.size : 0) )
      this.token = this.noToken
        // Set the token to the size of what would have been extracted
        ? tokenLength
        // By default, the token is stripped out from the left and last right patterns
        : data.substr( offset + trimLeftSize, tokenLength )
//endif
//endif

  this.countStat++
//if(DEBUG)
  this.debug('=> OK ' + matchedTotal)
//endif
  return matchedTotal
}
