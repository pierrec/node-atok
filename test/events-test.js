/*
 * Emitted events tests
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Events', function () {
  describe('[match]', function () {
    var p = new Tokenizer(options)
    it('should emit [match] when a rule matches', function (done) {
      var matches = 0
      p.addRule(1, 'consume data')
      p.addRule(0, function (token, idx, type) {
        assert.equal(matches, 3)
        done()
      })
      p.on('match', function (offset) {
        // Should be the current offset
        assert.equal(offset, matches)
        matches++
      })
      p.write('abc')
    })
  })

  describe('[empty]', function () {
    describe('while not ending', function () {
      var p = new Tokenizer(options)
      it('should emit [empty] when a rule matches', function (done) {
        p.addRule(1, 'consume data')
        p.on('empty', function (ending) {
          // Should be the current ending status
          assert.equal(ending, false)
          done()
        })
        p.write('abc')
      })
    })

    describe('while ending', function () {
      var p = new Tokenizer(options)
      it('should emit [empty] when a rule matches', function (done) {
        p.addRule(1, 'consume data')
        p.on('empty', function (ending) {
          // Should be the current ending status
          assert.equal(ending, true)
          done()
        })
        p.end('abc')
      })
    })
  })
})