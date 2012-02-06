/*
 * Events tests
**/
var assert = require('assert')
var fs = require('fs')
var path = require('path')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Events', function () {
  describe('match', function () {
    var p = new Tokenizer(options)
    it('should emit on matched rule', function (done) {
      p.on('match', function (offset, bufferLength, matched, tokenLength, type) {
        assert.equal(offset, 0)
        assert.equal(bufferLength, 3)
        assert.equal(matched, 3)
        assert.equal(tokenLength, 1)
        assert.equal(type, 'first')
        done()
      })
      p.addRule('a', 'c', 'first')
      p.write('abc')
    })
  })

  describe('nomatch', function () {
    var p = new Tokenizer(options)
    it('should emit on no match', function (done) {
      p.on('nomatch', function (offset, bufferLength) {
        assert.equal(offset, 3)
        assert.equal(bufferLength, 4)
        done()
      })
      p.addRule('a', 'c', 'first')
      p.write('abcd')
    })
  })

  describe('empty', function () {
    var p = new Tokenizer(options)
    it('should emit on empty buffer', function (done) {
      p.on('empty', function () {
        assert.equal(p.offset, 0)
        assert.equal(p.length, 0)
        done()
      })
      p.addRule('a', 'c', 'first')
      p.write('abc')
    })
  })
})