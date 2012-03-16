/*
 * Rules properties methods tests
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer Properties Methods', function () {
  describe('#ignore', function () {
    describe('on non empty buffer', function () {
      var p = new Tokenizer(options)
      it('should ignore the token matching the rule', function (done) {
        p.ignore(true)
        p.addRule('a', function (token, idx, type) {
          done( new Error('should not trigger') )
        })
        p.ignore()
        p.addRule('b', function (token, idx, type) {
          done()
        })
        p.write('ab')
      })
    })

    // This makes non sense but is possible...
    describe('on empty buffer', function () {
      var p = new Tokenizer(options)
      var flag = false

      it('should ignore the handler', function (done) {
        p.ignore(true)
        p.addRule(1, 'consume data')
        p.addRule(0, function (token, idx, type) {
          flag = true
        })
        p.write('a')
        assert.deepEqual(flag, false)
        done()
      })
    })
  })

  describe('#quiet', function () {
    describe('on last Number rule', function () {
      var p = new Tokenizer(options)
      it('should give the token size', function (done) {
        p.quiet(true)
        p.addRule(1, function (token, idx, type) {
          assert.equal(token, 1)
          done()
        })
        p.write('a')
      })
    })

    describe('on non last Number rule', function () {
      var p = new Tokenizer(options)
      it('should not apply', function (done) {
        p.quiet(true)
        p.addRule(3, 'c', function (token, idx, type) {
          assert.equal(token, 'abc')
          done()
        })
        p.write('abc')
      })
    })

    describe('on Empty rule', function () {
      var p = new Tokenizer(options)
      it('should give the token size', function (done) {
        p.quiet(true)
        p.addRule('', function (token, idx, type) {
          assert.equal(token, 3)
          done()
        })
        p.write('abc')
      })
    })

    describe('on non Number/non Empty rule', function () {
      var p = new Tokenizer(options)
      it('should give the token size', function (done) {
        p.quiet(true)
        p.addRule('a', 'c', function (token, idx, type) {
          assert.equal(token, 1)
          done()
        })
        p.write('abc')
      })
    })
  })

  describe('#escaped', function () {
    describe('on unescaped char with default escape char', function () {
      var p = new Tokenizer(options)
      it('should apply', function (done) {
        p.escaped(true)
        p.addRule('"', '"', function (token, idx, type) {
          assert.equal(token, 'b')
          done()
        })
        p.write('"b"')
      })
    })

    describe('on unescaped char with default escape char', function () {
      var p = new Tokenizer(options)
      it('should apply', function (done) {
        p.escaped(true)
        p.addRule('"', '"', function (token, idx, type) {
          assert.equal(token, 'b\\\\')
          done()
        })
        p.write( '"b\\\\"' )
      })
    })

    describe('on escaped char with default escape char', function () {
      var p = new Tokenizer(options)
      it('should apply', function (done) {
        p.escaped(true)
        p.addRule('"', '"', function (token, idx, type) {
          assert.equal(token, 'b\\\"')
          done()
        })
        p.write( '"b\\""' )
      })
    })

    describe('on unescaped char with custom escape char', function () {
      var p = new Tokenizer(options)
      it('should apply', function (done) {
        p.escaped('~')
        p.addRule('"', '"', function (token, idx, type) {
          assert.equal(token, 'b')
          done()
        })
        p.write('"b"')
      })
    })

    describe('on escaped char with custom escape char', function () {
      var p = new Tokenizer(options)
      it('should apply', function (done) {
        p.escaped('~')
        p.addRule('"', '"', function (token, idx, type) {
          assert.equal(token, 'b~"')
          done()
        })
        p.write( '"b~""' )
      })
    })

    describe('with firstOf', function () {
      describe('on unescaped char with default escape char', function () {
        var p = new Tokenizer(options)
        it('should apply', function (done) {
          p.escaped(true)
          p.addRule('a', { firstOf: [' ',','] }, function (token, idx, type) {
            assert.equal(token, 'bc')
            done()
          })
          p.write('abc, ')
        })
      })

      describe('on unescaped char with default escape char', function () {
        var p = new Tokenizer(options)
        it('should apply', function (done) {
          p.escaped(true)
          p.addRule('a', { firstOf: [' ',','] }, function (token, idx, type) {
            assert.equal(token, 'bc\\,')
            done()
          })
          p.write( 'abc\\, ' )
        })
      })

      describe('on escaped char with default escape char', function () {
        var p = new Tokenizer(options)
        it('should apply', function (done) {
          p.escaped(true)
          p.addRule('a', { firstOf: [' ',','] }, function (token, idx, type) {
            assert.equal(token, 'bc\\\\')
            done()
          })
          p.write( 'abc\\\\, ' )
        })
      })

      describe('on unescaped char with custom escape char', function () {
        var p = new Tokenizer(options)
        it('should apply', function (done) {
          p.escaped('~')
          p.addRule('A', { firstOf: [' ',','] }, function (token, idx, type) {
            assert.equal(token, 'b')
            done()
          })
          p.write('Ab, ')
        })
      })

      describe('on escaped char with custom escape char', function () {
        var p = new Tokenizer(options)
        it('should apply', function (done) {
          p.escaped('~')
          p.addRule('a', { firstOf: [' ',','] }, function (token, idx, type) {
            assert.equal(token, 'b~,')
            done()
          })
          p.write( 'ab~, ' )
        })
      })
    })
  })

  describe('#break', function () {
    describe('with no #continue', function () {
      var p = new Tokenizer(options)
      it('should upon match abort the current rule and resume from the start', function (done) {
        var i = 0
        p.break(true)
        p.addRule('a', function (token, idx, type) {
          p.addRuleFirst('a', function first(token, idx, type) {
            i++
          })
        })
        p.break()
        p.write('a')
        p.write('a')
        assert.equal(i, 1)
        done()
      })
    })

    describe('with #continue(0)', function () {
      var p = new Tokenizer(options)
      it('should upon match abort the current rule and resume from the aborted subrule', function (done) {
        var i = 0
        p.break(true).continue(0)
        p.addRule('a', function (token, idx, type) {
          i++
          p.addRuleFirst('a', function (token, idx, type) {
          })
        })
        p.break().continue()
        p.write('a')
        p.write('a')
        assert.equal(i, 2)
        done()
      })
    })
  })

  describe('#continue', function () {
    describe('with a positive jump', function () {
      var p = new Tokenizer(options)
      it('should upon match continue at the indexed rule', function (done) {
        var i = 0
        p.continue(0)
        p.addRule('a', function (token, idx, type) {
          i++
        })
        p.continue()
        p.addRule('b', function (token, idx, type) {
          assert(i, 1)
          done()
        })
        p.write('ab')
      })
    })

    describe('with a negative jump', function () {
      var p = new Tokenizer(options)
      it('should upon match continue at the previous indexed rule', function (done) {
        var i = 0
        p.continue(-1)
        p.addRule('a', function (token, idx, type) {
          i++
        })
        p.continue()
        p.addRule(0, function (token, idx, type) {
          assert(i, 2)
          done()
        })
        p.write('aa')
      })
    })

    describe('while paused', function () {
      var p = new Tokenizer(options)
      it('should continue at the indexed rule', function (done) {
        p.continue(1)
        p.addRule('a', function (token, idx, type) {
          p.pause()
        })
        p.continue()
        p.addRule(' ', 'no match')
        p.addRule('b', function (token, idx, type) {
          done()
        })
        p.write('ab')
        p.resume()
      })
    })

    describe('with a string defined rule', function () {
      var p = new Tokenizer(options)
      it('should define the continue index after #saveRuleSet()', function (done) {
        p.continue('a')
        p.addRule('a', 'a')
        p.continue()
        p.addRule('b', function (token, idx, type) {
          done()
        })
        p.saveRuleSet('stringContinueTest')
        p.write('aab')
      })
    })

    describe('with a function defined rule', function () {
      var p = new Tokenizer(options)
      it('should define the continue index after #saveRuleSet()', function (done) {
        function test () {}

        p.continue(test)
        p.addRule('a', test)
        p.continue()
        p.addRule('b', function (token, idx, type) {
          done()
        })
        p.saveRuleSet('stringContinueTest')
        p.write('aab')
      })
    })

    describe('with an invalid rule', function () {
      var p = new Tokenizer(options)
      it('should throw', function (done) {
        assert.throws(
          function () {
            p.continue(true)
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('with a rule set modified with #loadRuleSet()', function () {
      var p = new Tokenizer(options)
      it('should reset the index', function (done) {
        p.addRule('b', function (token, idx, type) {
          done()
        })
        p.saveRuleSet('b')

        p.continue(0)
        p.addRule('a', function (token, idx, type) {
          p.loadRuleSet('b')
        })
        p.addRule('b', function (token, idx, type) {
          done( new Error('Should not trigger') )
        })
        
        p.write('ab')
      })
    })

    describe('with a rule set modified with #next()', function () {
      var p = new Tokenizer(options)
      it('should reset the index', function (done) {
        p.addRule('b', function (token, idx, type) {
          done()
        })
        p.saveRuleSet('b')

        p.next('b')
        p.addRule('a', 'a')
        p.addRule('b', function (token, idx, type) {
          done( new Error('Should not trigger') )
        })
        
        p.write('ab')
      })
    })
  })

  describe('#saveProps', function () {
    var p = new Tokenizer(options)
    var props = []

    for (prop in p)
      if (p.hasOwnProperty(prop) && /^_p_/.test(prop)) props.push( prop.substr(3) )

    it('should save the current properties', function (done) {
      var saved = {}
      
      // Change all properties
      for (var prop, i = 0, n = props.length; i < n; i++) {
        prop = props[i]
        switch (prop) {
          case 'escape':
            p.escaped('\\')
            saved.escape = '\\'
          break
          case 'continue':
            p.continue(123)
            saved.continue = 123
          break
          case 'next':
            p.next('ruleSet')
            saved.next = 'ruleSet'
          break
          default:
            p[ prop ](true)
            saved[prop] = true
        }
      }
      p.saveProps()

      assert.deepEqual(p.savedProps.default, saved)
      done()
    })
  })

  describe('#loadProps', function () {
    var p = new Tokenizer(options)
    var props = []

    for (prop in p)
      if (p.hasOwnProperty(prop) && /^_p_/.test(prop)) props.push( prop.substr(3) )

    it('should load the current properties', function (done) {
      p.saveProps()

      var saved = p.savedProps
      
      // Change all properties
      for (var prop, i = 0, n = props.length; i < n; i++) {
        prop = props[i]
        switch (prop) {
          case 'escape':
            p.escaped('\\')
          break
          case 'continue':
            p.continue(123)
          break
          case 'next':
            p.next('ruleSet')
          break
          default:
            p[ prop ](true)
        }
      }
      p.loadProps()

      assert.deepEqual(p.savedProps, saved)
      done()
    })
  })

  describe('#clearProps', function () {
    var p = new Tokenizer(options)
    var props = []

    for (prop in p)
      if (p.hasOwnProperty(prop) && /^_p_/.test(prop)) props.push( prop.substr(3) )

    it('should reset the properties', function (done) {
      var saved = p.savedProps
      
      // Change all properties
      for (var prop, i = 0, n = props.length; i < n; i++) {
        prop = props[i]
        switch (prop) {
          case 'escape':
            p.escaped('\\')
          break
          case 'continue':
            p.continue(123)
          break
          case 'next':
            p.next('ruleSet')
          break
          default:
            p[ prop ](true)
        }
      }
      p.clearProps()

      assert.deepEqual(p.savedProps, saved)
      done()
    })
  })
})