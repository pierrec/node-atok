/*
 * Custom rule tests
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Custom Rules', function () {
  describe('valid function', function () {
    var p = new Tokenizer(options)

    it('should trigger on match', function (done) {
      var flag = false

      p.addRule(function (data, start) {
          flag = true
          return start > 0
        }
      , function (token, idx, type) {
          assert.equal(flag, true)
          done()
        }
      )
      p.write('abc')
    })
  })
})