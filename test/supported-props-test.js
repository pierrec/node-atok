/*
 * Properties tests
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Supported Properties', function () {
  var props = {
    offset: isNumber
  , offsetBuffer: isNumber
  , length: isNumber
  , buffer: isString
  , writable: isBoolean
  , readable: isBoolean
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

  var p = new Tokenizer(options)

  Object.keys(props).forEach(function (prop) {
    describe(prop, function () {
      it('should exist', function (done) {
        var check = props[prop]

        assert.equal( check( p[prop] ), true )
        done()
      })
    })
  })
})