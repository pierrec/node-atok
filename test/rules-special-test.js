/*
 * Special rules tests
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Special Rules', function () {
  describe('single function', function () {
    var p = new Tokenizer(options)
    var i = 0

    it('should return 0 match', function (done) {
      p.continue(0)
      p.addRule(function (matched) {
        assert.equal(matched, 0)
        i++
      })
      p.continue()
      p.addRule(1, 'consume')
      p.write('abc')

      assert.equal(i, 3)
      done()
    })
  })

  describe('single function is a successful rule', function () {
    var p = new Tokenizer(options)

    it('should return 0 match', function (done) {
      p.continue(0)
      p.addRule(1, 'consume')
      p.continue()
      p.addRule(function () {})
      p.addRule(function () {
        assert(false)
      })
      p.write('abc')

      done()
    })
  })

  describe('single function and single rule', function () {
    var p = new Tokenizer(options)
    var i = 0

    it('should throw an error (infinite loop)', function (done) {
      p.addRule(function (matched) {})

      assert.throws(
        function () {
          p.write('abc')
        }
      , function (err) {
          if (err instanceof Error) return true
        }
      )

      done()
    })
  })

  describe('rule matched on next write', function () {
    var p = new Tokenizer(options)
    var i = 0

    it('should trigger', function (done) {
      p.addRule('', '_', function () { done() })

      p.write('abc')
      p.write('abc_')
    })
  })

  describe('single subrule', function () {

    describe('with quiet()', function () {
      var p = new Tokenizer(options)
      
      it('should return an empty token', function (done) {
        p.addRule('a', function (matched) {
          assert.equal(matched, '')
          done()
        })
        p.write('a')
      })
    })

    describe('with quiet(true)', function () {
      var p = new Tokenizer(options)
      
      it('should return 0 match', function (done) {
        p.quiet(true)
        p.addRule('a', function (matched) {
          assert.equal(matched, 0)
          done()
        })
        p.write('a')
      })
    })
  })
})