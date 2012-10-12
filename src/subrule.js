/**
  A subrule is defined as follow:
  subrule#exec(buffer, offset)
  @param buffer {Buffer|String} buffer to look for the match
  @param offset {Number} start looking at this offset, if < 0, then no match, return -1
  @return {Number} next offset (-1 if no match)

  subrule#next(buffer, offset)
  called from previous successful subrule
 */

var isArray = require('util').isArray
var buffertools = require('buffertools')

exports.lastSubRule = {
  length: 0
, test: function (buf, offset) {
    return offset
  }
}

//include("subrules/first/*.js")

/**
 * Return the type of an item
 * @param {...} item to check
 * @return {String} type
 */
function typeOf (rule) {
  var ruleType = typeof rule
  
  return ruleType !== 'object' || ruleType === 'function'
    ? ruleType
    : Buffer.isBuffer(rule)
      ? 'buffer'
      : !isArray(rule)
        ? 'object'
        : !rule.every(function (i) { return typeof rule[0] === typeof i })
          ? 'multi types array'
          : ((Buffer.isBuffer( rule[0] )
                ? 'buffer'
                : typeof rule[0]
              )
              + '_array'
            )
}

function toCodes (s) {
  return s.split('').map(function (c) {
    return c.charCodeAt(0)
  })
}

//TODO special case: loops

exports.firstSubRule = function (rule, props, encoding) {
  if (rule === null || rule === undefined)
    throw new Error('Tokenizer#addRule: Invalid rule ' + rule + ' (function/string/integer/array only)')

  var type = typeOf(rule)

  switch (type) {
    case 'function':
      return new function_SubRule(rule)

    case 'number':
      if (rule < 0)
        throw new Error('SubRule: Number cannot be negative: ' + rule)

      return new number_SubRule(rule)

    case 'string':
      return new buffer_firstSubRule( new Buffer(rule, encoding), toCodes(rule) )

    case 'buffer':
      return new buffer_firstSubRule( rule, toCodes( rule.toString(encoding) ) )

    // Arrays
    case 'function_array':
      return new function_arraySubRule(rule)

    case 'number_array':
      return new number_arraySubRule(rule)

    case 'string_array':
      return new buffer_array_firstSubRule(
        rule.map( function (i) { return new Buffer(i, encoding) } )
      , rule.map(toCodes)
      )

    case 'buffer_array':
      return new buffer_array_firstSubRule(
        rule
      , rule.map( function (i) { return toCodes( i.toString(encoding) ) } )
      )

  default:
      throw new Error('Tokenizer#addRule: Invalid rule ' + type + ' (function/string/integer/array only)')
  }
}

//include("subrules/*.js")

exports.SubRule = function (rule, props, encoding) {
  if (rule === null || rule === undefined)
    throw new Error('Tokenizer#addRule: Invalid rule ' + rule + ' (function/string/integer/array only)')

  var type = typeOf(rule)

  switch (type) {
    case 'function':
      return new function_SubRule(rule)

    case 'number':
      if (rule < 0)
        throw new Error('SubRule: Number cannot be negative: ' + rule)

      return new number_SubRule(rule)

    case 'string':
      return props.escape
        ? new buffer_escapedSubRule( new Buffer(rule, encoding), toCodes(rule), props.escape )
        : new buffer_SubRule( new Buffer(rule, encoding), toCodes(rule) )

    case 'buffer':
      return props.escape
        ? new buffer_escapedSubRule( rule, toCodes(rule.toString(encoding)), props.escape )
        : new buffer_SubRule( rule, toCodes(rule.toString(encoding)) )

    // Arrays
    case 'function_array':
      return new function_arraySubRule(rule)

    case 'number_array':
      return new number_arraySubRule(rule)

    case 'string_array':
      return new buffer_arraySubRule(
        rule.map( function (i) { return new Buffer(i, encoding) } )
      , rule.map(toCodes)
      )

    case 'buffer_array':
      return new buffer_arraySubRule(
        rule
      , rule.map( function (i) { return toCodes( i.toString(encoding) ) } )
      )

  default:
      throw new Error('Tokenizer#addRule: Invalid rule ' + type + ' (function/string/integer/array only)')
  }
}
function oldSubRule () {
  var toLoop = mainRule.ignore && mainRule.continue === -1 && !mainRule.next

  switch ( typeof rule ) {
    case 'string':
      if (rule.length === 0)
        return emptyRule
      if (rule.length === 1 && i === 0)
        return (toLoop
            ? new firstCharLoop_SubRule(rule)
            : new firstChar_SubRule(rule)
          )
      if (i === 0)
        return (toLoop
            ? new firstStringLoop_SubRule(rule)
            : new firstString_SubRule(rule)
          )
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
                return (toLoop
                    ? new firstSingleArrayLoop_SubRule(rule)
                    : new firstSingleArray_SubRule(rule)
                  )
              default:
                return (toLoop
                    ? new firstArrayLoop_SubRule(rule)
                    : new firstArray_SubRule(rule)
                  )
            }
          case 'function':
            if (rule.length === 1) break
            return new function_SubRule(rule)
          default:
            throw new Error('Invalid type in array: ' + type)
        }
      } else if ( i === 0 && rule.hasOwnProperty('start') && rule.hasOwnProperty('end') ) {
        if (rule.start.length !== rule.end.length)
          throw new Error('SubRule: start and end must be of same size: ' + rule.start + '/' + rule.end)

        return typeof rule.start === 'number'
            || (typeof rule.start === 'string' && rule.start.length === 1)
          ? (toLoop
              ? new startendNumberSingleRangeLoop_SubRule(rule.start, rule.end)
              : new startendNumberSingleRange_SubRule(rule.start, rule.end)
            )
          : (toLoop
              ? new startendSingleRangeLoop_SubRule(rule.start, rule.end)
              : new startendSingleRange_SubRule(rule.start, rule.end)
            )

      } else if ( i === 0 && rule.hasOwnProperty('start') && !rule.hasOwnProperty('end') ) {
        return typeof rule.start === 'number'
            || (typeof rule.start === 'string' && rule.start.length === 1)
          ? (toLoop
              ? new startNumberSingleRangeLoop_SubRule(rule.start)
              : new startNumberSingleRange_SubRule(rule.start)
            )
          : (toLoop
              ? new startSingleRangeLoop_SubRule(rule.start)
              : new startSingleRange_SubRule(rule.start)
            )

      } else if ( i === 0 && !rule.hasOwnProperty('start') && rule.hasOwnProperty('end') ) {
        return typeof rule.end === 'number'
            || (typeof rule.end === 'string' && rule.end.length === 1)
          ? (toLoop
              ? new endNumberSingleRangeLoop_SubRule(rule.end)
              : new endNumberSingleRange_SubRule(rule.end)
            )
          : (toLoop
              ? new endSingleRangeLoop_SubRule(rule.end)
              : new endSingleRange_SubRule(rule.end)
            )

      } else if ( rule.hasOwnProperty('firstOf') && ( isArray( rule.firstOf ) || typeof rule.firstOf === 'string' ) ) {
        if (rule.firstOf.length < 2)
          throw new Error('Tokenizer#addRule: Invalid Array size for firstOf (must be >= 2): ' + rule.firstOf.length)

        if ( !isArray( rule.firstOf ) ) rule.firstOf = rule.firstOf.split('')
        if (mainRule.escape === false) {
          if (i !== (n-1))
            return new firstOf_SubRule(rule.firstOf)
          // Last subrule, reuse the extracted token set by the subrule
          if (mainRule.trimRight)
            return new tokenizedFirstOf_SubRule(rule.firstOf)

          return new tokenizedNoTrimFirstOf_SubRule(rule.firstOf)
        }
        if (i !== (n-1))
            return new escapedFirstOf_SubRule(rule.firstOf, mainRule.escape)
          // Last subrule, reuse the extracted token set by the subrule
          if (mainRule.trimRight)
            return new escapedTokenizedFirstOf_SubRule(rule.firstOf, mainRule.escape)

          return new escapedTokenizedNoTrimFirstOf_SubRule(rule.firstOf, mainRule.escape)
      }
  }

  // Special case: user provided subrule function - can only return an integer
  if ( !(this instanceof SubRule) )
    return new SubRule(rule, i, n, mainRule)

  this.length = -1     // First subrule pattern length (max of all patterns if many)
  this.size = 0       // Last matched pattern length
  this.idx = -1       // If array rule, matched index
  this.token = false  // Cannot generate a token
  switch ( typeof rule ) {
    case 'function':
      this.exec = rule
      break
    default:
      throw new Error('Tokenizer#addRule: Invalid rule ' + typeof(rule) + ' (function/string/integer/array only)')
  }
}
