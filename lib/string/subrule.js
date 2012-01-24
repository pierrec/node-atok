/**
 * class Rule
 *
 * SubRule for stream based tokenizer Rule
 *
 * Copyright (c) 2012 Pierre Curto
 * MIT Licensed
**/
module.exports = SubRule

var isArray = require('util').isArray

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
  if ( !(this instanceof SubRule) )
    return new SubRule(rule, i, n, mainRule)
  
  this.size = 0 // Last matched pattern length
  this.idx = -1 // If array rule, matched index
  // Atomic rules
    switch ( typeof(rule) ) {
      case 'function':
        this.exec = rule
        break
      case 'number':
        // This case does produce a token
        this.token = true
        if (rule > 0) {
          this.n = rule
          this.exec = this.numberRule
        } else {
          throw new Error('SubRule: Number cannot be negative: ' + rule)
        }
        break
      case 'string':
        if (rule.length == 0) {
          this.exec = this.emptyRule
        } else if (rule.length == 1 && i == 0) {
          this.size = 1
          this.c = rule.charCodeAt(0)
          this.exec = this.firstCharRule
        } else {
          this.size = rule.length
          this.n = rule.length
          this.str = rule
          this.exec = i == 0 ? this.firstStringRule : mainRule.escape ? this.escapedStringRule : this.stringRule
        }
        break
      case 'object':
          if ( isArray(rule) ) {
            if (rule.length == 0) {
              this.exec = this.emptyRule
            } else {
              // Arrays must be of same type
              var type = typeof rule[0]
              if ( !rule.every(function (i) { return type === typeof i }) )
                throw new Error('SubRule: all array items must be of same type: ' + rule.join())

              this.n = rule.length
              if (type === 'number') {
                this.setNumberSubRules(rule, i)
              } else {
                this.setStringSubRules(rule, i)
              }
            }
          } else if ( i == 0 && rule.hasOwnProperty('start') && rule.hasOwnProperty('end') ) {
            this.size = 1
            this.start = toCharCodes(rule.start)
            this.end = toCharCodes(rule.end)

            if ( typeof this.start === 'number') {
              this.exec = this.singleRangeRule
            } else {
              if (this.start.length != this.end.length)
                throw new Error('SubRule: start and end must be of same size')
              // Merge the lists - can be a string or an array
              this.list = []
              for (var i = 0, n = this.start.length; i < n; i++) {
                this.list.push( this.start[i] )
                this.list.push( this.end[i] )
              }
              this.exec = this.rangeRule
            }
          } else if ( i == 0 && rule.hasOwnProperty('start') ) {
            this.size = 1
            this.start = toCharCodes(rule.start)
            this.exec = typeof this.start === 'number'
              ? this.startSingleRangeRule
              : this.startRangeRule
          } else if ( i == 0 && rule.hasOwnProperty('end') ) {
            this.size = 1
            this.end = toCharCodes(rule.end)
            this.exec = typeof this.end === 'number'
              ? this.endSingleRangeRule
              : this.endRangeRule
          } else if ( rule.hasOwnProperty('firstOf') && isArray( rule.firstOf ) ) {
            var list = rule.firstOf
            if (list.length < 2)
              throw new Error('Tokenizer#addRule: Invalid Array size for firstOf')

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

SubRule.prototype.setNumberSubRules = function (rule, i) {
  if (i == 0) {
    this.size = 1
    this.list = rule
    this.exec = this.numberArrayRule
  } else { // TODO
    throw new Error('SubRule: unsupported number list as nth ' + i + ' rule: ' + rule)
  }
}

SubRule.prototype.setStringSubRules = function (rule, i) {
  if (i == 0) {
    // All items of same size?
    switch ( getArrayItemsSize(rule) ) {
      case 0:
        this.exec = this.emptyRule
        break
      case 1:
        // Map the patterns list to a list of single char codes
        this.size = 1
        this.list = stringToCharCodes(rule)
        this.exec = this.firstSingleArrayRule
        break
      default:
        // Map the patterns list to a list of char codes list
        this.list = stringToCharCodes(rule, true)
        this.exec = this.firstArrayRule
    }
  } else {
    this.list = rule
    this.exec = this.arrayRule
  }
}

//TODO - if first rule + trimLeft true => chopped token
SubRule.prototype.emptyRule = null
SubRule.prototype.numberRule = function (s, start) {
  return s.length - start >= this.n ? s.substr(start, this.n) : -1
}
SubRule.prototype.numberArrayRule = function (s, start) {
  for (var i = 0, n = this.n, l = this.list; i < n; i++) {
    if (s.length - start >= l[i]) return ( this.idx = i, s.substr(start, l[i]) )
  }
  return -1
}
/*
 * String based sub-rules
 */
SubRule.prototype.firstCharRule = function (s, start) {
  return s.charCodeAt(start) == this.c ? 1 : -1
}
SubRule.prototype.firstStringRule = function (s, start) {
  // return s.substr(start, this.n) == this.str ? this.n : -1
  if (s.length < this.n) return -1
  for (var p = this.str, i = 0, n = this.n; i < n; i++) {
    if (s[i+start] != p[i]) return -1
  }
  return n
}
SubRule.prototype.stringRule = function (s, start) {
  var idx = s.indexOf(this.str, start) // TODO indexOf
  // var idx = indexOf(s, this.str, start)
  return idx < 0 ? -1 : idx - start + this.n
}
SubRule.prototype.escapedStringRule = function (s, start) {
  var offset = start, i, res
    , n = s.length

  while (offset < n) {
    i = s.indexOf(this.str, offset) // TODO indexOf
    // i = indexOf(s, this.str, offset)
    if (i > 0) {
      // Check escaped pattern - '\\'.charCodeAt(0) === 92
      for (var j = i, c = 0; j > 0 && s[--j].charCodeAt(0) == 92; c++) {}
      if ((c % 2) == 0) return i - start + this.n
      offset = i + 1
    } else {
      return i < 0 ? -1 : this.n
    }
  }
  return -1
}
SubRule.prototype.firstArrayRule = function (s, start) {
  for (var i = 0, n = this.n, l = this.list; i < n; i++) { // Patterns
    for (var a = l[i], j = 0, m = a.length; j < m; j++) { // Match?
      if ( s.charCodeAt(start + j) != a[j] ) break
    }
    if (j == m) return (this.idx = i, this.size = m)
  }
  return -1
}
SubRule.prototype.arrayRule = function (s, start) {
  for (var i = 0, j, n = this.n, l = this.list; i < n; i++) {
    j = s.indexOf(l[i], start) - start // TODO indexOf
    if (j >= 0) return ( this.idx = i, j + (this.size = l[i].length) )
  }
  return -1
}
SubRule.prototype.firstSingleArrayRule = function (s, start) {
  var c = s.charCodeAt(start)
  for (var i = 0, n = this.n, l = this.list; i < n; i++) {
    if ( c == l[i] ) return (this.idx = i, 1)
  }
  return -1
}
SubRule.prototype.singleRangeRule = function (s, start) {
  var c = s.charCodeAt(start)
  return c >= this.start && c <= this.end ? 1 : -1
}
SubRule.prototype.rangeRule = function (s, start) {
  var c = s.charCodeAt(start)
  var l = this.list
  for (var i = 0, n = l.length; i < n; i++)
    if (c >= l[i++] && c <= l[i]) return 1
  return -1
}
SubRule.prototype.startSingleRangeRule = function (s, start) {
  var c = s.charCodeAt(start)
  return c >= this.start ? 1 : -1
}
SubRule.prototype.startRangeRule = function (s, start) {
  var c = s.charCodeAt(start)
  var l = this.start
  for (var i = 0, n = l.length; i < n; i++)
    if (c >= l[i]) return 1
  return -1
}
SubRule.prototype.endSingleRangeRule = function (s, start) {
  var c = s.charCodeAt(start)
  return c <= this.end ? 1 : -1
}
SubRule.prototype.endRangeRule = function (s, start) {
  var c = s.charCodeAt(start)
  var l = this.end
  for (var i = 0, n = l.length; i < n; i++)
    if (c <= l[i]) return 1
  return -1
}
SubRule.prototype.tokenizedFirstOfRule = function (s, start, firstSize) {
  var buf = s
    , offset = start - firstSize // Include the first rule pattern
  var l = this.list
  var res = -1
  this.size = 0

  // Check all patterns
  for (var i, j = 0, n = this.n; j < n && res != firstSize; j++) {
    i = buf.indexOf( l[j], offset + firstSize ) // Exclude the first rule pattern from the search! // TODO indexOf
    // i = this.indexOf( buf, l[j], offset + firstSize )
    // console.log('*'+buf, offset, firstSize, i)
    if (i >= 0) {
      // this.size = (typeof l[j] === 'number' ? 1 : l[j].length) - firstSize // Do not include first rule pattern as already counted in Rule
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
SubRule.prototype.tokenizedNoTrimFirstOfRule = function (s, start, firstSize) {
  var res = this.tokenizedFirstOfRule(s, start, firstSize)

  if ( typeof res === 'number' ) return res

  this.size = -firstSize
  return res + this.list[ this.idx ]
}
SubRule.prototype.firstOfRule = function (s, start) {
  var buf = s, offset = start
  var l = this.list
  var res = -1
  this.size = 0

  // Check all patterns
  for (var i, j = 0, n = this.n; j < n && res != 0; j++) {
    i = buf.indexOf( l[j], offset ) // TODO indexOf
    // i = this.indexOf( buf, l[j], offset ) // TODO indexOf
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