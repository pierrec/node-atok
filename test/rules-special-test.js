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

  describe('addRule(0)', function () {
    describe('on empty buffer', function () {
      var p = new Tokenizer(options)

      var triggered = false

      p.ignore(true).addRule(1, 'consume').ignore()
      p.addRule(0, function () {
        triggered = true
      })
    
      it('should trigger', function (done) {
        p.write('abc')
        assert(triggered)
        assert.equal(p.length, 0)
        done()
      })
    })

    describe('with another addRule(0)', function () {
      var p = new Tokenizer(options)

      var triggered = []

      p.ignore(true).addRule(1, 'consume').ignore()
      p.addRule(0, function () {
        triggered.push(1)
      })
      p.addRule(0, function () {
        triggered.push(2)
      })
    
      it('should both trigger', function (done) {
        p.write('abc')
        assert.equal(p.length, 0)
        assert.equal(triggered.length, 2)
        assert.deepEqual(triggered, [1,2])
        done()
      })
    })

    describe('with ignore(true)', function () {
      var p = new Tokenizer(options)

      var triggered = false

      p.ignore(true).addRule(1, 'consume')
      p.addRule(0, function () {
        triggered = true
      })
    
      it('should not trigger', function (done) {
        p.write('abc')
        assert(!triggered)
        assert.equal(p.length, 0)
        done()
      })
    })

    describe('with next("rule")', function () {
      var p = new Tokenizer(options)

      var triggered = false

      p.addRule('a', 'dummy')
      p.saveRuleSet('test')

      p.clearRule()
      p.ignore(true).addRule(1, 'consume').ignore()
      p.next('test')
      p.addRule(0, function () {
        triggered = true
      })
    
      it('should trigger and load the rule set', function (done) {
        p.write('abc')
        assert(triggered)
        assert.equal(p.length, 0)
        assert.equal(p.currentRule, 'test')
        done()
      })
    })

    describe('with continue(1)', function () {
      var p = new Tokenizer(options)

      var triggered = false

      p.ignore(true).addRule(1, 'consume').ignore()
      p.continue(0)
      p.addRule(0, function () {})
      p.continue()
      p.addRule('a', function () {
        triggered = true
      })
    
      it('should trigger and load the rule set', function (done) {
        p.write('a')
        assert(!triggered)
        assert.equal(p.length, 0)
        p.write('a')
        assert(triggered)
        done()
      })
    })
  })
})