/*
 * Rules properties methods tests
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Properties Methods', function () {
  describe('#ignore', function () {
    var p = new Tokenizer(options)
    it('should ignore the token matching the rule', function (done) {
      p.ignore(true)
      p.addRule('a', function (token, idx, type) {
        done( new Error('should not trigger') )
      })
      p.ignore()
      p.addRule('b', function (token, idx, type) {
        done()
      })
      p.write('ab')
    })
  })

  describe('#quiet', function () {
    describe('on Number rule', function () {
      var p = new Tokenizer(options)
      it('should not apply', function (done) {
        p.quiet(true)
        p.addRule(1, function (token, idx, type) {
          assert.equal(token, 'a')
          done()
        })
        p.write('a')
      })
    })

    describe('on Empty rule', function () {
      var p = new Tokenizer(options)
      it('should give the token size', function (done) {
        p.quiet(true)
        p.addRule('', function (token, idx, type) {
          assert.equal(token, 3)
          done()
        })
        p.write('abc')
      })
    })

    describe('on non Number/non Empty rule', function () {
      var p = new Tokenizer(options)
      it('should give the token size', function (done) {
        p.quiet(true)
        p.addRule('a', 'c', function (token, idx, type) {
          assert.equal(token, 1)
          done()
        })
        p.write('abc')
      })
    })
  })

  describe('#escaped', function () {
    describe('on unescaped char with default escape char', function () {
      var p = new Tokenizer(options)
      it('should apply', function (done) {
        p.escaped(true)
        p.addRule('"', '"', function (token, idx, type) {
          assert.equal(token, 'b')
          done()
        })
        p.write('"b"')
      })
    })

    describe('on escaped char with default escape char', function () {
      var p = new Tokenizer(options)
      it('should apply', function (done) {
        p.escaped(true)
        p.addRule('"', '"', function (token, idx, type) {
          assert.equal(token, 'b\\\"')
          done()
        })
        p.write( '"b\\""' )
      })
    })

    describe('on unescaped char with custom escape char', function () {
      var p = new Tokenizer(options)
      it('should apply', function (done) {
        p.escaped('~')
        p.addRule('"', '"', function (token, idx, type) {
          assert.equal(token, 'b')
          done()
        })
        p.write('"b"')
      })
    })

    describe('on escaped char with custom escape char', function () {
      var p = new Tokenizer(options)
      it('should apply', function (done) {
        p.escaped('~')
        p.addRule('"', '"', function (token, idx, type) {
          assert.equal(token, 'b~"')
          done()
        })
        p.write( '"b~""' )
      })
    })
  })

  describe('#continue', function () {
    describe('with a positive jump', function () {
      var p = new Tokenizer(options)
      it('should upon match continue at the indexed rule', function (done) {
        var i = 0
        p.continue(0)
        p.addRule('a', function (token, idx, type) {
          i++
        })
        p.continue()
        p.addRule('b', function (token, idx, type) {
          assert(i, 1)
          done()
        })
        p.write('ab')
      })
    })

    describe('with a negative jump', function () {
      var p = new Tokenizer(options)
      it('should upon match continue at the previous indexed rule', function (done) {
        var i = 0
        p.continue(-1)
        p.addRule('a', function (token, idx, type) {
          i++
        })
        p.continue()
        p.addRule(0, function (token, idx, type) {
          assert(i, 2)
          done()
        })
        p.write('aa')
      })
    })
  })
})