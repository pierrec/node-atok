/*
 * Methods tests
**/
var assert = require('assert')

var Tokenizer = require('..')

describe('Tokenizer Supported Methods', function () {
  var methods = [
  // Stream
    'write'
  , 'end'
  , 'pause'
  , 'resume'
  , 'pipe'
  , 'destroy'
  // Properties
  , 'continue'
  , 'next'
  , 'quiet'
  , 'ignore'
  , 'trim'
  , 'trimLeft'
  , 'trimRight'
  , 'setDefaultHandler'
  , 'escape'
  , 'break'
  , 'getProps'
  , 'setProps'
  , 'clearProps'
  // Rules
  , 'addRuleFirst'
  , 'addRuleBefore'
  , 'addRuleAfter'
  , 'addRule'
  , 'removeRule'
  , 'clearRule'
  // Rule sets
  , 'saveRuleSet'
  , 'loadRuleSet'
  , 'removeRuleSet'
  // Misc
  , 'setEncoding'
  , 'clear'
  , 'flush'
  , 'debug'
  , 'slice'
  , 'currentRule'
  ]

  var p = new Tokenizer

  methods.forEach(function (method) {
    describe('#' + method, function () {
      it('should exist', function (done) {
        assert.equal( typeof p[method], 'function' )
        done()
      })
    })
  })
})