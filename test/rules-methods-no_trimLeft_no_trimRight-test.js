/*
 * Rules definition tests

 trimLeft(false)
 trimRight(false)
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Rules Methods with trimLeft and trimRight disabled', function () {
    var p = new Tokenizer(options)

    beforeEach(function (done) {
      p.clear()
      p.trimLeft(false)
      p.trimRight(false)
      done()
    })
/*
''
'', 'a'
**/
    describe('First: ""', function () {
      var data = '0123456789abcdefghijklmnopqrstuvwxyz'

      describe('#addRule("")', function () {
        it('should return all token data', function (done) {
          p.addRule('', function (token, idx, type) {
            assert.equal(token, data)
            done()
          })
          .write(data)
        })
      })

      describe('#addRule("", "a")', function () {
        it('should return a token up to "a"', function (done) {
          p.addRule('', 'a', function (token, idx, type) {
            assert.equal(token, data.substr(0, data.indexOf('a')+1))
            done()
          })
          .write(data)
        })
      })
    })
/*
'a'
'ab'
**/
    describe('First: "..."', function () {
      describe('#addRule("a")', function () {
        it('should return the matched token', function (done) {
          p.addRule('a', function (token, idx, type) {
            assert.equal(token, 'a')
            done()
          })
          .write('abc')
        })
      })

      describe('#addRule("ab")', function () {
        it('should return the matched token', function (done) {
          p.addRule('ab', function (token, idx, type) {
            assert.equal(token, 'ab')
            done()
          })
          .write('abc')
        })
      })
    })
/*
'a', 'b'
'a', 1
**/
    describe('First: "...", Second: "..."', function () {
      describe('#addRule("a", "b")', function () {
        it('should return 123', function (done) {
          p.addRule('a', 'b', function (token, idx, type) {
            assert.equal(token, 'a123b')
            done()
          })
          .write('a123b123c')
        })
      })

      describe('#addRule("a", 1)', function () {
        it('should return 1', function (done) {
          p.addRule('a', 1, function (token, idx, type) {
            assert.equal(token, '1')
            done()
          })
          .write('a123b123c')
        })
      })
/*
'ab', 'c'
'ab', 'cd'
'ab', 1
**/
      describe('#addRule("ab", "c")', function () {
        it('should return 123', function (done) {
          p.addRule('ab', 'c', function (token, idx, type) {
            assert.equal(token, 'ab123c')
            done()
          })
          .write('ab123c')
        })
      })

      describe('#addRule("ab", "cd")', function () {
        it('should return 123', function (done) {
          p.addRule('ab', 'cd', function (token, idx, type) {
            assert.equal(token, 'ab123cd')
            done()
          })
          .write('ab123cd')
        })
      })

      describe('#addRule("ab", 1)', function () {
        it('should return 1', function (done) {
          p.addRule('ab', 1, function (token, idx, type) {
            assert.equal(token, '1')
            done()
          })
          .write('ab123c')
        })
      })
    })
/*
0
1
'a' 0
**/
    describe('First: Number', function () {
      describe('#addRule(1)', function () {
        it('should return a', function (done) {
          p.addRule(1, function (token, idx, type) {
            assert.equal(token, 'a')
            done()
          })
          .write('a')
        })
      })

      describe('#addRule(0)', function () {
        it('should trigger on empty buffer', function (done) {
          p.addRule(1, 'consume data')
          p.addRule(0, function (token, idx, type) {
            done()
          })
          .write('abc')
        })
      })

      describe('#addRule("a", 0)', function () {
        it('should trigger on empty buffer', function (done) {
          p.addRule('a', 'consume data')
          p.addRule(0, function (token, idx, type) {
            done()
          })
          .write('a')
        })
      })
    })
/*
1, 'a'
1, 'ab'
**/
    describe('First: Number Second: "..."', function () {
      describe('#addRule(4, "a")', function () {
        it('should return 123', function (done) {
          p.addRule(4, 'a', function (token, idx, type) {
            assert.equal(token, '123a')
            done()
          })
          .write('123abc')
        })
      })

      describe('#addRule(5, "ab")', function () {
        it('should return 123', function (done) {
          p.addRule(5, 'ab', function (token, idx, type) {
            assert.equal(token, '123ab')
            done()
          })
          .write('123abc')
        })
      })
    })
/*
['a','b']
['a','b'], 'c'
['a','b'], ['c','d']
**/
    describe('First: Single Array Second: "..."', function () {
      describe('#addRule(["a","b"])', function () {
        var i = 0
        it('should return the matched token', function (done) {
          p.addRule(['a','b'], function (token, idx, type) {
            i == 0 && assert.equal(token, 'a')
            i == 1 && assert.equal(token, 'b')
            i++
            if (i == 2) done()
          })
          .write('abc')
        })
      })

      describe('#addRule(["a","b"], "c")', function () {
        var i = 0
        it('should return abc then bac', function (done) {
          p.addRule(['a','b'], 'c', function (token, idx, type) {
            i == 0 && assert.equal(token, 'abc')
            i == 1 && assert.equal(token, 'bac')
            i++
            if (i == 2) done()
          })
          .write('abcbac')
        })
      })
    })
/*
['ab','cd']
['ab','cd'], 'e'
['ab','cd'], ['e','f']
**/
    describe('First: Array Second: "..."', function () {
      describe('#addRule(["ab","cd"])', function () {
        var i = 0
        it('should return the matched token', function (done) {
          p.addRule(['ab','cd'], function (token, idx, type) {
            i == 0 && assert.equal(token, 'ab')
            i == 1 && assert.equal(token, 'cd')
            i++
            if (i == 2) done()
          })
          .write('abcdcdab')
        })
      })

      describe('#addRule(["ab","cd"], "e")', function () {
        var i = 0
        it('should return abcde then cdabe', function (done) {
          p.addRule(['ab','cd'], 'e', function (token, idx, type) {
            i == 0 && assert.equal(token, 'abcde')
            i == 1 && assert.equal(token, 'cdabe')
            i++
            if (i == 2) done()
          })
          .write('abcdecdabe')
        })
      })

      describe('#addRule(["ab","cd"], ["e","f"])', function () {
        var i = 0
        it('should return abcde, cdabe, abcdf, cdabf', function (done) {
          p.addRule(['ab','cd'], ['e','f'], function (token, idx, type) {
            i == 0 && assert.equal(token, 'abcde')
            i == 1 && assert.equal(token, 'cdabe')
            i == 2 && assert.equal(token, 'abcdf')
            i == 3 && assert.equal(token, 'cdabf')
            i++
            if (i == 4) done()
          })
          .write('abcdecdabeabcdfcdabf')
        })
      })
    })
    /*
['a','bc']
['a','bc'], 'd'
['a','bc'], ['d','e']
**/
    describe('First: Array Second: "..."', function () {
      describe('#addRule(["a","bc"])', function () {
        var i = 0
        it('should return the matched token', function (done) {
          p.addRule(['a','bc'], function (token, idx, type) {
            i == 0 && assert.equal(token, 'a')
            i == 1 && assert.equal(token, 'bc')
            i++
            if (i == 2) done()
          })
          .write('abcdcdab')
        })
      })

      describe('#addRule(["a","bc"], "d")', function () {
        var i = 0
        it('should return abcd then bcabd', function (done) {
          p.addRule(['a','bc'], 'd', function (token, idx, type) {
            i == 0 && assert.equal(token, 'abcd')
            i == 1 && assert.equal(token, 'bcabd')
            i++
            if (i == 2) done()
          })
          .write('abcdbcabd')
        })
      })

      describe('#addRule(["a","bc"], ["d","e"])', function () {
        var i = 0
        it('should return twice bc then ab', function (done) {
          p.addRule(['a','bc'], ['d','e'], function (token, idx, type) {
            i == 0 && assert.equal(token, 'abcd')
            i == 1 && assert.equal(token, 'bcabd')
            i == 2 && assert.equal(token, 'abce')
            i == 3 && assert.equal(token, 'bcabe')
            i++
            if (i == 4) done()
          })
          .write('abcdbcabdabcebcabe')
        })
      })
    })
/*
{start: '0'}
{end: '9'}
{start: '0',end: '9'}
**/
    describe('First: Start/End Single Character', function () {
      describe('#addRule({ start: "0" })', function () {
        var i = 0
        it('should return an empty token', function (done) {
          p.addRule({ start: '0' }, function (token, idx, type) {
            i == 0 && assert.equal(token, '0')
            i == 1 && assert.equal(token, '9')
            i++
          })
          .addRule(' ', function () {
            done()
          })
          .write('09 ')
        })
      })

      describe('#addRule({ end: "9" })', function () {
        var i = 0
        it('should return an empty token', function (done) {
          p.addRule({ end: '9' }, function (token, idx, type) {
            i == 0 && assert.equal(token, '0')
            i == 1 && assert.equal(token, '9')
            i++
          })
          .addRule('a', function () {
            done()
          })
          .write('09a')
        })
      })

      describe('#addRule({ start: "0", end: "9" })', function () {
        var i = 0
        it('should return an empty token', function (done) {
          p.addRule({ start: '0', end: '9' }, function (token, idx, type) {
            i == 0 && assert.equal(token, '0')
            i == 1 && assert.equal(token, '9')
            i++
          })
          .addRule(' ', function () {
            done()
          })
          .write('09 ')
        })
      })
    })
/*
{start: 48}
{end: 57}
{start: 48,end: 57}
**/
    describe('First: Start/End Character code', function () {
      describe('#addRule({ start: 48 })', function () {
        var i = 0
        it('should return an empty token', function (done) {
          p.addRule({ start: 48 }, function (token, idx, type) {
            i == 0 && assert.equal(token, '0')
            i == 1 && assert.equal(token, '9')
            i++
          })
          .addRule(' ', function () {
            done()
          })
          .write('09 ')
        })
      })

      describe('#addRule({ end: 57 })', function () {
        var i = 0
        it('should return an empty token', function (done) {
          p.addRule({ end: 57 }, function (token, idx, type) {
            i == 0 && assert.equal(token, '0')
            i == 1 && assert.equal(token, '9')
            i++
          })
          .addRule('a', function () {
            done()
          })
          .write('09a')
        })
      })

      describe('#addRule({ start: 48, end: 57 })', function () {
        var i = 0
        it('should return an empty token', function (done) {
          p.addRule({ start: 48, end: 57 }, function (token, idx, type) {
            i == 0 && assert.equal(token, '0')
            i == 1 && assert.equal(token, '9')
            i++
          })
          .addRule(' ', function () {
            done()
          })
          .write('09 ')
        })
      })
    })
/*
{start: '0a'}
{end: '9z'}
{start: '0a',end: '9z'}
**/
    describe('First: Start/End String', function () {
      describe('#addRule({ start: "0a" })', function () {
        var i = 0
        it('should return an empty token', function (done) {
          p.addRule({ start: '0a' }, function (token, idx, type) {
            i == 0 && assert.equal(token, '0')
            i == 1 && assert.equal(token, '1')
            i == 2 && assert.equal(token, 'a')
            i == 3 && assert.equal(token, 'b')
            i++
          })
          .addRule(' ', function () {
            done()
          })
          .write('01ab ')
        })
      })

      describe('#addRule({ end: "9z" })', function () {
        var i = 0
        it('should return an empty token', function (done) {
          p.addRule({ end: '9z' }, function (token, idx, type) {
            i == 0 && assert.equal(token, '0')
            i == 1 && assert.equal(token, '9')
            i == 2 && assert.equal(token, 'a')
            i == 3 && assert.equal(token, 'z')
            i++
          })
          .addRule('~', function () {
            done()
          })
          .write('09az~')
        })
      })

      describe('#addRule({ start: "0a", end: "9z" })', function () {
        var i = 0
        it('should return an empty token', function (done) {
          p.addRule({ start: '0a', end: '9z' }, function (token, idx, type) {
            i == 0 && assert.equal(token, '0')
            i == 1 && assert.equal(token, '9')
            i == 2 && assert.equal(token, 'a')
            i == 3 && assert.equal(token, 'z')
            i++
          })
          .addRule('~', function () {
            done()
          })
          .write('09az~')
        })
      })
    })
/*
1, {firstOf: ['a','b']}
'a', {firstOf: ['a','b']}
['a','b'], {firstOf: ['a','b']}
**/
    describe('First: firstOf', function () {
      describe('#addRule(4, { firstOf: ["a","b"] })', function () {
        it('should return 01a', function (done) {
          p.addRule(4, { firstOf: ['a','b'] }, function (token, idx, type) {
            assert.equal(token, '01a')
            done()
          })
          .write('01ab')
        })
      })

      describe('#addRule("a", { firstOf: ["a","b"] })', function () {
        it('should return a01a', function (done) {
          p.addRule('a', { firstOf: ['a','b'] }, function (token, idx, type) {
            assert.equal(token, 'a01a')
            done()
          })
          .write('a01ab')
        })
      })

      describe('#addRule("a", { firstOf: ["a","b"] }, "~")', function () {
        it('should return a01ab~', function (done) {
          p.addRule('a', { firstOf: ['a','b'] }, '~', function (token, idx, type) {
            assert.equal(token, 'a01ab~')
            done()
          })
          .write('a01ab~')
        })
      })

      describe('#addRule(["a","b"], { firstOf: ["a","b"] })', function () {
        it('should return b01a', function (done) {
          p.addRule(['a','b'], { firstOf: ['a','b'] }, function (token, idx, type) {
            assert.equal(token, 'b01a')
            done()
          })
          .write('b01ab')
        })
      })
    })
  }
)