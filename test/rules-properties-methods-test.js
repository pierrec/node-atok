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

    describe('on non Number rule', function () {
      var p = new Tokenizer(options)
      it('should trigger but not set the token', function (done) {
        p.quiet(true)
        p.addRule('a', 'c', function (token, idx, type) {
          assert.notEqual(token, 'b')
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
})