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
        p.addRule(1, 0, function (token, idx, type) {
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
        p.quiet(true).trim()
        p.addRule(1, function (token, idx, type) {
          assert.equal(token, 1)
          done()
        })
        p.write('a')
      })
    })

    describe('on non last Number rule', function () {
      var p = new Tokenizer(options)
      it('should apply', function (done) {
        p.quiet(true).trim()
        p.addRule(3, 'c', function (token, idx, type) {
          assert.equal(token, 4)
          done()
        })
        p.write('aabc')
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
        p.escape(true)
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
        p.escape(true)
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
        p.escape(true)
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
        p.escape('~')
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
        p.escape('~')
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
          p.escape(true)
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
          p.escape(true)
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
          p.escape(true)
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
          p.escape('~')
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
          p.escape('~')
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
          p.addRuleFirst('a', function first (token, idx, type) {
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

    describe('with #continue(-1)', function () {
      var p = new Tokenizer(options)
      it('should upon match abort the current rule and resume from the aborted subrule', function (done) {
        var i = 0
        p.break(true).continue(-1)
        p.addRule('a', function (token, idx, type) {
          i++
          p.addRuleFirst('a', function first (token, idx, type) {
          })
        })
        p.break().continue()
        p.addRule(1, 'dummy')
        p.write('a')
        p.write('a')
        assert.equal(i, 2)
        done()
      })
    })

    describe('reentrant', function () {
      var p = new Tokenizer(options)
      it('should resume from the start', function (done) {
        var i = 0
        p.break(true).continue(0)
        p.addRule('a', function (token, idx, type) {
            i++
        })
        p.break().continue()
        p.addRule('a', function (token, idx, type) {
        })

        p.write('a')
        p.write('a')
        p.write('a')
        assert.equal(i, 2)
        done()
      })
    })
  })

  describe('#continue', function () {
    describe('with no argument', function () {
      var p = new Tokenizer(options)
      it('should be valid', function (done) {
        assert.doesNotThrow(
          function () {
            p.continue()
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('with null argument', function () {
      var p = new Tokenizer(options)
      it('should be valid', function (done) {
        assert.doesNotThrow(
          function () {
            p.continue(null)
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('with null as second argument', function () {
      var p = new Tokenizer(options)
      it('should be valid', function (done) {
        assert.doesNotThrow(
          function () {
            p.continue(null, null)
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

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
        p.on('empty', function (token, idx, type) {
          assert(i, 2)
          done()
        })
        p.write('aa')
      })
    })

    describe('with a positive second argument', function () {
      var p = new Tokenizer(options)
      it('should upon failure continue at the specified indexed rule', function (done) {
        var i = 0
        p.continue(null, 1)
        p.addRule('a', 'first')
        p.continue()
        p.addRule('a', function () {
          done( new Error('Shoud not trigger') )
        })
        p.addRule('b', function (token, idx, type) {
          done()
        })
        p.write('b')
      })
    })

    describe('with a negative second argument', function () {
      var p = new Tokenizer(options)
      it('should upon failure continue at the specified indexed rule', function (done) {
        p.continue(1)
        p.addRule('a', 'first')
        p.continue(0, 1)
        p.addRule('b', function (token, idx, type) {
          done()
        })
        p.continue(0, -2)
        p.addRule('a', 'second')
        p.continue()
        p.addRule('b', function () {
          done( new Error('Shoud not trigger') )
        })
        p.write('ab')
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
        var i = 0
        p.continue('end')
        p.addRule('a', 'a')
        p.continue()
        p.addRule('a', 'end')
        p.saveRuleSet('stringContinueTest')
        p.loadRuleSet('stringContinueTest')

        p.on('data', function (token, idx, type) {
          switch (type) {
            case 'a':
              if (i > 0) done(new Error('Too many calls'))
              i++
              break
            case 'end':
              p.pause()
              done()
              break
            default:
              done(new Error('Invalid type: ' + type))
          }
        })
        p.write('aaa')
      })
    })

    describe('with a function defined rule', function () {
      var p = new Tokenizer(options)
      it('should define the continue index after #saveRuleSet()', function (done) {
        function test () {
          p.pause()
          done()
        }

        var i = 0
        p.continue(test)
        p.addRule('a', 'a')
        p.continue()
        p.addRule('a', test)
        p.saveRuleSet('stringContinueTest')
        p.loadRuleSet('stringContinueTest')

        p.on('data', function (token, idx, type) {
          if (type === 'a') {
            if (i > 0) done(new Error('Too many calls'))
            i++
          }
        })
        p.write('aaa')
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

    describe('with an index pointing to the end of the rule set', function () {
      var p = new Tokenizer(options)
      it('should complete', function (done) {
        p.continue(0)
        p.addRule(1, 'consume')
        p.write('a')
        done()
      })
    })

    describe('with an index on failure pointing to the end of the rule set', function () {
      var p = new Tokenizer(options)
      it('should complete', function (done) {
        p.continue(-1, 0)
        p.addRule('a', 'consume')
        p.write('b')
        done()
      })
    })

    describe('with an invalid positive index', function () {
      var p = new Tokenizer(options)
      it('should throw on saveRuleSet()', function (done) {
        assert.throws(
          function () {
            p.continue(999)
            p.addRule(1, 'dummy')
            p.saveRuleSet('test')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })

      it('should throw on write()', function (done) {
        assert.throws(
          function () {
            p.continue(999)
            p.addRule(1, 'dummy')
            p.write('test')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('with an invalid negative index', function () {
      var p = new Tokenizer(options)
      it('should throw on saveRuleSet()', function (done) {
        assert.throws(
          function () {
            p.continue(-999)
            p.addRule(1, 'dummy')
            p.saveRuleSet('test')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })

      it('should throw on write()', function (done) {
        assert.throws(
          function () {
            p.continue(-999)
            p.addRule(1, 'dummy')
            p.write('test')
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
        p.continue()
        p.addRule('b', function (token, idx, type) {
          done( new Error('Should not trigger') )
        })
        
        p.write('ab')
      })
    })

    describe('with an initial #loadRuleSet()', function () {
      var p = new Tokenizer(options)

      it('should not reset the index', function (done) {
        p.continue(1)
        p.addRule('a', 'a')
        p.addRule(function () { return 0 }, 'noop')
        p.addRule('b', function (token, idx, type) {
          done()
        })
        p.continue()
        p.addRule('', function (token, idx, type) {
          done( new Error('Should not trigger') )
        })
        p.addRule(1, 'dummy') // To avoid error as continue(0) is set on the last rule
        p.saveRuleSet('a')

        p.loadRuleSet('a')
        
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

    describe('with split data', function () {
      var p = new Tokenizer(options)
      it('should not reset the index', function (done) {
        p.continue(0)
        p.addRule('a', 'a')
        p.addRule('a', function handler (token, idx, type) {
          done()
        })

        p.write('a')
        p.write('a')
      })
    })
  })

  describe('#getProps', function () {
    var p = new Tokenizer(options)

    it('should load the current properties', function (done) {
      var props = p.getProps()
      var propNames = Object.keys(props)

      assert(propNames.length > 0)
      done()
    })
  })

  describe('#setProps', function () {
    var p = new Tokenizer(options)
    var props = Object.keys( p.getProps() )

    it('should save the current properties', function (done) {
      var saved = {}
      
      // Change all properties
      for (var prop, i = 0, n = props.length; i < n; i++) {
        prop = props[i]
        switch (prop) {
          case 'escape':
            p.escape('\\')
            saved.escape = '\\'
          break
          case 'continue':
            p.continue(123, 456)
            saved.continue = [123, 456]
          break
          case 'next':
            p.next('ruleSet')
            saved.next = ['ruleSet', 0]
          break
          default:
            p[ prop ](true)
            saved[prop] = true
        }
      }
      p.setProps(saved)

      assert.deepEqual( p.getProps(), saved )
      done()
    })
  })

  describe('#clearProps', function () {
    var p = new Tokenizer(options)
    var props = Object.keys( p.getProps() )

    it('should reset the properties', function (done) {
      var saved = p.savedProps
      
      // Change all properties
      for (var prop, i = 0, n = props.length; i < n; i++) {
        prop = props[i]
        switch (prop) {
          case 'escape':
            p.escape('\\')
          break
          case 'continueOnFail':
            p.continue(123, 456)
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