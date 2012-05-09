/*
 * Special rules tests
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Special Rules', function () {
  describe('single function', function () {
    var p = new Tokenizer(options)

    it('should return 0 match', function (done) {
      p.addRule(function (matched) {
        assert.equal(matched, 0)
        done()
      })
      p.write('abc')
    })
  })
})