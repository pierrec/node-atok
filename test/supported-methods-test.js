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
  // Properties
  , 'continue'
  , 'next'
  , 'quiet'
  , 'ignore'
  , 'trim'
  , 'trimLeft'
  , 'trimRight'
  , 'setDefaultHandler'
  , 'escaped'
  , 'break'
  , 'saveProps'
  , 'loadProps'
  , 'getProps'
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
  , 'deleteRuleSet'
  // Misc
  , 'setEncoding'
  , 'seek'
  , 'clear'
  , 'flush'
  , 'debug'
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