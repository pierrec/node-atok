/**
  A subrule is defined as follow:
  subrule#exec(buffer, offset)
  @param buffer {Buffer|String} buffer to look for the match
  @param offset {Number} start looking at this offset, if < 0, then no match, return -1
  @return {Number} next offset (-1 if no match)

  subrule#next(buffer, offset)
  called from previous successful subrule
 */

var buffertools = require('buffertools')

exports.lastSubRule = {
  length: 0
, test: function (buf, offset) {
    return offset
  }
}

// include("subrules/first/buffer.js")
function buffer_firstSubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = null
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var n = isString ? this.str.length : this.buf.length

	if (buf.length < offset + n) return -1

	if (isString) {
		for (var p = this.buf, i = 0; i < n; i++) {
			if ( buf.charCodeAt(offset+i) !== p[i] ) return -1
		}
	} else {
		for (var p = this.buf, i = 0; i < n; i++) {
			if ( buf[offset+i] !== p[i] ) return -1
		}
	}
	if (this.length > 0) this.length = n

	return this.next.test(buf, offset + n)
}
function typeOf (rule) {
  var ruleType = typeof rule
  
  return ruleType !== 'object' || ruleType === 'function'
    ? ruleType
    : Buffer.isBuffer(rule)
      ? 'buffer'
      : util.isArray(rule)
        ? 'array'
        : 'object'
}

exports.firstSubRule = function (rule, props, encoding) {
  if (rule === null || rule === undefined)
    throw new Error('Tokenizer#addRule: Invalid rule ' + rule + ' (function/string/integer/array only)')

  switch ( typeOf(rule) ) {
    case 'number':
      if (rule < 0)
        throw new Error('SubRule: Number cannot be negative: ' + rule)

      return new number_SubRule(rule)
    case 'string':
      return new buffer_firstSubRule( new Buffer(rule, encoding), rule)
    case 'buffer':
      return new buffer_firstSubRule( rule, rule.toString(encoding) )
  default:
      throw new Error('Tokenizer#addRule: Invalid rule ' + typeOf(rule) + ' (function/string/integer/array only)')
  }
}

// include("subrules/buffer.js")
function buffer_SubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = null
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_SubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var n = isString ? this.str.length : this.buf.length

	if (buf.length < offset + n) return -1

	var i = buf.indexOf( isString ? this.str : this.buf, offset)

	if (this.length > 0) this.length = n

	return i < 0 ? -1 : this.next.test(buf, i + n)
}// include("subrules/buffer_escaped.js")
function buffer_escapedSubRule (buf, str, esc) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = null
	// Specific properties
	this.buf = buf
	this.str = str
	this.esc = esc.charCodeAt(0)
}

buffer_escapedSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var n = isString ? this.str.length : this.buf.length

	if (buf.length < offset + n) return -1

	var i = -1
	var len = buf.length

	if (isString) {
		while (offset < len) {
			i = buf.indexOf(this.str, offset)
			if (i <= 0) break

			for (var esc_i = i, esc_num = 0; esc_i > 0 && buf.charCodeAt(--esc_i) === this.esc; esc_num++) {}

			if ( (esc_num % 2) === 0 ) return this.next.test(buf, i + n)
			offset = i + 1
		}
	} else {
		while (offset < len) {
			i = buf.indexOf(this.buf, offset)
			if (i <= 0) break

			for (var esc_i = i, esc_num = 0; esc_i > 0 && buf[--esc_i] === this.esc; esc_num++) {}

			if ( (esc_num % 2) === 0 ) return this.next.test(buf, i + n)
			offset = i + 1
		}
	}

	if (this.length > 0) this.length = n

	return i < 0 ? -1 : this.next.test(buf, n)
}// include("subrules/number.js")
function number_SubRule (n) {
	// Common properties
	this.idx = -1
	this.length = n
	this.next = null
	// Specific properties
	this.n = n
}

number_SubRule.prototype.test = function (buf, offset) {
  return offset + this.n <= buf.length
  	? this.next.test(buf, offset + this.n)
  	: -1
}
exports.SubRule = function (rule, props, encoding) {
  if (rule === null || rule === undefined)
    throw new Error('Tokenizer#addRule: Invalid rule ' + rule + ' (function/string/integer/array only)')

  switch ( typeOf(rule) ) {
    case 'number':
      if (rule < 0)
        throw new Error('SubRule: Number cannot be negative: ' + rule)

      return new number_SubRule(rule)
    case 'string':
      return props.escape
        ? new buffer_escapedSubRule( new Buffer(rule, encoding), rule, props.escape )
        : new buffer_SubRule( new Buffer(rule, encoding), rule)
    case 'buffer':
      return props.escape
        ? new buffer_escapedSubRule( rule, rule.toString(encoding), props.escape )
        : new buffer_SubRule( rule, rule.toString(encoding) )
  default:
      throw new Error('Tokenizer#addRule: Invalid rule ' + typeOf(rule) + ' (function/string/integer/array only)')
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
