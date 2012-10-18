/**
  A subrule is defined as follow:
  subrule#test(buffer, offset)
  @param buffer {Buffer|String} buffer to look for the match
  @param offset {Number} start looking at this offset, if < 0, then no match, return -1
  @return {Number} next offset (-1 if no match)

  subrule#next(buffer, offset)
  called by subrule#test if successful
  
  Required properties:
  length {Number} length of the matched data. If unknown: -1. Set it when 
                  running the subrule if the value is non zero.
  idx {Number} index of the matched pattern if many possible. Default=-1
 */
//TODO special case: loops
//TODO rule === 0

var isArray = require('util').isArray
var buffertools = require('buffertools')

/**
  Last subrule
 */
var lastSubRule = {
  length: 0
, test: function (buf, offset) {
    return offset
  }
}

/**
  Empty subrule
 */
exports.emptySubRule = {
  length: 0
, idx: -1
, test: lastSubRule.test
, next: lastSubRule
}

/**
  All subrule
  To trick infinite loop detection, length is set to -1 then 1
  to compensate for trimRight and trimLeft
 */
exports.allSubRule = {
  length: 0
, idx: -1
, test: function (buf, offset) {
    return buf.length
  }
, next: lastSubRule
}

/**
  Property checker
  @param {Object} object to check on
  @param {String} property to be checked
  @return {Boolean}
 */
var _has = Object.prototype.hasOwnProperty
function has (o, prop) {
  return typeof o === 'object' && _has.call(o, prop)
}

//include("subrules/first/*.js")

function sameTypeArray (list) {
  return list.every(function (i) { return typeof list[0] === typeof i })
}

/**
 * Return the type of an item
 * @param {...} item to check
 * @return {String} type
 */
function typeOf (rule) {
  var ruleType = typeof rule
  
  return ruleType === 'function'
    ? ruleType
    : ruleType !== 'object'
      ? (rule.length === 0
          ? 'noop'
          : (rule === 0
              ? 'zero'
              : ruleType
            )
        )
      : Buffer.isBuffer(rule)
        ? 'buffer'
        : !isArray(rule)
          ? ((has(rule, 'start') && has(rule, 'end')
              ? 'range'
              : has(rule, 'start')
                ? 'rangestart'
                : has(rule, 'end')
                  ? 'rangeend'
                  : has(rule, 'firstOf')
                    ? (isArray(rule.firstOf) && rule.firstOf.length > 1
                          && sameTypeArray(rule.firstOf)
                        ? 'firstof'
                        : 'invalid firstof'
                      )
                    : 'invalid'
              )
              + '_object'
            )
          : !sameTypeArray(rule)
            ? 'multi types array'
            : ((Buffer.isBuffer( rule[0] )
                ? 'buffer'
                : typeof rule[0]
                )
                + '_array'
              )
}

function stringCode (c) {
  return c.charCodeAt(0)
}

function toCodes (s) {
  return s.split('').map(stringCode)
}

function toRanges (list) {
  return typeof list === 'string'
    ? (list.length === 1
        ? stringCode(list)
        : list.split('').map(stringCode)
      )
    : isArray(list)
      ? list.map(stringCode)
      : typeof list === 'number'
        ? list
        //TODO only strings and numbers supported
        : ''
}

function toFirstOf (list, encoding) {
  return typeof list[0] === 'string'
    ? [
        list.map( function (i) { return new Buffer(i, encoding) } )
              // Filter out empty values
            .filter(function (i) { return i.length > 0 })
      , list
      ]
    : Buffer.isBuffer(list[0])
      ? [
          list
        , list.map( function (i) { return i.toString(encoding) } )
              // Filter out empty values
              .filter(function (i) { return i.length > 0 })
        ]
      : []
}

exports.firstSubRule = function (rule, props, encoding) {
  if (rule === null || rule === undefined)
    throw new Error('Tokenizer#addRule: Invalid rule ' + rule + ' (function/string/integer/array only)')

  var type = typeOf(rule)

  switch (type) {
    case 'zero':
      return new zero_SubRule

    case 'noop':
      return new noop_SubRule

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
      return rule.length > 0
        ? new buffer_array_firstSubRule(
            rule
          , rule.map( function (i) { return toCodes( i.toString(encoding) ) } )
          )
        : null

    // {start, end}
    case 'range_object':
      var start = toRanges(rule.start)
      var end = toRanges(rule.end)

      // Force the start or end
      if (typeof start === 'number' && typeof end !== 'number') end = end[0]
      if (typeof end === 'number' && typeof start !== 'number') start = start[0]

      if (typeof start === 'number')
        return new range_object_firstSubRule(start, end)

      if (start.length === 0 || start.length !== end.length)
        throw new Error('Tokenizer#addRule: Invalid Range: bad sizes: '
          + ' start=' + start.length
          + ' end=' + end.length
        )

      return new range_array_object_firstSubRule(start, end)

    case 'rangestart_object':
      var start = toRanges(rule.start)

      if (typeof start === 'number')
        return new rangestart_object_firstSubRule(start)

      if (start.length === 0)
        throw new Error('Tokenizer#addRule: Invalid Range: empty start')

      return new rangestart_array_object_firstSubRule(start)

    case 'rangeend_object':
      var end = toRanges(rule.end)

      if (typeof end === 'number')
        return new rangeend_object_firstSubRule(end)

      if (end.length === 0)
        throw new Error('Tokenizer#addRule: Invalid Range: empty end')

      return new rangeend_array_object_firstSubRule(end)

  case 'firstof_object':
      throw new Error('Tokenizer#addRule: firstOf subrule not supported as first subrule')

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
    case 'zero':
      return new zero_SubRule

    case 'noop':
      return new noop_SubRule

    case 'function':
      return new function_SubRule(rule)

    case 'number':
      if (rule < 0)
        throw new Error('SubRule: Number cannot be negative: ' + rule)

      return new number_SubRule(rule)

    case 'string':
      return new ( props.escape ? buffer_escapedSubRule : buffer_SubRule )
        ( new Buffer(rule, encoding), rule, props.escape )

    case 'buffer':
      return new ( props.escape ? buffer_escapedSubRule : buffer_SubRule )
        ( rule, rule.toString(encoding), props.escape )

    // Arrays
    case 'function_array':
      return new function_arraySubRule(rule)

    case 'number_array':
      return new number_arraySubRule(rule)

    case 'string_array':
      return new ( props.escape ? buffer_escaped_arraySubRule : buffer_arraySubRule )
      (
        rule.map( function (i) { return new Buffer(i, encoding) } )
      , rule
      , props.escape
      )

    case 'buffer_array':
      return new ( props.escape ? buffer_escaped_arraySubRule : buffer_arraySubRule )
      (
        rule
      , rule.map( function (i) { return i.toString(encoding) } )
      , props.escape
      )

    // {firstof}
    case 'firstof_object':
      var firstof = toFirstOf(rule.firstOf, encoding)

      if (firstof.length === 0)
        throw new Error('Tokenizer#addRule: Invalid firstOf')

      return new ( props.escape ?  firstof_escaped_object_SubRule : firstof_object_SubRule)
        ( firstof[0], firstof[1], props.escape )

  default:
      throw new Error('Tokenizer#addRule: Invalid rule ' + type + ' (function/string/integer/array only)')
  }
}
