/*
 * Custom rule tests
 */
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
          return 0
        }
      , function (token, idx, type) {
          assert(flag)
          assert.equal(token, 0)
          assert.equal(idx, -1)
          assert.equal(type, null)
          done()
        }
      )
      p.write('a')
    })
  })
})