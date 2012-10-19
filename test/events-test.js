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
    describe('toggled', function () {
      var p = new Tokenizer(options)
      var matches

      p.addRule(1, 'consume data')
      p.on('debug', function (type, method, args) {
        assert.equal(arguments.length, 3)
        assert.equal(typeof type, 'string')
        assert.equal(typeof method, 'string')
        assert.equal(typeof args, 'object')
        matches++
      })

      describe('on', function () {
        it('should emit [debug]', function (done) {
          matches = 0
          p.debug(true)
          p.write('abc')
          assert.equal(matches, 6) // 3 x ( 1xhandler, 1xsubrule )
          done()
        })
      })

      describe('off', function () {
        it('should not emit [debug]', function (done) {
          matches = 0
          p.debug()
          p.write('abc')
          assert.equal(matches, 0)
          done()
        })
      })
    })

    describe('toggled on/off with #loadRuleSet', function () {
      var p = new Tokenizer(options)
      var loadruleset_flag = false

      p.addRule(1, 'consume data')
      p.saveRuleSet('test')
      p.on('debug', function (type, method, args) {
        if (type === 'Atok#' && method === 'loadRuleSet') {
          loadruleset_flag = true
          assert.equal(args[0], 'test')
        }
      })
      it('should emit [debug]', function (done) {
        p.debug(true)
        p.loadRuleSet('test')
        p.write('abc')
        assert(loadruleset_flag)
        done()
      })

      it('should not emit [debug]', function (done) {
        loadruleset_flag = false
        p.debug()
        p.loadRuleSet('test')
        p.write('abc')
        assert(!loadruleset_flag)
        done()
      })
    })

    describe('toggled on/off with a handler', function () {
      var p = new Tokenizer(options)
      var handler_flag = false

      p.addRule(1, function myHandler () {})
      p.saveRuleSet('test')
      p.on('debug', function (type, method, args) {
        if (type === 'Handler' && method === 'myHandler@test') {
          handler_flag = true
        }
      })
      it('should emit [debug]', function (done) {
        p.debug(true)
        p.loadRuleSet('test')
        p.write('abc')
        assert(handler_flag)
        done()
      })

      it('should not emit [debug]', function (done) {
        handler_flag = false
        p.debug()
        p.loadRuleSet('test')
        p.write('abc')
        assert(!handler_flag)
        done()
      })
    })
  })
})