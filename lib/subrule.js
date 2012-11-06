/**
  A subrule is defined as follow:
  subrule#test(buffer, offset)
  @param buffer {Buffer|String} buffer to look for the match
  @param offset {Number} start looking at this offset, if < 0, then no match, return -1
  @return {Number} next offset (-1 if no match)

  subrule#next(buffer, offset)
  called by subrule#test if successful
  
  Required properties:
  length {Number} length of the matched data. Set when running the subrule if 
                the value is non zero.
                Special values:
                -1: unknown, ignore in infinite loop detection
                -2: unknown, check in infinite loop detection
  idx {Number} index of the matched pattern if many possible. Default=-1
 */
//TODO special case: loops

var isArray = require('util').isArray
var buffertools = require('buffertools')

/**
  Last subrule
 */
function lastSubRuleConst () {
  this.length = 0
  this.idx = -1
}
lastSubRuleConst.prototype.test = function (buf, offset) {
  return offset
}

var lastSubRule = new lastSubRuleConst

/**
  Empty subrule
 */
exports.emptySubRule = lastSubRule

/**
  All subrule
  To trick infinite loop detection, length is set to -1 then 1
  to compensate for trimRight and trimLeft
 */
function allSubRuleConst () {
  this.length = 0
  this.idx = -1
  this.next = lastSubRule
}
allSubRuleConst.prototype.test = function (buf) {
  return buf.length
}
exports.allSubRule = new allSubRuleConst

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

// include("subrules/first/buffer.js")
function buffer_firstSubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var n = isString ? this.str.length : this.buf.length

	if (buf.length < offset + n) return -1

	if (isString) {
		for (var p = this.str, i = 0; i < n; i++) {
			if ( buf.charCodeAt(offset+i) !== p[i] ) return -1
		}
	} else {
		for (var p = this.buf, i = 0; i < n; i++) {
			if ( buf[offset+i] !== p[i] ) return -1
		}
	}
	if (this.length > 0) this.length = n

	return this.next.test(buf, offset + n)
}// include("subrules/first/buffer_array.js")
function buffer_array_firstSubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_array_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf

	if (isString) {
		for (var j = 0, len = list.length; j < len; j++) {
			var p = list[j]
			var n = p.length

			if (buf.length < offset + n) continue

			for (var i = 0; i < n; i++) {
				if ( buf.charCodeAt(offset+i) !== p[i] ) break
			}

			if (i === n) {
				if (this.length > 0) this.length = n
				this.idx = j

				return this.next.test(buf, offset + n)
			}
		}
	} else {
		for (var j = 0, len = list.length; j < len; j++) {
			var p = list[j]
			var n = p.length

			if (buf.length < offset + n) continue

			for (var i = 0; i < n; i++) {
				if ( buf[offset+i] !== p[i] ) break
			}

			if (i === n) {
				if (this.length > 0) this.length = n
				this.idx = j

				return this.next.test(buf, offset + n)
			}
		}
	}

	return -1
}// include("subrules/first/range_array_object.js")
function range_array_object_firstSubRule (start, end) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.start = start
	this.end = end
}

range_array_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var start = this.start
	var end = this.end
	var n = start.length // Same length as this.end

	if (isString) {
		for (var i = 0; i < n; i++) {
			if (
				buf.charCodeAt(offset) >= start[i]
			&&	buf.charCodeAt(offset) <= end[i]
			) {
				this.idx = i
				return this.next.test(buf, offset + 1)
			}
		}
	} else {
		for (var i = 0; i < n; i++) {
			if (
				buf[offset] >= start[i]
			&&	buf[offset] <= end[i]
			) {
				this.idx = i
				return this.next.test(buf, offset + 1)
			}
		}
	}

	return -1
}// include("subrules/first/range_object.js")
function range_object_firstSubRule (start, end) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.start = start
	this.end = end
}

range_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'

	if (isString) {
		if (
			buf.charCodeAt(offset) < this.start
		||	buf.charCodeAt(offset) > this.end
		)
			return -1
	} else {
		if (
			buf[offset] < this.start
		||	buf[offset] > this.end
		)
			return -1
	}

	return this.next.test(buf, offset + 1)
}// include("subrules/first/rangeend_array_object.js")
function rangeend_array_object_firstSubRule (end) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.end = end
}

rangeend_array_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var end = this.end
	var n = end.length

	if (isString) {
		for (var i = 0; i < n; i++) {
			if (
				buf.charCodeAt(offset) <= end[i]
			) {
				this.idx = i
				return this.next.test(buf, offset + 1)
			}
		}
	} else {
		for (var i = 0; i < n; i++) {
			if (
				buf[offset] >= end[i]
			) {
				this.idx = i
				return this.next.test(buf, offset + 1)
			}
		}
	}

	return -1
}// include("subrules/first/rangeend_object.js")
function rangeend_object_firstSubRule (end) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.end = end
}

rangeend_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'

	if (isString) {
		if (
			buf.charCodeAt(offset) > this.end
		)
			return -1
	} else {
		if (
			buf[offset] > this.end
		)
			return -1
	}

	return this.next.test(buf, offset + 1)
}// include("subrules/first/rangestart_array_object.js")
function rangestart_array_object_firstSubRule (start) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.start = start
}

rangestart_array_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var start = this.start
	var n = start.length

	if (isString) {
		for (var i = 0; i < n; i++) {
			if (
				buf.charCodeAt(offset) >= start[i]
			) {
				this.idx = i
				return this.next.test(buf, offset + 1)
			}
		}
	} else {
		for (var i = 0; i < n; i++) {
			if (
				buf[offset] >= start[i]
			) {
				this.idx = i
				return this.next.test(buf, offset + 1)
			}
		}
	}

	return -1
}// include("subrules/first/rangestart_object.js")
function rangestart_object_firstSubRule (start) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.start = start
}

rangestart_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'

	if (isString) {
		if (
			buf.charCodeAt(offset) < this.start
		)
			return -1
	} else {
		if (
			buf[offset] < this.start
		)
			return -1
	}

	return this.next.test(buf, offset + 1)
}
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
                    ? (( (isArray(rule.firstOf) && sameTypeArray(rule.firstOf) )
                        || typeof rule.firstOf === 'string'
                        )
                      && rule.firstOf.length > 1
                      )
                        ? 'firstof'
                        : 'invalid firstof'
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
  return typeof list === 'string'
    ? [
        list.split('')
      , list.split('').map( function (i) { return new Buffer(i, encoding) } )
      ]
    : typeof list[0] === 'string'
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

  // var loop = props.ignore && props.continue[0] === -1 && !props.next[0] ? '_loop' : ''
  // var type = typeOf(rule) + loop
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

// include("subrules/buffer.js")
function buffer_SubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
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
}// include("subrules/buffer_array.js")
function buffer_arraySubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_arraySubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf

	for (var j = 0, len = list.length; j < len; j++) {
		var p = list[j]
		var n = p.length

		if (buf.length < offset + n) continue

		var i = buf.indexOf(p, offset)

		if (i >= 0) {
			if (this.length > 0) this.length = n
			this.idx = j

			return this.next.test(buf, i + n)
		}
	}

	return -1
}// include("subrules/buffer_escaped.js")
function buffer_escapedSubRule (buf, str, esc) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
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
}// include("subrules/buffer_escaped_array.js")
function buffer_escaped_arraySubRule (buf, str, esc) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.buf = buf
	this.str = str
	this.esc = esc.charCodeAt(0)
}

buffer_escaped_arraySubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf
	var len = buf.length

	for (var j = 0, num = list.length; j < num; j++) {
		var p = list[j]
		var n = p.length

		if (buf.length < offset + n) continue

		var i = -1

		if (isString) {
			while (offset < len) {
				i = buf.indexOf(p, offset)
				if (i < 0) break

				for (var esc_i = i, esc_num = 0; esc_i > 0 && buf.charCodeAt(--esc_i) === this.esc; esc_num++) {}

				if ( (esc_num % 2) === 0 ) {
					if (this.length > 0) this.length = n
					this.idx = j

					return this.next.test(buf, i + n)
				}

				offset = i + 1
			}
		} else {
			while (offset < len) {
				i = buf.indexOf(p, offset)
				if (i < 0) break

				for (var esc_i = i, esc_num = 0; esc_i > 0 && buf[--esc_i] === this.esc; esc_num++) {}

				if ( (esc_num % 2) === 0 ) {
					if (this.length > 0) this.length = n
					this.idx = j

					return this.next.test(buf, i + n)
				}

				offset = i + 1
			}
		}
	}

	return -1
}// include("subrules/firstof.js")
function firstof_object_SubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.buf = buf
	this.str = str
}

firstof_object_SubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf

	var _buf = buf
	var _offset = offset
	var pattern
	this.idx = -1

	for (var j = 0, len = list.length; j < len; j++) {
		var p = list[j]
		var i = _buf.indexOf( p, _offset )

		if (i >= 0) {
			pattern = p
			if (this.length > 0) this.length = p.length
			this.idx = j

			_buf = _buf.slice(_offset, i)
			_offset = 0
		}
	}

	if (this.idx < 0) return -1

	return this.next.test(buf, offset + _buf.length + pattern.length)
}// include("subrules/firstof_escaped.js")
function firstof_escaped_object_SubRule (buf, str, esc) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.buf = buf
	this.str = str
	this.esc = esc.charCodeAt(0)
}

firstof_escaped_object_SubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf

	var _buf = buf
	var _offset = offset
	var pattern
	var from = offset
	var n = buf.length
	this.idx = -1

	if (isString) {
		for (var j = 0, len = list.length; j < len && from < n; j++) {
			var p = list[j]
			var i = _buf.indexOf( p, from )

			if (i >= 0) {
				// Look for escape char
				for (var esc_i = i, esc_num = 0; esc_i > 0 && _buf.charCodeAt(--esc_i) === this.esc; esc_num++) {}

				if ( (esc_num % 2) === 0 ) {
					pattern = p
					if (this.length > 0) this.length = p.length
					this.idx = j

					_buf = _buf.slice(_offset, i)
					_offset = 0
				} else {
					// Escaped: ignore this match
					from++
				}
			}
		}
	} else {
		for (var j = 0, len = list.length; j < len && from < n; j++) {
			var p = list[j]
			var i = _buf.indexOf( p, from )

			if (i >= 0) {
				// Look for escape char
				for (var esc_i = i, esc_num = 0; esc_i > 0 && _buf[--esc_i] === this.esc; esc_num++) {}

				if ( (esc_num % 2) === 0 ) {
					pattern = p
					if (this.length > 0) this.length = p.length
					this.idx = j

					_buf = _buf.slice(_offset, i)
					_offset = 0
				} else {
					// Escaped: ignore this match
					from++
				}
			}
		}
	}

	if (this.idx < 0) return -1

	return this.next.test(buf, offset + _buf.length + pattern.length)
}// include("subrules/function.js")
function function_SubRule (fn) {
	// Common properties
	this.idx = -1
	this.length = -2
	this.next = lastSubRule
	// Specific properties
	this.fn = fn
}

function_SubRule.prototype.test = function (buf, offset) {
	var res = this.fn.call(this, buf, offset)

	if (typeof res !== 'number' || res < 0) return -1

	this.length = res

	return	this.next.test(buf, offset + res)
}// include("subrules/function_array.js")
function function_arraySubRule (list) {
	// Common properties
	this.idx = -1
	this.length = -2
	this.next = lastSubRule
	// Specific properties
	this.list = list
}

function_arraySubRule.prototype.test = function (buf, offset) {
	var list = this.list

	for (var i = 0, n = list.length; i < n; i++) {
		var res = list[i].call(this, buf, offset)
		if (typeof res === 'number' && res >= 0) {
			this.idx = i
			if (this.length !== 0) this.length = res

			return this.next.test(buf, offset + res)
		}
	}

	return -1
}// include("subrules/noop.js")
function noop_SubRule () {
	// Common properties
	this.idx = -1
	this.length = 0
	this.next = lastSubRule
}

noop_SubRule.prototype.test = function (buf, offset) {
	return this.next.test(buf, offset)
}// include("subrules/number.js")
function number_SubRule (n) {
	// Common properties
	this.idx = -1
	this.length = n
	this.next = lastSubRule
	// Specific properties
	this.n = n
}

number_SubRule.prototype.test = function (buf, offset) {
  return offset + this.n <= buf.length
  	? this.next.test(buf, offset + this.n)
  	: -1
}// include("subrules/number_array.js")
function number_arraySubRule (list) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	// Filter out zero values
	this.list = list.filter(function (v) { return v !== 0 })
	this.hasZero = (list.length > this.list.length)
}

number_arraySubRule.prototype.test = function (buf, offset) {
	var list = this.list
	var delta = buf.length - offset

	if (delta === 0) return this.hasZero ? this.next.test(buf, offset) : -1

	for (var i = 0, len = list.length; i < len; i++) {
		if ( list[i] <= delta ) {
			if (this.length > 0) this.length = list[i]
			this.idx = i

			return this.next.test(buf, offset + list[i])
		}
	}

	return -1
}// include("subrules/zero.js")
function zero_SubRule () {
	// Common properties
	this.idx = -1
	this.length = 0
	this.next = lastSubRule
}

zero_SubRule.prototype.test = function (buf, offset) {
  return offset === buf.length
  	? this.next.test(buf, offset)
  	: -1
}
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
