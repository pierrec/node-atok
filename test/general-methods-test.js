/*
 * General methods tests

grep "Tknzr.prototype.[^_]" ../lib/tokenizer.js
 
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer General Methods', function () {
  it('should provide its version', function (done) {
    assert.equal(typeof Tokenizer.version, 'string')
    done()
  })

  describe('#length', function () {
    var p = new Tokenizer(options)
    it('should return the tokenizer buffer size', function (done) {
      var data = '123'
      p.write(data)
      assert.equal(p.length, data.length)
      done()
    })
  })

  describe('#flush', function () {
    var p = new Tokenizer(options)
    it('should return the tokenizer buffer size', function (done) {
      var data = '123'
      p.write(data)
      assert.deepEqual(p.flush(), data)
      done()
    })
  })

  describe('#clear', function () {
    describe('()', function () {
      var p = new Tokenizer(options)
      it('should clear and remove rules', function (done) {
        p.addRule('a', 'data')
        p.saveRuleSet('myRules')
        p.clear()
        assert.equal(p.length, 0)
        assert.deepEqual(p._savedRules, {})
        done()
      })
    })

    describe('(true)', function () {
      var p = new Tokenizer(options)
      it('should clear and keep rules', function (done) {
        p.addRule('a', 'data')
        p.saveRuleSet('myRules')
        p.clear(true)
        assert.equal(p.length, 0)
        assert.notDeepEqual(p.saved, {})
        done()
      })
    })
  })

  describe('#debug', function () {
    var p = new Tokenizer(options)
    it('should not corrupt methods', function (done) {
      p.debug()
      p.addRule('a', function (token, idx, type) {
        done()
      })
      p.saveRuleSet('test')
      
      // Following methods are altered by #debug
      p.loadRuleSet('test')

      p.write('a')
    })
  })

  describe('#slice', function () {
    describe('()', function () {
      var p = new Tokenizer(options)
      it('should return the buffer', function (done) {
        p.write('abcd')
        assert.equal(p.slice(), 'abcd')
        done()
      })
    })

    describe('(1)', function () {
      var p = new Tokenizer(options)
      it('should return everything from the index', function (done) {
        p.write('abcd')
        assert.equal(p.slice(1), 'bcd')
        done()
      })
    })

    describe('(1,2)', function () {
      var p = new Tokenizer(options)
      it('should return a slice of the buffer', function (done) {
        p.write('abcd')
        assert.equal(p.slice(1,2), 'b')
        done()
      })
    })
  })

  describe('#currentRule', function () {
    describe('with no rule set', function () {
      var p = new Tokenizer(options)
      it('should return null', function (done) {
        p.addRule('a', 'first')
        assert.equal( p.currentRule(), null )
        done()
      })
    })

    describe('with a rule set', function () {
      var p = new Tokenizer(options)
      it('should return the rule set name', function (done) {
        p.addRule('a', 'first')
        p.saveRuleSet('test')
        // loadRuleSet() required as saveRuleSet() does a clearRule()
        p.loadRuleSet('test')
        assert.equal( p.currentRule(), 'test' )
        done()
      })
    })
  })
})