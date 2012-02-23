/*
 * Emitted events tests
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Events', function () {
  describe('[match]', function () {
    var p = new Tokenizer(options)
    it('should emit [match] when a rule matches', function (done) {
      var matches = 0
      p.addRule(1, 'consume data')
      p.addRule(0, function (token, idx, type) {
        assert.equal(matches, 3)
        done()
      })
      p.on('match', function (offset) {
        // Should be the current offset
        assert.equal(offset, matches)
        matches++
      })
      p.write('abc')
    })
  })

  describe('[empty]', function () {
    describe('while not ending', function () {
      var p = new Tokenizer(options)
      it('should emit [empty] when a rule matches', function (done) {
        p.addRule(1, 'consume data')
        p.on('empty', function (ending) {
          // Should be the current ending status
          assert.equal(ending, false)
          done()
        })
        p.write('abc')
      })
    })

    describe('while ending', function () {
      var p = new Tokenizer(options)
      it('should emit [empty] when a rule matches', function (done) {
        p.addRule(1, 'consume data')
        p.on('empty', function (ending) {
          // Should be the current ending status
          assert.equal(ending, true)
          done()
        })
        p.end('abc')
      })
    })
  })

  describe('[seek]', function () {
    var p = new Tokenizer(options)
    var flag = false

    it('should emit [seek] on `seek()`', function (done) {
      p.addRule(' ', function (token, idx, type) {
        assert.deepEqual(flag, true)
        done()
      })
      p.addRule(1, function () {
        p.seek(1)
      })
      p.on('seek', function (i) {
        assert.equal(i, 1)
        flag = true
      })
      p.write('abc  ')
    })
  })

  describe('[loadruleset]', function () {
    var p = new Tokenizer(options)
    var flag = false

    it('should emit [loadruleset] when a rule is loaded', function (done) {
      p.addRule(1, function () {
        p.loadRuleSet('ruleSet2')
      })
      p.saveRuleSet('ruleSet1')
      p.addRule(0, function (token, idx, type) {
        assert.deepEqual(flag, true)
        done()
      })
      p.saveRuleSet('ruleSet2')
      p.loadRuleSet('ruleSet1')
      p.on('loadruleset', function (ruleset) {
        assert.equal(ruleset, 'ruleSet2')
        flag = true
      })
      p.write('abc')
    })
  })

  describe('[debug]', function () {
    var p = new Tokenizer({ debug: true })
    it('should emit [debug] when option set', function (done) {
      var matches = 0
      p.addRule(1, 'consume data')
      p.addRule(0, function (token, idx, type) {
        assert.equal(matches, 9)
        done()
      })
      p.on('debug', function (msg) {
        assert.equal(typeof msg, 'string')
        matches++
      })
      p.write('abc')
    })
  })
})