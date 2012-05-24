/*
 * UTF-8 tests
 */
var assert = require('assert')

var Tokenizer = require('..')

describe('Tokenizer UTF-8 Support', function () {
  describe('split strings', function () {
    var p = new Tokenizer

    p.addRule('\u00C0', 'data')

    it('should be properly processed', function (done) {
      p.on('data', function (token, idx, type) {
        assert.equal(type, 'data')
        done()
      })

      var buf = new Buffer(2)
      buf.write('\u00C0')

      p.write( buf.slice(0,1) )
      p.write( buf.slice(1,2) )
    })
  })
})