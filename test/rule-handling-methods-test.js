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
            p.addRule('a')
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
        assert.equal(p.saved.hasOwnProperty('myRules'), true)
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
  })

  // Set the next rule
  describe('#next', function () {
    describe('on non empty buffer', function () {
      var p = new Tokenizer(options)
      it('should set the next rule', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          switch(type) {
            case 'first':
            break
            case 'second':
              done()
            break
            default:
              done( new Error('unexpected type') )
          }
        })
        p.addRule('b', 'second')
        p.saveRuleSet('myRules')
        p.clearRule()
        p.next('myRules')
        p.addRule('a', 'first')
        p.write('ab')
      })
    })

    describe('on empty buffer', function () {
      var p = new Tokenizer(options)
      it('should set the next rule', function (done) {
        p.setDefaultHandler(function (token, idx, type) {
          switch(type) {
            case 'first':
            break
            case 'second':
              done()
            break
            default:
              done( new Error('unexpected type') )
          }
        })
        p.addRule('b', 'second')
        p.saveRuleSet('myRules')
        p.clearRule()
        p.addRule('a', 'first')
        p.next('myRules')
        p.addRule(0, 'set next rule set')
        p.write('a')
        p.write('b')
      })
    })
  })

  // Check the existence of a rule
  describe('#existsRule', function () {
    describe('does exist', function () {
      var p = new Tokenizer(options)
      it('should return true', function (done) {
        p.addRule('a', 'first')
        assert.equal(p.existsRule('first'), true)
        done()
      })
    })

    describe('does not exist', function () {
      var p = new Tokenizer(options)
      it('should return false', function (done) {
        p.addRule('a', 'first')
        assert.equal(p.existsRule('second'), false)
        done()
      })
    })
  })

  // Delete a rule set
  describe('#deleteRuleSet', function () {
    var p = new Tokenizer(options)
    it('should remove it', function (done) {
      p.addRule('a', 'first')
      p.saveRuleSet('myRules')
      p.deleteRuleSet('myRules')
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

  // Get the currently loaded rule set
  describe('#getRuleSet', function () {
    describe('does exist', function () {
      var p = new Tokenizer(options)
      it('should return myRules', function (done) {
        p.addRule('a', 'first')
        p.saveRuleSet('myRules')
        assert.equal(p.getRuleSet(), 'myRules')
        done()
      })
    })

    describe('does not exist', function () {
      var p = new Tokenizer(options)
      it('should return false', function (done) {
        p.addRule('a', 'first')
        assert.equal(p.getRuleSet(), null)
        done()
      })
    })
  })

  // Get all rule sets
  describe('#getAllRuleSet', function () {
    var p = new Tokenizer(options)
    it('should return rule sets: myRules and myRules2', function (done) {
      p.addRule('a', 'first')
      p.saveRuleSet('myRules')
      p.addRule('b', 'second')
      p.saveRuleSet('myRules2')
      assert.deepEqual(Object.keys( p.getAllRuleSet() ), ['myRules','myRules2'])
      done()
    })
  })
})