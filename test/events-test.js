/*
 * Emitted events tests
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Events', function () {
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

  describe('[debug]', function () {
    describe('toggled on/off', function () {
      var p = new Tokenizer(options)
      var matches = 0

      p.addRule(1, 'consume data')
      p.on('debug', function (method, type, data) {
        assert.equal(arguments.length, 3)
        assert.equal(typeof method, 'string')
        assert.equal(typeof type, 'string')
        matches++
      })
      it('should emit [debug]', function (done) {
        p.debug(true)
        p.write('abc')
        assert.equal(matches, 9)
        done()
      })

      it('should not emit [debug]', function (done) {
        p.debug()
        p.write('abc')
        assert.equal(matches, 9)
        done()
      })
    })

    describe('toggled on/off with #seek', function () {
      var p = new Tokenizer(options)
      var seek_flag = false

      p.addRule(1, 'consume data')
      p.on('debug', function (method, type, data) {
        if (method === 'Tokenizer#seek') {
          seek_flag = true
          assert.equal(type, 1)
        }
      })
      it('should emit [debug]', function (done) {
        p.debug(true)
        p.seek(1)
        p.write('abc')
        assert.equal(seek_flag, true)
        done()
      })

      it('should not emit [debug]', function (done) {
        seek_flag = false
        p.debug()
        p.seek(1)
        p.write('abc')
        assert.equal(seek_flag, false)
        done()
      })
    })

    describe('toggled on/off with #loadRuleSet', function () {
      var p = new Tokenizer(options)
      var loadruleset_flag = false

      p.addRule(1, 'consume data')
      p.saveRuleSet('test')
      p.on('debug', function (method, type, data) {
        if (method === 'Tokenizer#loadRuleSet') {
          loadruleset_flag = true
          assert.equal(type, 'test')
        }
      })
      it('should emit [debug]', function (done) {
        p.debug(true)
        p.loadRuleSet('test')
        p.write('abc')
        assert.equal(loadruleset_flag, true)
        done()
      })

      it('should not emit [debug]', function (done) {
        loadruleset_flag = false
        p.debug()
        p.loadRuleSet('test')
        p.write('abc')
        assert.equal(loadruleset_flag, false)
        done()
      })
    })
  })
})