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
        assert.deepEqual(p.saved, {})
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
})