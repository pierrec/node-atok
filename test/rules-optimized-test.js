/*
 * Optimized rules tests
 */
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Optimized Rules', function () {
  describe('ignore(true).continue(-1)', function () {
    describe('string', function () {
      var p = new Tokenizer(options)

      it('should trigger on match', function (done) {
        p.ignore(true).continue(-1)
        p.addRule('aa', 'consume')
        p.ignore().continue()
        p.addRule('a', function (token, idx, type) {
            done()
          }
        )
        p.write('aaaaa')
      })
    })

    describe('string array', function () {
      var p = new Tokenizer(options)

      it('should trigger on match', function (done) {
        p.ignore(true).continue(-1)
        p.addRule(['aa','bb'], 'consume')
        p.ignore().continue()
        p.addRule('b', function (token, idx, type) {
            done()
          }
        )
        p.write('aaaabbbbb')
      })
    })

    describe('range object with start and end', function () {
      var p = new Tokenizer(options)

      it('should trigger on match', function (done) {
        p.ignore(true).continue(-1)
        p.addRule({ start: 'a', end: 'z' }, 'consume')
        p.ignore().continue()
        p.addRule('', function (token, idx, type) {
            done()
          }
        )
        p.write('aazaabA')
      })
    })

    describe('range object with start', function () {
      var p = new Tokenizer(options)

      it('should trigger on match', function (done) {
        p.ignore(true).continue(-1)
        p.addRule({ start: 'a' }, 'consume')
        p.ignore().continue()
        p.addRule('', function (token, idx, type) {
            done()
          }
        )
        p.write('aazaabA')
      })
    })

    describe('range object with end', function () {
      var p = new Tokenizer(options)

      it('should trigger on match', function (done) {
        p.ignore(true).continue(-1)
        p.addRule({ end: 'z' }, 'consume')
        p.ignore().continue()
        p.addRule('', function (token, idx, type) {
            done()
          }
        )
        p.write('aazaab~')
      })
    })
  })
})