/*
 * First subrule tests
 * the first subrule must always be validated
 */
var assert = require('assert')

var Tokenizer = require('..')

describe('Tokenizer First SubRule', function () {
  describe('with number', function () {
    var p = new Tokenizer
    var flag

    it('should wait for more data', function (done) {
      p.addRule(2, function () {
        flag = true
      })
      p.addRule(1, function () {
        flag = false
      })
      p.write('a')
      p.write('a')
      assert(flag)
      done()
    })
  })

  describe('with array of number', function () {
    var p = new Tokenizer
    var flag

    it('should wait for more data', function (done) {
      p.addRule([2,3], function () {
        flag = true
      })
      p.addRule(1, function () {
        flag = false
      })
      p.write('a')
      p.write('a')
      p.write('a')
      assert(flag)
      done()
    })
  })

  describe('with string', function () {
    var p = new Tokenizer
    var flag

    it('should wait for more data', function (done) {
      p.addRule('aa', function () {
        flag = true
      })
      p.addRule('a', function () {
        flag = false
      })
      p.write('a')
      p.write('a')
      assert(flag)
      done()
    })
  })

  describe('with array of string', function () {
    var p = new Tokenizer
    var flag

    it('should wait for more data', function (done) {
      p.addRule(['aa','bb'], function () {
        flag = true
      })
      p.addRule(1, function () {
        flag = false
      })
      p.write('a')
      p.write('a')
      assert(flag)
      done()
    })
  })

  describe('with empty string', function () {
    var p = new Tokenizer
    var flag

    it('should not wait for more data', function (done) {
      p.addRule('', 'a', function () {
        flag = true
      })
      p.addRule('a', function () {
        flag = false
      })
      p.write('a')
      p.write('a')
      assert(flag)
      done()
    })
  })
})