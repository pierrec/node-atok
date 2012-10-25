/*
 * Handler signature tests
 */
var assert = require('assert')

var Tokenizer = require('..')

describe('Handler signature', function () {
  describe('with handler', function () {
    var p = new Tokenizer

    function handler (token, idx, type) {
      assert.equal(type, null)
    }

    p.addRule('a', handler)

    it('should be set the type to null', function (done) {
      p.write('a')
      done()
    })
  })

  describe('without handler', function () {
    var p = new Tokenizer

    p.addRule('a', 'mytype')

    it('should be set the type', function (done) {
      p.on('data', function handler (token, idx, type) {
        assert.equal(type, 'mytype')
      })
      p.write('a')
      done()
    })
  })

  describe('without indexed rule', function () {
    var p = new Tokenizer

    p.addRule('a', 'mytype')

    it('should be not set the index', function (done) {
      p.on('data', function handler (token, idx, type) {
        assert.equal(idx, -1)
      })
      p.write('a')
      done()
    })
  })

  describe('with array rule', function () {
    var p = new Tokenizer

    p.addRule(['b','a'], 'mytype')

    it('should be set the index', function (done) {
      p.on('data', function handler (token, idx, type) {
        assert.equal(idx, 1)
      })
      p.write('a')
      done()
    })
  })

  describe('with number array rule', function () {
    var p = new Tokenizer

    p.addRule([3,1], 'mytype')

    it('should be set the index', function (done) {
      p.on('data', function handler (token, idx, type) {
        assert.equal(idx, 1)
      })
      p.write('a')
      done()
    })
  })

  describe('with firstOf rule', function () {
    var p = new Tokenizer

    p.addRule('', { firstOf: ['b','a'] }, 'mytype')

    it('should be set the index', function (done) {
      p.on('data', function handler (token, idx, type) {
        assert.equal(idx, 1)
      })
      p.write('a')
      done()
    })
  })

  describe('with escaped firstOf rule', function () {
    var p = new Tokenizer

    p.escape(true)
    p.addRule('', { firstOf: ['b','a'] }, 'mytype')

    it('should be set the index', function (done) {
      p.on('data', function handler (token, idx, type) {
        assert.equal(idx, 1)
      })
      p.write('a')
      done()
    })
  })

  describe('with range rule', function () {
    var p = new Tokenizer

    p.addRule({ start: 'ba' }, 'mytype')

    it('should be set the index', function (done) {
      p.on('data', function handler (token, idx, type) {
        assert.equal(idx, 1)
      })
      p.write('a')
      done()
    })
  })
})