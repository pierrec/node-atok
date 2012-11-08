/*
 * Rules manipulation tests
**/
var assert = require('assert')

var Tokenizer = require('..')
var options = {}

describe('Tokenizer RuleSet Methods', function () {
  describe('#addRule', function () {
    describe('with missing parameters', function () {
      var p = new Tokenizer(options)
      it('should throw an Error', function (done) {
        assert.throws(
          function () {
            p.addRule()
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('with invalid last parameter', function () {
      var p = new Tokenizer(options)
      it('should throw an Error', function (done) {
        assert.throws(
          function () {
            p.addRule('a', true)
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('with null parameter', function () {
      var p = new Tokenizer(options)
      it('should throw an Error', function (done) {
        assert.throws(
          function () {
            p.addRule(null, 'dummy')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('with undefined parameter', function () {
      var p = new Tokenizer(options)
      it('should throw an Error', function (done) {
        assert.throws(
          function () {
            p.addRule(undefined, 'dummy')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('with handler', function () {
      var p = new Tokenizer(options)
      it('should set the rule with a handler', function (done) {
        p.addRule('a', function (token, idx, type) {
          done()
        })
        p.write('a')
      })
    })

    describe('with type, no default handler', function () {
      var p = new Tokenizer(options)
      it('should emit a token with the type', function (done) {
        p.on('data', function (token, idx, type) {
          done()
        })
        p.addRule('a', 'test')
        p.write('a')
      })
    })

    describe('with type, default handler', function () {
      var p = new Tokenizer(options)
      it('should call the default handler', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          assert.equal(type, 'test')
          done()
        })
        p.addRule('a', 'test')
        p.write('a')
      })
    })

    describe('with false subrule', function () {
      var p = new Tokenizer(options)
      it('should ignore the rule', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          assert.equal(type, 'test')
          done()
        })
        p.addRule('a', false)
        p.addRule('a', 'test')
        p.write('a')
      })
    })

    describe('with saved rule set', function () {
      var p = new Tokenizer(options)
      var i = 0

      it('should not affect the saved rule set', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          assert.equal(type, 'test')
          if (++i === 2) done()
        })
        p.addRule('a', 'test')
        p.saveRuleSet('test')
        p.addRuleFirst('a', 'aa')
        p.loadRuleSet('test')
        p.write('aa')
      })
    })
  })

  // Add a rule before all existing ones
  describe('#addRuleFirst', function () {
    describe('with existing rules', function () {
      var p = new Tokenizer(options)
      it('should run it first', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          assert.equal(type, 'second')
          done()
        })
        p.addRule('a', 'first')
        p.addRuleFirst('a', 'second')
        p.write('a')
      })
    })

    describe('with non-existing rule', function () {
      var p = new Tokenizer(options)
      it('should run it first', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          assert.equal(type, 'first')
          done()
        })
        p.addRuleFirst('a', 'first')
        p.write('a')
      })
    })
  })

  // Add a rule before an existing one
  describe('#addRuleBefore', function () {
    describe('with existing rule', function () {
      var p = new Tokenizer(options)
      it('should run it first', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          assert.equal(type, 'second')
          done()
        })
        p.addRule('a', 'first')
        p.addRuleBefore('first', 'a', 'second')
        p.write('a')
      })
    })

    describe('with non-existing rule', function () {
      var p = new Tokenizer(options)
      it('should throw an Error', function (done) {
        assert.throws(
          function () {
            p.addRule('a', 'first')
            p.addRuleBefore('first_', 'a', 'second')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })
  })

  // Add a rule after an existing one
  describe('#addRuleAfter', function () {
    describe('with existing rule', function () {
      var p = new Tokenizer(options)
      it('should run it second', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          assert.equal(type, 'second')
          done()
        })
        p.addRule('a', 'first')
        p.addRuleAfter('first', 'b', 'second')
        p.write('b')
      })
    })

    describe('with non-existing rule', function () {
      var p = new Tokenizer(options)
      it('should throw an Error', function (done) {
        assert.throws(
          function () {
            p.addRule('a', 'first')
            p.addRuleAfter('first_', 'a', 'second')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })
  })

  // Remove a rule
  describe('#removeRule', function () {
    describe('an existing rule referenced by a String', function () {
      var p = new Tokenizer(options)
      it('should remove it', function (done) {
        p.addRule('a', 'first')
        p.removeRule('first')
        assert.throws(
          function () {
            p.addRuleAfter('first', 'a', 'second')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('an existing rule referenced by a Number', function () {
      var p = new Tokenizer(options)
      it('should remove it', function (done) {
        p.addRule('a', 123)
        p.removeRule(123)
        assert.throws(
          function () {
            p.addRuleAfter(123, 'a', 'second')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('an existing rule referenced by a Function', function () {
      var p = new Tokenizer(options)
      it('should remove it', function (done) {
        function handler () {}
        p.addRule('a', handler)
        p.removeRule(handler)
        assert.throws(
          function () {
            p.addRuleAfter(handler, 'a', 'second')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('an existing rule referenced in another rule set', function () {
      var p = new Tokenizer(options)
      it('should remove it but keep the one in the other rule set', function (done) {
        p.addRule('a', 'first')
        p.saveRuleSet('test')
        p.removeRule('first')
        p.loadRuleSet('test')
        p.addRuleAfter('first', 'a', 'second')
        done()
      })
    })

    describe('an existing rule referenced in the current saved rule set', function () {
      var p = new Tokenizer(options)
      it('should remove it from the saved rule set', function (done) {
        p.addRule('a', 'first')
        p.saveRuleSet('test')
        p.clearRule()
        p.loadRuleSet('test')
        p.removeRule('first')
        p.addRuleFirst('a', 'second')
        p.on('data', function (token, idx, type) {
          switch (type) {
            case 'second':
              done()
            break
            default:
              done(new Error('Should not trigger'))
          }
        })
        p.write('a')
      })
    })
  })

  // Clear rules
  describe('#clearRule', function () {
    describe('an existing rule', function () {
      var p = new Tokenizer(options)
      it('should remove it', function (done) {
        p.addRule('a', 'first')
        p.addRule('b', 'second')
        p.clearRule()
        assert.throws(
          function () {
            p.addRuleAfter('first', 'a', 'second')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        assert.throws(
          function () {
            p.addRuleAfter('second', 'a', 'third')
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })
  })

  // Save a set of rules
  describe('#saveRuleSet', function () {
    describe('with a name', function () {
      var p = new Tokenizer(options)
      it('should save it', function (done) {
        p.addRule('a', 'first')
        p.addRule('b', 'second')
        p.saveRuleSet('myRules')
        assert.equal(p._savedRules.hasOwnProperty('myRules'), true)
        done()
      })
    })

    describe('with no name', function () {
      var p = new Tokenizer(options)
      it('should throw an Error', function (done) {
        assert.throws(
          function () {
            p.saveRuleSet()
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })
  })

  // Load a set of rules
  describe('#loadRuleSet', function () {
    describe('with a name', function () {
      var p = new Tokenizer(options)
      it('should load it', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          assert.equal(type, 'first')
          done()
        })
        p.addRule('a', 'first')
        p.saveRuleSet('myRules')
        p.clearRule()
        p.loadRuleSet('myRules')
        p.write('a')
      })
    })

    describe('with a given index', function () {
      var p = new Tokenizer(options)
      it('should load it at the given index', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          assert.equal(type, 'first')
          done()
        })
        p.addRule('b', 'skip')
        p.addRule('a', 'first')
        p.saveRuleSet('myRules')
        p.clearRule()
        p.loadRuleSet('myRules', 1)
        p.write('a')
      })
    })

    describe('with no name', function () {
      var p = new Tokenizer(options)
      it('should throw an Error', function (done) {
        assert.throws(
          function () {
            p.loadRuleSet()
          }
        , function (err) {
            if (err instanceof Error) return true
          }
        )
        done()
      })
    })

    describe('with modified rules in handler', function () {
      var p = new Tokenizer(options)
      it('should use new rules in next data checks', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          switch (type) {
            case 'first':
              assert.equal(i, 0)
              p.continue(0, 1)
              p.addRule('b', 'dummy')
              p.continue()
              p.addRule('a', 'error')
              p.addRule('a', 'done')
              break
            case 'done':
              assert.equal(i, 1)
              done()
              break
            default:
              done(new Error('Should not trigger'))
          }
          i++
        })
        var i = 0

        p.continue(0)
        p.addRule('a', 'first')
        p.continue()
        p.write('aa')
      })
    })
  })

  // Set the next rule
  describe('#next', function () {
    function nextHandler (done) {
      return function (token, idx, type) {
        switch (type) {
          case 'first':
          break
          case 'second':
            done()
          break
          default:
            done( new Error('unexpected type') )
        }
      }
    }

    describe('on non empty buffer', function () {
      var p = new Tokenizer(options)
      it('should set the next rule', function (done) {
        p.setDefaultHandler(nextHandler(done))
        p.addRule('b', 'second')
        p.saveRuleSet('myRules')
        p.clearRule()
        p.next('myRules')
        p.addRule('a', 'first')
        p.write('ab')
      })
    })

    describe('with given index', function () {
      var p = new Tokenizer(options)
      it('should set the next rule at the given index', function (done) {
        p.setDefaultHandler(nextHandler(done))
        p.addRule('a', 'first')
        p.addRule('b', 'second')
        p.saveRuleSet('myRules')
        p.clearRule()
        p.next('myRules', 1)
        p.addRule('a', 'first')
        p.write('ab')
      })
    })

    describe('on success', function () {
      var p = new Tokenizer(options)
      it('should set the next rule', function (done) {
        p.addRule('a', 'first')
        p.saveRuleSet('myRules')
        p.clearRule()
        p.next('myRules')
        p.addRule('a', 'first')
        p.write('ab')
        assert.equal(p.currentRule(), 'myRules')
        done()
      })
    })
  })

  // Delete a rule set
  describe('#removeRuleSet', function () {
    var p = new Tokenizer(options)
    it('should remove it', function (done) {
      p.addRule('a', 'first')
      p.saveRuleSet('myRules')
      p.removeRuleSet('myRules')
      assert.throws(
        function () {
          p.loadRuleSet('myRules')
        }
      , function (err) {
          if (err instanceof Error) return true
        }
      )
      done()
    })
  })
})