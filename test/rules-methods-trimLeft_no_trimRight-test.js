/*
 * Rules definition tests

 trimLeft(true)
 trimRight(false)
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Rules Methods with trimRight disabled', function () {
    var p = new Tokenizer(options)

    beforeEach(function (done) {
      p.clear()
      p.trimRight(false)
      p.trimLeft(true)
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
          p.write(data)
        })
      })

      describe('#addRule("", "a")', function () {
        it('should return a token up to "a" included', function (done) {
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
        it('should return an empty token', function (done) {
          p.addRule('a', function (token, idx, type) {
            assert.equal(token, '')
            done()
          })
          .write('abc')
        })
      })

      describe('#addRule("ab")', function () {
        it('should return an empty token', function (done) {
          p.addRule('ab', function (token, idx, type) {
            assert.equal(token, '')
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
            assert.equal(token, '123b')
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
            assert.equal(token, '123c')
            done()
          })
          .write('ab123c')
        })
      })

      describe('#addRule("ab", "cd")', function () {
        it('should return 123', function (done) {
          p.addRule('ab', 'cd', function (token, idx, type) {
            assert.equal(token, '123cd')
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
        it('should return empty result', function (done) {
          p.addRule(1, function (token, idx, type) {
            assert.equal(token, '')
            done()
          })
          .write('a')
        })
      })

      describe('#addRule("a", 0)', function () {
        it('should trigger on empty buffer', function (done) {
          p.addRule('a', 0, function (token, idx, type) {
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
        it('should return a', function (done) {
          p.addRule(4, 'a', function (token, idx, type) {
            assert.equal(token, 'a')
            done()
          })
          .write('1234abc')
        })
      })

      describe('#addRule(5, "ab")', function () {
        it('should return 123', function (done) {
          p.addRule(5, 'ab', function (token, idx, type) {
            assert.equal(token, 'ab')
            done()
          })
          .write('12345abc')
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
        it('should return an empty token', function (done) {
          p.addRule(['a','b'], function (token, idx, type) {
            assert.equal(token, '')
            i++
            if (i == 2) done()
          })
          .write('abc')
        })
      })

      describe('#addRule(["a","b"], "c")', function () {
        var i = 0
        it('should return b then a', function (done) {
          p.addRule(['a','b'], 'c', function (token, idx, type) {
            i == 0 && assert.equal(token, 'bc')
            i == 1 && assert.equal(token, 'ac')
            i++
            if (i == 2) done()
          })
          .write('abcbac')
        })
      })

      describe('#addRule(["a","b"], ["c","d"])', function () {
        var i = 0
        it('should return b then a', function (done) {
          p.addRule(['a','b'], ['c','d'], function (token, idx, type) {
            i == 0 && assert.equal(token, 'bc')
            i == 1 && assert.equal(token, 'ac')
            i == 2 && assert.equal(token, 'bd')
            i == 3 && assert.equal(token, 'ad')
            i++
            if (i == 4) done()
          })
          .write('abcbacabdbad')
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
        it('should return an empty token', function (done) {
          p.addRule(['ab','cd'], function (token, idx, type) {
            assert.equal(token, '')
            i++
            if (i == 2) done()
          })
          .write('abcdcdab')
        })
      })

      describe('#addRule(["ab","cd"], "e")', function () {
        var i = 0
        it('should return cd then ab', function (done) {
          p.addRule(['ab','cd'], 'e', function (token, idx, type) {
            i == 0 && assert.equal(token, 'cde')
            i == 1 && assert.equal(token, 'abe')
            i++
            if (i == 2) done()
          })
          .write('abcdecdabe')
        })
      })

      describe('#addRule(["ab","cd"], ["e","f"])', function () {
        var i = 0
        it('should return twice cd then ab', function (done) {
          p.addRule(['ab','cd'], ['e','f'], function (token, idx, type) {
            i == 0 && assert.equal(token, 'cde')
            i == 1 && assert.equal(token, 'abe')
            i == 2 && assert.equal(token, 'cdf')
            i == 3 && assert.equal(token, 'abf')
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
        it('should return an empty token', function (done) {
          p.addRule(['a','bc'], function (token, idx, type) {
            assert.equal(token, '')
            i++
            if (i == 2) done()
          })
          .write('abcdcdab')
        })
      })

      describe('#addRule(["a","bc"], "d")', function () {
        var i = 0
        it('should return bc then ab', function (done) {
          p.addRule(['a','bc'], 'd', function (token, idx, type) {
            i == 0 && assert.equal(token, 'bcd')
            i == 1 && assert.equal(token, 'abd')
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
            i == 0 && assert.equal(token, 'bcd')
            i == 1 && assert.equal(token, 'abd')
            i == 2 && assert.equal(token, 'bce')
            i == 3 && assert.equal(token, 'abe')
            i++
            if (i == 4) done()
          })
          .write('abcdbcabdabcebcabe')
        })
      })
    })
/*
[fn1, fn2]
[fn1, fn2], 'a'
[fn1, fn2], ['a','b']
**/
    describe('First: Array Second: "..."', function () {
      function fn1 (s, start) {
        return s[start] === 'a' ? 1 : -1
      }
      function fn2 (s, start) {
        return s[start] === 'b' ? 1 : -1
      }

      describe('#addRule([fn1,fn2])', function () {
        var i = 0
        it('should return an empty token', function (done) {
          p.addRule([fn1,fn2], function (token, idx, type) {
            assert.equal(token, '')
            i++
            if (i == 2) done()
          })
          p.write('ab')
        })
      })

      describe('#addRule([fn1,fn2], "a")', function () {
        var i = 0
        it('should return bc twice', function (done) {
          p.addRule([fn1,fn2], 'a', function (token, idx, type) {
            i == 0 && assert.equal(token, 'bca')
            i == 1 && assert.equal(token, 'bca')
            i++
            if (i == 2) done()
          })
          .write('abcabbca')
        })
      })

      describe('#addRule([fn1,fn2], ["a","b"])', function () {
        var i = 0
        it('should return c 4 times', function (done) {
          p.addRule([fn1,fn2], ['a','b'], function (token, idx, type) {
            i == 0 && assert.equal(token, 'ca')
            i > 0 && assert.equal(token, 'cb')
            i++
            if (i == 4) done()
          })
          .write('acaacbbcbbcb')
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
        it('should return an empty token', function (done) {
          p.addRule({ start: '0' }, function (token, idx, type) {
            assert.equal(token, '')
          })
          .addRule(' ', function () {
            done()
          })
          .write('09 ')
        })
      })

      describe('#addRule({ end: "9" })', function () {
        it('should return an empty token', function (done) {
          p.addRule({ end: '9' }, function (token, idx, type) {
            assert.equal(token, '')
          })
          .addRule('a', function () {
            done()
          })
          .write('09a')
        })
      })

      describe('#addRule({ start: "0", end: "9" })', function () {
        it('should return an empty token', function (done) {
          p.addRule({ start: '0', end: '9' }, function (token, idx, type) {
            assert.equal(token, '')
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
        it('should return an empty token', function (done) {
          p.addRule({ start: 48 }, function (token, idx, type) {
            assert.equal(token, '')
          })
          .addRule(' ', function () {
            done()
          })
          .write('09 ')
        })
      })

      describe('#addRule({ end: 57 })', function () {
        it('should return an empty token', function (done) {
          p.addRule({ end: 57 }, function (token, idx, type) {
            assert.equal(token, '')
          })
          .addRule('a', function () {
            done()
          })
          .write('09a')
        })
      })

      describe('#addRule({ start: 48, end: 57 })', function () {
        it('should return an empty token', function (done) {
          p.addRule({ start: 48, end: 57 }, function (token, idx, type) {
            assert.equal(token, '')
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
        it('should return an empty token', function (done) {
          p.addRule({ start: '0a' }, function (token, idx, type) {
            assert.equal(token, '')
          })
          .addRule(' ', function () {
            done()
          })
          .write('01ab ')
        })
      })

      describe('#addRule({ end: "9z" })', function () {
        it('should return an empty token', function (done) {
          p.addRule({ end: '9z' }, function (token, idx, type) {
            assert.equal(token, '')
          })
          .addRule('~', function () {
            done()
          })
          .write('09az~')
        })
      })

      describe('#addRule({ start: "0a", end: "9z" })', function () {
        it('should return an empty token', function (done) {
          p.addRule({ start: '0a', end: '9z' }, function (token, idx, type) {
            assert.equal(token, '')
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
        it('should return a', function (done) {
          p.addRule(4, { firstOf: ['a','b'] }, function (token, idx, type) {
            assert.equal(token, 'a')
            done()
          })
          .write('0123ab')
        })
      })

      describe('#addRule("", { firstOf: ["a","b"] })', function () {
        it('should return 01', function (done) {
          p.addRule('', { firstOf: ['a','b'] }, function (token, idx, type) {
            assert.equal(token, '01a')
            done()
          })
          .write('01a')
        })
      })

      describe('#addRule("~", { firstOf: ["a","b"] })', function () {
        it('should return 01a', function (done) {
          p.addRule('~', { firstOf: ['a','b'] }, function (token, idx, type) {
            assert.equal(token, '01a')
            done()
          })
          .write('~01ab')
        })
      })

      describe('#addRule("a", { firstOf: ["a","b"] }, "~")', function () {
        it('should return 01ab~', function (done) {
          p.addRule('a', { firstOf: ['a','b'] }, '~', function (token, idx, type) {
            assert.equal(token, '01ab~')
            done()
          })
          .write('a01ab~')
        })
      })

      describe('#addRule(["a","b"], { firstOf: ["a","b"] })', function () {
        it('should return 01a', function (done) {
          p.addRule(['a','b'], { firstOf: ['a','b'] }, function (token, idx, type) {
            assert.equal(token, '01a')
            done()
          })
          .write('b01ab')
        })
      })
    })
  }
)