/*
 * markedOffset tests
 */
var assert = require('assert')

var Tokenizer = require('..')

describe('Tokenizer markedOffset Property', function () {
  describe('with markedOffset unset', function () {
    var p = new Tokenizer
    p.addRule(1, 'data')

    it('should truncate the buffer', function (done) {
      assert.equal(p.length, 0)
      p.write('aa')
      assert.equal(p.length, 0)
      assert.equal(p.offset, 0)
      done()
    })
  })

  describe('with markedOffset < offset', function () {
    var p = new Tokenizer
    p.addRule(1, 'data')

    it('should not truncate the buffer', function (done) {
      assert.equal(p.length, 0)
      p.markedOffset = 1
      p.write('aa')
      assert.equal(p.length, 1)
      assert.equal(p.markedOffset, 0)
      assert.equal(p.offset, 1)
      done()
    })
  })

  describe('with markedOffset > offset', function () {
    var p = new Tokenizer
    p.addRule(1, 'data')

    it('should truncate the buffer', function (done) {
      assert.equal(p.length, 0)
      p.markedOffset = 3
      p.write('aa')
      assert.equal(p.length, 0)
      assert.equal(p.markedOffset, 1)
      assert.equal(p.offset, 0)
      done()
    })
  })

  describe('with markedOffset == offset', function () {
    var p = new Tokenizer
    p.addRule(1, 'data')

    it('should truncate the buffer', function (done) {
      assert.equal(p.length, 0)
      p.markedOffset = 2
      p.write('aa')
      assert.equal(p.length, 0)
      assert.equal(p.markedOffset, 0)
      assert.equal(p.offset, 0)
      done()
    })
  })
})