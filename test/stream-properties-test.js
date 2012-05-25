/*
 * Stream properties tests
 */
var assert = require('assert')
var fs = require('fs')
var path = require('path')

var Tokenizer = require('..')

describe('Tokenizer Stream Properties', function () {
  describe('after end()', function () {
    var p = new Tokenizer

    it('should be false', function (done) {
      p.end()
      assert(!p.writable)
      assert(!p.readable)
      done()
    })
  })

  describe('after destroy()', function () {
    var p = new Tokenizer

    it('should be false', function (done) {
      p.destroy()
      assert(!p.writable)
      assert(!p.readable)
      done()
    })
  })

  describe('after an error', function () {
    var p = new Tokenizer

    it('should be false', function (done) {
      p.on('error', function () {})
      p._error( new Error('Dummy') )

      assert(!p.writable)
      assert(!p.readable)
      done()
    })
  })
})
