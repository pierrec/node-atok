/*
 * Grouped rules tests
 */
var assert = require('assert')

var Tokenizer = require('..')

describe('Tokenizer Grouped Rules', function () {
  describe('with a positive jump and 1 group', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      function error () {
        done( new Error('Should not trigger') )
      }
      p.continue(1)
      p.addRule('a', 'first')
      p.continue()
      p.groupRule(true)
        p.addRule('a', error)
        p.addRule('a', error)
      p.groupRule()
      p.addRule('a', function () {
        done()
      })

      p.write('aa')
    })
  })

  describe('with a positive jump and 2 groups', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      function error () {
        done( new Error('Should not trigger') )
      }
      p.continue(3)
      p.addRule('a', 'first')
      p.continue()
      p.groupRule(true)
        p.addRule('a', error)
        p.addRule('a', error)
      p.groupRule()
      p.addRule('a', error)
      p.groupRule(true)
        p.addRule('a', error)
        p.addRule('a', error)
      p.groupRule()
      p.addRule('a', function () {
        done()
      })

      p.write('aa')
    })
  })

  describe('with a negative jump', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      var i = 0

      function error () {
        done( new Error('Should not trigger') )
      }
      function incr () {
        i++
        if (i === 2) done()
      }

      p.groupRule(true)
        p.addRule('a', incr)
        p.addRule('b', error)
      p.groupRule()
      p.continue(-2)
      p.addRule('c', 'continue')

      p.write('aca')
    })
  })

  describe('with a negative jump and 2 groups', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      var i = 0

      function error () {
        done( new Error('Should not trigger') )
      }
      function incr () {
        i++
        if (i === 2) done()
      }

      p.groupRule(true)
        p.addRule('a', incr)
        p.addRule('b', error)
      p.groupRule()
      p.addRule('b', error)
      p.groupRule(true)
        p.addRule('a', error)
        p.addRule('b', error)
      p.groupRule()
      p.continue(-4)
      p.addRule('c', 'continue')

      p.write('aca')
    })
  })
})