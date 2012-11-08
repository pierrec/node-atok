/*
 * Method setEncoding tests
 */
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer setEncoding', function () {
  describe('unset', function () {

    it('should process strings properly', function (done) {
      var p = new Tokenizer(options)
      p.trim()
      p.addRule(1, function (data, idx, type) {
        assert( typeof data === 'string' )
        assert.equal(data, 'a')
        done()
      })
      p.write('a')
    })

    it('should process buffers properly', function (done) {
      var p = new Tokenizer(options)
      p.trim()
      p.addRule(1, function (data, idx, type) {
        assert( Buffer.isBuffer(data) )
        assert.equal(data.toString(), 'a')
        done()
      })
      p.write( new Buffer('a') )
    })
  })

  describe('set', function () {

    it('should process strings properly', function (done) {
      var p = new Tokenizer(options)

      p.setEncoding('utf-8')
      p.trim()
      p.addRule(1, function (data, idx, type) {
        assert( typeof data === 'string' )
        assert.equal(data, 'a')
        done()
      })
      p.write('a')
    })

    it('should process buffers properly', function (done) {
      var p = new Tokenizer(options)
      
      p.setEncoding('utf-8')
      p.trim()
      p.addRule(1, function (data, idx, type) {
        assert( typeof data === 'string' )
        assert.equal(data, 'a')
        done()
      })
      p.write( new Buffer('a') )
    })
  })

  describe('set then unset', function () {

    it('should process strings properly', function (done) {
      var p = new Tokenizer(options)

      p.setEncoding('utf-8')
      p.setEncoding()
      p.trim()
      p.addRule(1, function (data, idx, type) {
        assert( typeof data === 'string' )
        assert.equal(data, 'a')
        done()
      })
      p.write('a')
    })

    it('should process buffers properly', function (done) {
      var p = new Tokenizer(options)
      
      p.setEncoding('utf-8')
      p.setEncoding()
      p.trim()
      p.addRule(1, function (data, idx, type) {
        assert( Buffer.isBuffer(data) )
        assert.equal(data.toString(), 'a')
        done()
      })
      p.write( new Buffer('a') )
    })
  })
})