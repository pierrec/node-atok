/*
 * class SubRule
 *
 * SubRule for stream based tokenizer Rule
 *
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
**/
module.exports = SubRule

var isArray = require('util').isArray

var emptyRule = { token: true, exec: null }

//include("utils.js", "*_SubRule.js")

function SubRule (rule, i, n, mainRule) {
  switch ( typeof rule ) {
    case 'number':
      if (rule < 0)
        throw new Error('SubRule: Number cannot be negative: ' + rule)
      return rule === 0
        ? new zero_SubRule(rule)
        // Do not extract token if noToken and last subrule
        : mainRule.noToken && i === (n-1)
          ? new numberNoToken_SubRule(rule)
          : new number_SubRule(rule)
    case 'string':
      if (rule.length === 0)
        return emptyRule
      if (rule.length === 1 && i === 0)
        return new firstChar_SubRule(rule)
      if (i === 0)
        return new firstString_SubRule(rule)
      if (mainRule.escape === false)
        return new string_SubRule(rule)
      return new escapedString_SubRule(rule, mainRule.escape)
    case 'object':
      if ( isArray(rule) ) {
        if (rule.length === 0)
          return emptyRule
        // Arrays must be of same type
        var type = typeof rule[0]
        if ( !rule.every(function (i) { return type === typeof i }) )
          throw new Error('SubRule: all array items must be of same type: ' + rule.join(','))

        switch( type ) {
          case 'number':
            if (i === 0)
              return new numberArray_SubRule(rule)
            throw new Error('SubRule: unsupported number list as nth ' + i + ' rule: ' + rule)
          case 'string':
            if (i > 0)
              return new stringArray_SubRule(rule)
            // All items of same size?
            switch ( getArrayItemsSize(rule) ) {
              case 0:
                return emptyRule
              case 1:
                return new firstSingleArray_SubRule(rule)
              default:
                return new firstArray_SubRule(rule)
            }
        }
      } else if ( i === 0 && rule.hasOwnProperty('start') && rule.hasOwnProperty('end') ) {
        if (rule.start.length != rule.end.length)
          throw new Error('SubRule: start and end must be of same size: ' + rule.start + '/' + rule.end)

        return typeof rule.start === 'number'
            || (typeof rule.start === 'string' && rule.start.length === 1)
          ? new startendNumberSingleRange_SubRule(rule.start, rule.end)
          : new startendSingleRange_SubRule(rule.start, rule.end)

      } else if ( i === 0 && rule.hasOwnProperty('start') && !rule.hasOwnProperty('end') ) {
        return typeof rule.start === 'number'
            || (typeof rule.start === 'string' && rule.start.length === 1)
          ? new startNumberSingleRange_SubRule(rule.start)
          : new startSingleRange_SubRule(rule.start)

      } else if ( i === 0 && !rule.hasOwnProperty('start') && rule.hasOwnProperty('end') ) {
        return typeof rule.end === 'number'
            || (typeof rule.end === 'string' && rule.end.length === 1)
          ? new endNumberSingleRange_SubRule(rule.end)
          : new endSingleRange_SubRule(rule.end)

      } else if ( rule.hasOwnProperty('firstOf') && isArray( rule.firstOf ) ) {
        if (rule.firstOf.length < 2)
          throw new Error('Tokenizer#addRule: Invalid Array size for firstOf (must be >= 2): ' + rule.firstOf.length)

        if (i !== (n-1))
          return new firstOf_SubRule(rule.firstOf)
        // Last subrule, reuse the extracted token set by the subrule
        if (mainRule.trimRight)
          return new tokenizedFirstOf_SubRule(rule.firstOf)

        return new tokenizedNoTrimFirstOf_SubRule(rule.firstOf)
      }
  }

  // Special case: user provided subrule function - can only return an integer
  if ( !(this instanceof SubRule) )
    return new SubRule(rule, i, n, mainRule)

  this.size = 0 // Last matched pattern length
  this.idx = -1 // If array rule, matched index
  switch ( typeof rule ) {
    case 'function':
      this.exec = rule
      break
    default:
      throw new Error('Tokenizer#addRule: Invalid rule ' + typeof(rule) + ' (function/string/integer/array only)')
  }
}
