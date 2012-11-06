/*
 * Properties tests
**/
var assert = require('assert')

var Tokenizer = require('..')

describe('Tokenizer Supported Properties', function () {
  var props = {
    offset: isNumber
  , markedOffset: isNumber
  , length: isNumber
  , buffer: isString
  , writable: isBoolean
  , readable: isBoolean
  , ending: isBoolean
  }

  function isNumber () {
    return typeof arguments[0] === 'number'
  }
  function isString () {
    return typeof arguments[0] === 'string'
  }
  function isBoolean () {
    return typeof arguments[0] === 'boolean'
  }

  var p = new Tokenizer

  // Force the buffer instanciation
  p.write('a')

  Object.keys(props).forEach(function (prop) {
    describe('.' + prop, function () {
      it('should exist', function (done) {
        var check = props[prop]

        assert( check( p[prop] ) )
        done()
      })
    })
  })
})