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
      p.continue(0, 1)
      p.addRule(function () {})
      p.continue()
      p.addRule(function () {
        done()
      })
      p.addRule(1, function () {
        done(new Error('Should not trigger'))
      })
      p.write('ab')
    })
  })

  describe('infinite loop', function () {
    describe('no subrule', function () {
      var p = new Tokenizer(options)
      var i = 0

      it('should throw an error', function (done) {
        p.addRule(function () {})

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

    describe('failed rule cannot point to itself', function () {
      var p = new Tokenizer(options)
      var i = 0

      it('should throw an error', function (done) {
        p.continue(0, -1)
        p.addRule('a', 'rule1')

        assert.throws(
          function () {
            p.write('b')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )

        done()
      })
    })

    describe('failed rules cannot point to each other', function () {
      var p = new Tokenizer(options)
      var i = 0

      it('should throw an error', function (done) {
        // p.continue(0, 1)
        // p.addRule('a', 'rule1')
        // p.continue()
        // p.addRule('b', 'rule2')
        // p.continue(0, -3)
        // p.addRule('a', 'rule3')
        p.continue(0, 0)
        p.addRule('a', 'rule1')
        p.continue(0, -2)
        p.addRule('a', 'rule2')

        assert.throws(
          function () {
            p.write('b')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )

        done()
      })
    })

    describe('failed rules cannot point to each other', function () {
      var p = new Tokenizer(options)
      var i = 0

      it('should throw an error', function (done) {
        p.continue(0, 1)
        p.addRule('a', 'rule1')
        p.continue()
        p.addRule('b', 'rule2')
        p.continue(0, -3)
        p.addRule('a', 'rule3')

        assert.throws(
          function () {
            p.write('b')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )

        done()
      })
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