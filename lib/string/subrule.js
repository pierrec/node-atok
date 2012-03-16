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

// include("utils.js")
/*
 Convert a value to an array of char codes
**/
function toCharCodes (v) {
  var res

  switch (typeof v) {
    case 'number':
      return v
    case 'string':
      if (v.length === 0)
        throw new Error('SubRule: Empty value')
      
      res = stringToCharCodes( [v] )
      break
    default:
      if ( !isArray(v) )
        throw new Error('SubRule: Invalid value (not number/string/array)')
      
      res = stringToCharCodes( v )
  }

  return res.length > 1 ? res: res[0]
}

/*
 Convert an array of strings into an array of char codes
**/
function stringToCharCodes (arr, forceArray) {
  return arr.map(function (s) {
    return s.length > 1
      ? s.split('').map(function (c) { return c.charCodeAt(0) })
      : forceArray
        ? [ s.charCodeAt(0) ]
        : s.charCodeAt(0)
    })
}

/*
 Check items of a string array are of the same size and return it
**/
function getArrayItemsSize (arr) {
  var n = arr.length

  if (n === 0) return -1

  var size = arr[0].length
    , i = 0

  while ( ++i < n )
    if ( arr[i].length !== size ) return -1

  return size
}
// include("endNumberSingleRange_SubRule.js")
function endNumberSingleRange_SubRule (end) {
	this.size = 1
	this.idx = -1
	this.end = toCharCodes(end)
	this.token = false
}

endNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	return s.charCodeAt(start) <= this.end ? 1 : -1
}

// include("endSingleRange_SubRule.js")
function endSingleRange_SubRule (end) {
	this.size = 1
	this.idx = -1
	this.end = toCharCodes(end)
	this.token = false
}

endSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	var l = this.end
	for (var i = 0, n = l.length; i < n; i++)
		if (c <= l[i]) return 1
	return -1
}

// include("escapedFirstOf_SubRule.js")
function escapedFirstOf_SubRule (list, esc) {
	this.size = 0
	this.idx = -1
	this.n = list.length
	this.list = list
	this.token = false
	this.esc = esc.charCodeAt(0)
}

escapedFirstOf_SubRule.prototype.exec = function (s, start) {
	var firstSize = 0

	// include("firstOf_loop_escaped.js")
// var buf = s
var offset = start - firstSize // Include the first rule pattern
var l = this.list
var res = -1

this.size = 0

// Check all patterns
for (var i, j = 0, n = this.n; j < n && res !== firstSize; j++) {
	i = s.indexOf( l[j], offset + firstSize ) // TODO indexOf
	if (i > 0) {
		// include("check_escaped.js")
// i: index to start at
// s: string to check
//=>provide an if condition
// Check escaped pattern - '\\'.charCodeAt(0) === 92
for (var esc_i = i, esc_num = 0; esc_i > 0 && s.charCodeAt(--esc_i) === this.esc; esc_num++) {}
if ( (esc_num % 2) === 0 )		{
			// include("firstOf_found.js")
this.size = l[j].length - firstSize
this.idx = j
res = i - offset
// Reduce the scope of the pattern search
s = s.substr(offset, res)
offset = 0		} else {
			// Pattern found but escaped... try further
			offset++
		}
	} else if (i === 0) {
		// include("firstOf_found.js")
this.size = l[j].length - firstSize
this.idx = j
res = i - offset
// Reduce the scope of the pattern search
s = s.substr(offset, res)
offset = 0	}
}
	return res + this.size
}

// include("escapedString_SubRule.js")
function escapedString_SubRule (s, esc) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
	this.esc = esc.charCodeAt(0)
	this.token = false
}

escapedString_SubRule.prototype.exec = function (s, start) {
	var offset = start, i, res
	, n = s.length

	while (offset < n) {
		i = s.indexOf(this.str, offset) // TODO indexOf
		if (i > 0) {
			// include("check_escaped.js")
// i: index to start at
// s: string to check
//=>provide an if condition
// Check escaped pattern - '\\'.charCodeAt(0) === 92
for (var esc_i = i, esc_num = 0; esc_i > 0 && s.charCodeAt(--esc_i) === this.esc; esc_num++) {}
if ( (esc_num % 2) === 0 )			return i - start + this.n
			offset = i + 1
		} else {
	  		return i < 0 ? -1 : this.n
		}
	}
	return -1
}

// include("escapedTokenizedFirstOf_SubRule.js")
function escapedTokenizedFirstOf_SubRule (list, esc) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
	this.esc = esc.charCodeAt(0)
}

escapedTokenizedFirstOf_SubRule.prototype.exec = function (s, start, firstSize) {
	// include("firstOf_loop_escaped.js")
// var buf = s
var offset = start - firstSize // Include the first rule pattern
var l = this.list
var res = -1

this.size = 0

// Check all patterns
for (var i, j = 0, n = this.n; j < n && res !== firstSize; j++) {
	i = s.indexOf( l[j], offset + firstSize ) // TODO indexOf
	if (i > 0) {
		// include("check_escaped.js")
// i: index to start at
// s: string to check
//=>provide an if condition
// Check escaped pattern - '\\'.charCodeAt(0) === 92
for (var esc_i = i, esc_num = 0; esc_i > 0 && s.charCodeAt(--esc_i) === this.esc; esc_num++) {}
if ( (esc_num % 2) === 0 )		{
			// include("firstOf_found.js")
this.size = l[j].length - firstSize
this.idx = j
res = i - offset
// Reduce the scope of the pattern search
s = s.substr(offset, res)
offset = 0		} else {
			// Pattern found but escaped... try further
			offset++
		}
	} else if (i === 0) {
		// include("firstOf_found.js")
this.size = l[j].length - firstSize
this.idx = j
res = i - offset
// Reduce the scope of the pattern search
s = s.substr(offset, res)
offset = 0	}
}
	// console.log('=>'+s+'<=', res, this.size)
	return res < 0 ? -1 : s
}

// include("escapedTokenizedNoTrimFirstOf_SubRule.js")
function escapedTokenizedNoTrimFirstOf_SubRule (list, esc) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
	this.esc = esc.charCodeAt(0)
}

escapedTokenizedNoTrimFirstOf_SubRule.prototype.exec = function (s, start, firstSize) {
	// include("firstOf_loop_escaped.js")
// var buf = s
var offset = start - firstSize // Include the first rule pattern
var l = this.list
var res = -1

this.size = 0

// Check all patterns
for (var i, j = 0, n = this.n; j < n && res !== firstSize; j++) {
	i = s.indexOf( l[j], offset + firstSize ) // TODO indexOf
	if (i > 0) {
		// include("check_escaped.js")
// i: index to start at
// s: string to check
//=>provide an if condition
// Check escaped pattern - '\\'.charCodeAt(0) === 92
for (var esc_i = i, esc_num = 0; esc_i > 0 && s.charCodeAt(--esc_i) === this.esc; esc_num++) {}
if ( (esc_num % 2) === 0 )		{
			// include("firstOf_found.js")
this.size = l[j].length - firstSize
this.idx = j
res = i - offset
// Reduce the scope of the pattern search
s = s.substr(offset, res)
offset = 0		} else {
			// Pattern found but escaped... try further
			offset++
		}
	} else if (i === 0) {
		// include("firstOf_found.js")
this.size = l[j].length - firstSize
this.idx = j
res = i - offset
// Reduce the scope of the pattern search
s = s.substr(offset, res)
offset = 0	}
}
	// console.log('=>'+buf+'<=', res, this.size)
	if ( res < 0 ) return res

	this.size = -firstSize
	return s + this.list[ this.idx ]
}

// include("firstArray_SubRule.js")
function firstArray_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.n = list.length
	this.list = stringToCharCodes(list, true)
	this.token = false
}

firstArray_SubRule.prototype.exec = function (s, start) {
	for (var i = 0, n = this.n, l = this.list; i < n; i++) { // Patterns
		for (var a = l[i], j = 0, m = a.length; j < m; j++) { // Match?
			if ( s.charCodeAt(start + j) !== a[j] ) break
		}
		if (j === m) return (this.idx = i, this.size = m)
	}
	return -1
}

// include("firstChar_SubRule.js")
function firstChar_SubRule (c) {
	// Common properties
	this.size = 1
	this.idx = -1
	// Specific properties
	this.c = c.charCodeAt(0)
	this.token = false
}

firstChar_SubRule.prototype.exec = function (s, start) {
	return s.charCodeAt(start) === this.c ? 1 : -1
}

// include("firstOf_SubRule.js")
function firstOf_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.n = list.length
	this.list = list
	this.token = false
}

firstOf_SubRule.prototype.exec = function (s, start) {
	var firstSize = 0

	// include("firstOf_loop.js")
// var buf = s
var offset = start - firstSize // Include the first rule pattern
var l = this.list
var res = -1

this.size = 0

// Check all patterns
for (var i, j = 0, n = this.n; j < n && res !== firstSize; j++) {
	i = s.indexOf( l[j], offset + firstSize ) // TODO indexOf
	if (i >= 0) {
		// include("firstOf_found.js")
this.size = l[j].length - firstSize
this.idx = j
res = i - offset
// Reduce the scope of the pattern search
s = s.substr(offset, res)
offset = 0	}
}
	return res + this.size
}

// include("firstSingleArray_SubRule.js")
function firstSingleArray_SubRule (list) {
	this.size = 1
	this.idx = -1
	this.n = list.length
	this.list = stringToCharCodes(list)
	this.token = false
}

firstSingleArray_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	for (var i = 0, n = this.n, l = this.list; i < n; i++) {
		if ( c === l[i] ) return (this.idx = i, 1)
	}
	return -1
}

// include("firstString_SubRule.js")
function firstString_SubRule (s) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
	this.token = false
}

firstString_SubRule.prototype.exec = function (s, start) {
	if (s.length < this.n) return -1
	for (var p = this.str, i = 0, n = this.n; i < n; i++) {
		if (s[i+start] !== p[i]) return -1
	}
	return n
}

// include("function_SubRule.js")
function function_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.token = false
	this.list = list
}

function_SubRule.prototype.exec = function (s, start) {
	var l = this.list
	var matched

	for (var i = 0, n = l.length; i < n; i++) {
		matched = l[i](s, start)
		if (matched >= 0) return (this.idx = i, this.size = matched)
	}

	return -1
}

// include("number_SubRule.js")
function number_SubRule (n) {
	// Common properties
	this.size = 0
	this.idx = -1
	this.token = true
	// Specific properties
	this.n = n
}

number_SubRule.prototype.exec = function (s, start) {
  return s.length - start >= this.n ? s.substr(start, this.n) : -1
}

// include("numberArray_SubRule.js")
function numberArray_SubRule (list) {
	this.size = 1
	this.idx = -1
	this.n = list.length
	this.list = list
	this.token = false
}

numberArray_SubRule.prototype.exec = function (s, start) {
	for (var i = 0, n = this.n, l = this.list; i < n; i++) {
		if (s.length - start >= l[i]) return ( this.idx = i, s.substr(start, l[i]) )
	}
	return -1
}

// include("numberNoToken_SubRule.js")
function numberNoToken_SubRule (n) {
	// Common properties
	this.size = 0
	this.idx = -1
	this.token = true
	// Specific properties
	this.n = n
}

numberNoToken_SubRule.prototype.exec = function (s, start) {
  return s.length - start >= this.n ? this.n : -1
}

// include("startendNumberSingleRange_SubRule.js")
function startendNumberSingleRange_SubRule (start, end) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
	this.end = toCharCodes(end)
	this.token = false
}

startendNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	return c >= this.start && c <= this.end ? 1 : -1
}

// include("startendSingleRange_SubRule.js")
function startendSingleRange_SubRule (start, end) {
	this.size = 1
	this.idx = -1
	this.token = false

	var _start = toCharCodes(start)
	var _end = toCharCodes(end)
	this.list = []
	for (var i = 0, n = _start.length; i < n; i++) {
		this.list.push( _start[i], _end[i] )
	}
}

startendSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	var l = this.list
	for (var i = 0, n = l.length; i < n; i++)
		if (c >= l[i++] && c <= l[i]) return 1
	return -1
}

// include("startNumberSingleRange_SubRule.js")
function startNumberSingleRange_SubRule (start) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
	this.token = false
}

startNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	return s.charCodeAt(start) >= this.start ? 1 : -1
}

// include("startSingleRange_SubRule.js")
function startSingleRange_SubRule (start) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
	this.token = false
}

startSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	var l = this.start
	for (var i = 0, n = l.length; i < n; i++)
		if (c >= l[i]) return 1
	return -1
}

// include("string_SubRule.js")
function string_SubRule (s) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
	this.token = false
}

string_SubRule.prototype.exec = function (s, start) {
	var idx = s.indexOf(this.str, start) // TODO indexOf
	return idx < 0 ? -1 : idx - start + this.n
}

// include("stringArray_SubRule.js")
function stringArray_SubRule (list) {
	this.size = list.length
	this.idx = -1
	this.n = list.length
	this.list = list
	this.token = false
}

stringArray_SubRule.prototype.exec = function (s, start) {
	for (var i = 0, j, n = this.n, l = this.list; i < n; i++) {
		j = s.indexOf(l[i], start) - start // TODO indexOf
		if (j >= 0) return ( this.idx = i, j + (this.size = l[i].length) )
	}
	return -1
}

// include("tokenizedFirstOf_SubRule.js")
function tokenizedFirstOf_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
}

tokenizedFirstOf_SubRule.prototype.exec = function (s, start, firstSize) {
	// include("firstOf_loop.js")
// var buf = s
var offset = start - firstSize // Include the first rule pattern
var l = this.list
var res = -1

this.size = 0

// Check all patterns
for (var i, j = 0, n = this.n; j < n && res !== firstSize; j++) {
	i = s.indexOf( l[j], offset + firstSize ) // TODO indexOf
	if (i >= 0) {
		// include("firstOf_found.js")
this.size = l[j].length - firstSize
this.idx = j
res = i - offset
// Reduce the scope of the pattern search
s = s.substr(offset, res)
offset = 0	}
}
	// console.log('=>'+s+'<=', res, this.size)
	return res < 0 ? -1 : s
}

// include("tokenizedNoTrimFirstOf_SubRule.js")
function tokenizedNoTrimFirstOf_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
}

tokenizedNoTrimFirstOf_SubRule.prototype.exec = function (s, start, firstSize) {
	// include("firstOf_loop.js")
// var buf = s
var offset = start - firstSize // Include the first rule pattern
var l = this.list
var res = -1

this.size = 0

// Check all patterns
for (var i, j = 0, n = this.n; j < n && res !== firstSize; j++) {
	i = s.indexOf( l[j], offset + firstSize ) // TODO indexOf
	if (i >= 0) {
		// include("firstOf_found.js")
this.size = l[j].length - firstSize
this.idx = j
res = i - offset
// Reduce the scope of the pattern search
s = s.substr(offset, res)
offset = 0	}
}
	// console.log('=>'+s+'<=', res, this.size)
	if ( res < 0 ) return res

	this.size = -firstSize
	return s + this.list[ this.idx ]
}

// include("zero_SubRule.js")
function zero_SubRule (n) {
	// Common properties
	this.size = 0
	this.idx = -1
	this.token = false
}

zero_SubRule.prototype.exec = function (s, start) {
  return start - s.length
}


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
          case 'function':
            if (rule.length === 1) break
            return new function_SubRule(rule)
          default:
            throw new Error('Invalid type in array: ' + type)
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

  this.size = 0 // Last matched pattern length
  this.idx = -1 // If array rule, matched index
  this.token = false // Cannot generate a token
  switch ( typeof rule ) {
    case 'function':
      this.exec = rule
      break
    default:
      throw new Error('Tokenizer#addRule: Invalid rule ' + typeof(rule) + ' (function/string/integer/array only)')
  }
}
