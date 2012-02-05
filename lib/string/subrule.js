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

var emptyRule = { exec: null }

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

function numberArray_SubRule (list) {
	this.size = 1
	this.idx = -1
	this.n = list.length
	this.list = list
}

numberArray_SubRule.prototype.exec = function (s, start) {
	for (var i = 0, n = this.n, l = this.list; i < n; i++) {
		if (s.length - start >= l[i]) return ( this.idx = i, s.substr(start, l[i]) )
	}
	return -1
}


function firstChar_SubRule (c) {
	// Common properties
	this.size = 1
	this.idx = -1
	// Specific properties
	this.c = c.charCodeAt(0)
}

firstChar_SubRule.prototype.exec = function (s, start) {
	return s.charCodeAt(start) == this.c ? 1 : -1
}

function firstString_SubRule (s) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
}

firstString_SubRule.prototype.exec = function (s, start) {
	if (s.length < this.n) return -1
	for (var p = this.str, i = 0, n = this.n; i < n; i++) {
		if (s[i+start] != p[i]) return -1
	}
	return n
}


function string_SubRule (s) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
}

string_SubRule.prototype.exec = function (s, start) {
	var idx = s.indexOf(this.str, start) // TODO indexOf
	return idx < 0 ? -1 : idx - start + this.n
}

function stringArray_SubRule (list) {
	this.size = list.length
	this.idx = -1
	this.n = list.length
	this.list = list
}

stringArray_SubRule.prototype.exec = function (s, start) {
	for (var i = 0, j, n = this.n, l = this.list; i < n; i++) {
		j = s.indexOf(l[i], start) - start // TODO indexOf
		if (j >= 0) return ( this.idx = i, j + (this.size = l[i].length) )
	}
	return -1
}

function firstSingleArray_SubRule (list) {
	this.size = 1
	this.idx = -1
	this.n = list.length
	this.list = stringToCharCodes(list)
}

firstSingleArray_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	for (var i = 0, n = this.n, l = this.list; i < n; i++) {
		if ( c == l[i] ) return (this.idx = i, 1)
	}
	return -1
}

function firstArray_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.n = list.length
	this.list = stringToCharCodes(list, true)
}

firstArray_SubRule.prototype.exec = function (s, start) {
	for (var i = 0, n = this.n, l = this.list; i < n; i++) { // Patterns
		for (var a = l[i], j = 0, m = a.length; j < m; j++) { // Match?
			if ( s.charCodeAt(start + j) != a[j] ) break
		}
		if (j == m) return (this.idx = i, this.size = m)
	}
	return -1
}

function escapedString_SubRule (s, esc) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
	this.esc = esc.charCodeAt(0)
}

escapedString_SubRule.prototype.exec = function (s, start) {
	var offset = start, i, res
	, n = s.length
	, esc = this.esc

	while (offset < n) {
	i = s.indexOf(this.str, offset) // TODO indexOf
	if (i > 0) {
		// Check escaped pattern - '\\'.charCodeAt(0) === 92
		for (var j = i, c = 0; j > 0 && s[--j].charCodeAt(0) == esc; c++) {}
			if ((c % 2) == 0) return i - start + this.n
			offset = i + 1
		} else {
	  		return i < 0 ? -1 : this.n
		}
	}
	return -1
}


function startendNumberSingleRange_SubRule (start, end) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
	this.end = toCharCodes(end)
}

startendNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	return c >= this.start && c <= this.end ? 1 : -1
}

function startendSingleRange_SubRule (start, end) {
	this.size = 1
	this.idx = -1

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

function startSingleRange_SubRule (start) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
}

startSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	var l = this.start
	for (var i = 0, n = l.length; i < n; i++)
		if (c >= l[i]) return 1
	return -1
}

function startNumberSingleRange_SubRule (start) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
}

startNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	return c >= this.start ? 1 : -1
}

function endNumberSingleRange_SubRule (end) {
	this.size = 1
	this.idx = -1
	this.end = toCharCodes(end)
}

endNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	return c <= this.end ? 1 : -1
}

function endSingleRange_SubRule (end) {
	this.size = 1
	this.idx = -1
	this.end = toCharCodes(end)
}

endSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	var l = this.end
	for (var i = 0, n = l.length; i < n; i++)
		if (c <= l[i]) return 1
	return -1
}


function tokenizedFirstOf_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
}

tokenizedFirstOf_SubRule.prototype.exec = function (s, start, firstSize) {
	var buf = s
	, offset = start - firstSize // Include the first rule pattern
	var l = this.list
	var res = -1
	this.size = 0

	// Check all patterns
	for (var i, j = 0, n = this.n; j < n && res != firstSize; j++) {
		// Exclude the first rule pattern from the search!
		i = buf.indexOf( l[j], offset + firstSize )
		// TODO indexOf
		// console.log('*'+buf, offset, firstSize, i)
		if (i >= 0) {
			this.size = l[j].length - firstSize // Do not include first rule pattern as already counted in Rule
			this.idx = j
			res = i - offset
			// Reduce the scope of the pattern search, including the first rule pattern
			buf = buf.substr(offset, res)
			// console.log('**'+buf, offset, res)
			offset = 0
		}
	}

	// console.log('=>'+buf+'<=', res, this.size)
	return res < 0 ? -1 : buf
}

function tokenizedNoTrimFirstOf_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
}

tokenizedNoTrimFirstOf_SubRule.prototype.exec = function (s, start, firstSize) {
	// var res = this.tokenizedFirstOfRule(s, start, firstSize)
	var buf = s
	, offset = start - firstSize // Include the first rule pattern
	var l = this.list
	var res = -1
	this.size = 0

	// Check all patterns
	for (var i, j = 0, n = this.n; j < n && res != firstSize; j++) {
		// Exclude the first rule pattern from the search!
		i = buf.indexOf( l[j], offset + firstSize )
		// TODO indexOf
		// console.log('*'+buf, offset, firstSize, i)
		if (i >= 0) {
			this.size = l[j].length - firstSize // Do not include first rule pattern as already counted in Rule
			this.idx = j
			res = i - offset
			// Reduce the scope of the pattern search, including the first rule pattern
			buf = buf.substr(offset, res)
			// console.log('**'+buf, offset, res)
			offset = 0
		}
	}

	// console.log('=>'+buf+'<=', res, this.size)
	if ( res === -1 ) return res

	this.size = -firstSize
	return buf + this.list[ this.idx ]
}


function firstOf_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
}

firstOf_SubRule.prototype.exec = function (s, start) {
	var buf = s, offset = start
	var l = this.list
	var res = -1
	this.size = 0

	// Check all patterns
	for (var i, j = 0, n = this.n; j < n && res != 0; j++) {
	i = buf.indexOf( l[j], offset ) // TODO indexOf
	if (i >= 0) {
		// this.size = typeof l[j] === 'number' ? 1 : l[j].length
		this.size = l[j].length
		this.idx = j
		res = i - offset
		// Reduce the scope of the pattern search
		buf = buf.substr(offset, res)
		offset = 0
	}
	}

	return res + this.size
}


function toCharCodes (v) {
  var res
  switch (typeof v) {
    case 'number':
      return v
    case 'string':
      if (v.length == 0)
        throw new Error('SubRule: Empty value')
      
      res = stringToCharCodes( [v] )
      break
    default:
      if ( !isArray(v) )
        throw new Error('SubRule: Invalid value')
      
      res = stringToCharCodes( v )
    }
  return res.length > 1 ? res: res[0]
}

function stringToCharCodes (arr, forceArray) {
  return arr.map(function (s) {
    return s.length == 1
      ? ( forceArray ? [ s.charCodeAt(0) ] : s.charCodeAt(0) )
      : s.split('').map(function (c) { return c.charCodeAt(0) })
    })
}
function toCharCodes (v) {
  var res

  switch (typeof v) {
    case 'number':
      return v
    case 'string':
      if (v.length == 0)
        throw new Error('SubRule: Empty value')
      
      res = stringToCharCodes( [v] )
      break
    default:
      if ( !isArray(v) )
        throw new Error('SubRule: Invalid value')
      
      res = stringToCharCodes( v )
    }
  return res.length > 1 ? res: res[0]
}

function getArrayItemsSize (arr) {
  var n = arr.length, i = 0

  if (n == 0) return -1

  var size = arr[0].length
  while ( ++i < n ) {
    if ( arr[i].length != size ) {
      size = -1
      break
    }
  }
  return size
}

function SubRule (rule, i, n, mainRule) {
  switch ( typeof rule ) {
    case 'number':
      if (rule <= 0)
        throw new Error('SubRule: Number cannot be negative: ' + rule)
      return new number_SubRule(rule)
    case 'string':
      if (rule.length == 0)
        return emptyRule
      if (rule.length == 1 && i == 0)
        return new firstChar_SubRule(rule)
      if (i == 0)
        return new firstString_SubRule(rule)
      if (mainRule.escape === false)
        return new string_SubRule(rule)
      return new escapedString_SubRule(rule, mainRule.escape)
    case 'object':
      if ( isArray(rule) ) {
        if (rule.length == 0)
          return emptyRule
        // Arrays must be of same type
        var type = typeof rule[0]
        if ( !rule.every(function (i) { return type === typeof i }) )
          throw new Error('SubRule: all array items must be of same type: ' + rule.join(','))

        switch( type ) {
          case 'number':
            if (i == 0)
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
      } else if ( i == 0 && rule.hasOwnProperty('start') && rule.hasOwnProperty('end') ) {
        if (rule.start.length != rule.end.length)
          throw new Error('SubRule: start and end must be of same size: ' + rule.start + '/' + rule.end)

        return typeof rule.start === 'number'
            || (typeof rule.start === 'string' && rule.start.length == 1)
          ? new startendNumberSingleRange_SubRule(rule.start, rule.end)
          : new startendSingleRange_SubRule(rule.start, rule.end)

      } else if ( i == 0 && rule.hasOwnProperty('start') && !rule.hasOwnProperty('end') ) {
        return typeof rule.start === 'number'
            || (typeof rule.start === 'string' && rule.start.length == 1)
          ? new startNumberSingleRange_SubRule(rule.start)
          : new startSingleRange_SubRule(rule.start)

      } else if ( i == 0 && !rule.hasOwnProperty('start') && rule.hasOwnProperty('end') ) {
        return typeof rule.end === 'number'
            || (typeof rule.end === 'string' && rule.end.length == 1)
          ? new endNumberSingleRange_SubRule(rule.end)
          : new endSingleRange_SubRule(rule.end)

      } else if ( rule.hasOwnProperty('firstOf') && isArray( rule.firstOf ) ) {
        if (rule.firstOf.length < 2)
          throw new Error('Tokenizer#addRule: Invalid Array size for firstOf (must be >= 2): ' + rule.firstOf.length)

        if (i !== (n-1))
          return new firstOf_SubRule(rule.firstOf)

        if (mainRule.trimRight)
          return new tokenizedFirstOf_SubRule(rule.firstOf)

        return new tokenizedNoTrimFirstOf_SubRule(rule.firstOf)
      }
  }
  
  if ( !(this instanceof SubRule) )
    return new SubRule(rule, i, n, mainRule)
  
  this.size = 0 // Last matched pattern length
  this.idx = -1 // If array rule, matched index
  // Atomic rules
    switch ( typeof(rule) ) {
      case 'function':
        this.exec = rule
        break
      case 'object':
          if ( rule.hasOwnProperty('firstOf') && isArray( rule.firstOf ) ) {
            var list = rule.firstOf
            if (list.length < 2)
              throw new Error('Tokenizer#addRule: Invalid Array size for firstOf (>= 2)')

            this.token = true
            this.n = list.length
            // this.list = toCharCodes(list)
            this.list = list
            this.idx = -1
            // Optimization can only be applied if it is the last rule
            this.exec = i !== (n-1)
              ? this.firstOfRule
              : mainRule.trimRight
                ? this.tokenizedFirstOfRule
                : this.tokenizedNoTrimFirstOfRule
          }
          break
      default:
        throw new Error('Tokenizer#addRule: Invalid rule ' + typeof(rule) + ' (function/string/integer/array only)')
    }
}

// indexOf slower for short strings... ~20 chars
// s: string
// p: array of codes or code
// start: int
var max = 21
SubRule.prototype.indexOf = function (s, p, start) {
  // if (typeof p === 'number') {
    for (var i = 0; i < max; i++) {
      if (s.charCodeAt(i + start) == p) return i + start
    }
  // } else {
    // TODO
    // console.log('TODO: indexOf')
  // }
  return s.indexOf(p, start)
}