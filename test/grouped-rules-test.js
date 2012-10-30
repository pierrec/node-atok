/*
 * Grouped rules tests
 */
var assert = require('assert')

var Tokenizer = require('..')

describe('Tokenizer Grouped Rules', function () {
  describe('Modifying resolved rules', function () {
    var p = new Tokenizer

    describe('after a saveRuleSet()', function () {
      it('should not corrupt the rules', function (done) {
        function error (token, idx, type) {
          if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
        }
        p.addRule('a', 'error-1')
        p.groupRule(true)
          p.continue(1)
          p.addRule('b', 'b')
          p.continue()
        p.groupRule()
        p.addRule('a', 'error-2')
        p.saveRuleSet('main')
        p.addRule('a', 'ok')

        p.write('ba')
        done()
      })
    })

    describe('within a handler', function () {
      it('should not corrupt the rules', function (done) {
        function error (token, idx, type) {
          if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
        }
        p.addRule('a', 'error-1')
        p.groupRule(true)
          p.continue(1)
          p.addRule('b', function () {
            p.addRule('a', 'error-3')
          })
          p.continue()
        p.groupRule()
        p.addRule('a', 'error-2')
        p.saveRuleSet('main')
        p.addRule('a', 'ok')

        p.write('ba')
        done()
      })
    })
  })

  describe('with a zero jump', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      function error (token, idx, type) {
        if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
      }
      p.setDefaultHandler(error)
      p.continue(0)
      p.addRule('a', 'first')
      p.continue()
      p.groupRule(true)
        p.addRule('a', function () {
          done()
        })
        p.addRule('a', 'error-1')
      p.groupRule()
      p.addRule('a', 'error-2')

      p.write('aa')
    })
  })

  describe('with a positive jump and 1 group', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      function error (token, idx, type) {
        if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
      }
      p.setDefaultHandler(error)
      p.continue(1)
      p.addRule('a', 'first')
      p.continue()
      p.groupRule(true)
        p.addRule('a', 'error-1')
        p.addRule('a', 'error-2')
      p.groupRule()
      p.addRule('a', function () {
        done()
      })

      p._resolveRules()

      p.write('aa')
    })
  })

  describe('with a positive jump and 1 group with 1 rule', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      function error (token, idx, type) {
        if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
      }
      p.setDefaultHandler(error)
      p.continue(1)
      p.addRule('a', 'first')
      p.continue()
      p.groupRule(true)
        p.addRule('a', 'error-1')
      p.groupRule()
      p.addRule('a', function () {
        done()
      })

      p.write('aa')
    })
  })

  describe('with a positive jump', function () {
    describe('and 2 groups', function () {
      var p = new Tokenizer

      it('should trigger on match', function (done) {
        function error (token, idx, type) {
          if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
        }
        p.setDefaultHandler(error)
        p.continue(4)
        p.addRule('a', 'first')
        p.continue()
        p.groupRule(true)
          p.addRule('a', 'error-1')
          p.addRule('a', 'error-2')
        p.groupRule()
        p.addRule('a', error)
        p.groupRule(true)
          p.addRule('a', 'error-3')
          p.addRule('a', 'error-4')
        p.groupRule()
        p.addRule('a', 'error-5')
        p.addRule('a', function () {
          done()
        })

        p.write('aa')
      })
    })

    describe('and 1 nested group', function () {
      var p = new Tokenizer

      it('should trigger on match', function (done) {
        function error (token, idx, type) {
          if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
        }
        p.setDefaultHandler(error)
        p.continue(1)
        p.addRule('a', 'first')
        p.continue()
        p.groupRule(true)
          p.addRule('a', 'error-1')
          p.addRule('a', 'error-2')
          p.groupRule(true)
            p.addRule('a', 'error-3')
            p.addRule('a', 'error-4')
          p.groupRule()
          p.addRule('a', 'error-5')
          p.addRule('a', 'error-6')
        p.groupRule()
        p.addRule('a', function () {
          done()
        })

        p.write('aa')
      })
    })

    describe('and 1 leading nested group', function () {
      var p = new Tokenizer

      it('should trigger on match', function (done) {
        function error (token, idx, type) {
          if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
        }
        p.setDefaultHandler(error)
        p.continue(1)
        p.addRule('a', 'first')
        p.continue()
        p.groupRule(true)
          p.groupRule(true)
            p.addRule('a', 'error-1')
            p.addRule('a', 'error-2')
          p.groupRule()
          p.addRule('a', 'error-3')
          p.addRule('a', 'error-4')
        p.groupRule()
        p.addRule('a', function () {
          done()
        })

        p.write('aa')
      })
    })

    describe('and 1 trailing nested group', function () {
      var p = new Tokenizer

      it('should trigger on match', function (done) {
        function error (token, idx, type) {
          if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
        }
        p.setDefaultHandler(error)
        p.continue(1)
        p.addRule('a', 'first')
        p.continue()
        p.groupRule(true)
          p.addRule('a', 'error-1')
          p.addRule('a', 'error-2')
          p.groupRule(true)
            p.addRule('a', 'error-3')
            p.addRule('a', 'error-4')
          p.groupRule()
        p.groupRule()
        p.addRule('a', function () {
          done()
        })

        p.write('aa')
      })
    })

    describe('and 2 groups with a same group level jump', function () {
      var p = new Tokenizer

      it('should trigger on match', function (done) {
        function error (token, idx, type) {
          if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
        }
        p.setDefaultHandler(error)
        p.continue(0)
        p.addRule('a', 'first')
        p.continue()
        p.groupRule(true)
          p.addRule('b', 'error-1')
            p.continue(2)
            p.addRule('a', 'second')
            p.continue()
            p.addRule('a', 'error-2')
        p.groupRule()
        p.groupRule(true)
          p.addRule('a', 'error-4')
          p.addRule('a', 'error-5')
        p.groupRule()
        p.addRule('a', function () {
          done()
        })

        p.write('aaa')
      })
    })
  })

  describe('with a -1 jump', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      function error (token, idx, type) {
        if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
      }
      var i = 0

      p.setDefaultHandler(error)
      p.continue(-1)
      p.addRule('a', function () {
        if (++i === 2) done()
      })
      p.continue()
      p.groupRule(true)
        p.addRule('a', 'error-1')
        p.addRule('a', 'error-2')
      p.groupRule()

      p.write('aa')
    })
  })

  describe('with a negative jump', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      var i = 0

      function error (token, idx, type) {
        if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
      }
      function incr () {
        i++
        if (i === 2) done()
      }

      p.setDefaultHandler(error)
      p.groupRule(true)
        p.addRule('a', incr)
        p.addRule('b', 'error-1')
      p.groupRule()
      p.continue(-2)
      p.addRule('c', 'continue')
      p.addRule('a', 'error-2')

      p.write('aca')
    })
  })

  describe('with a negative jump and 2 groups', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      var i = 0

      function error (token, idx, type) {
        if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
      }
      function incr () {
        i++
        if (i === 2) done()
      }

      p.setDefaultHandler(error)
      p.groupRule(true)
        p.addRule('a', incr)
        p.addRule('b', 'error-1')
      p.groupRule()
      p.addRule('b', 'error-2')
      p.groupRule(true)
        p.addRule('a', 'error-3')
        p.addRule('b', 'error-4')
      p.groupRule()
      p.continue(-4)
      p.addRule('c', 'continue')

      p.write('aca')
    })
  })

  describe('with a negative jump and 1 nested group', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      var i = 0

      function error (token, idx, type) {
        if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
      }
      function incr () {
        i++
        if (i === 2) done()
      }

      p.setDefaultHandler(error)
      p.groupRule(true)
        p.addRule('a', incr)
        p.groupRule(true)
          p.addRule('b', 'error-1')
          p.addRule('b', 'error-2')
          p.addRule('a', 'error-3')
        p.groupRule()
          p.addRule('b', 'error-4')
      p.groupRule()
      p.continue(-2)
      p.addRule('c', 'continue')

      p.write('aca')
    })
  })

  describe('with a negative jump and 1 leading nested group', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      var i = 0

      function error (token, idx, type) {
        if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
      }
      function incr () {
        i++
        if (i === 2) done()
      }

      p.setDefaultHandler(error)
      p.groupRule(true)
        p.groupRule(true)
          p.addRule('b', 'error-1')
          p.addRule('b', 'error-2')
        p.groupRule()
        p.addRule('a', incr)
      p.groupRule()
      p.continue(-2)
      p.addRule('c', 'continue')

      p.write('aca')
    })
  })

  describe('with a negative jump and 1 trailing nested group', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      var i = 0

      function error (token, idx, type) {
        if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
      }
      function incr () {
        i++
        if (i === 2) done()
      }

      p.setDefaultHandler(error)
      p.groupRule(true)
        p.addRule('a', incr)
        p.groupRule(true)
          p.addRule('b', 'error-1')
          p.addRule('b', 'error-2')
          p.addRule('a', 'error-3')
        p.groupRule()
      p.groupRule()
      p.continue(-2)
      p.addRule('c', 'continue')

      p.write('aca')
    })
  })

  describe('with a negative jump and 2 consecutive groups', function () {
    var p = new Tokenizer

    it('should trigger on match', function (done) {
      function error (token, idx, type) {
        if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
      }
      p.setDefaultHandler(error)
      p.continue(1)
      p.addRule('a', 'first')
      p.addRule('c', function () {
        done()
      })
      p.continue()
      p.groupRule(true)
        p.addRule('b', 'error-1')
        p.addRule('b', 'error-2')
      p.groupRule()
        p.addRule('b', 'error-2')
      p.groupRule(true)
        p.addRule('b', 'error-3')
        p.addRule('b', 'error-4')
      p.groupRule()
      p.continue(-5)
      p.addRule('c', 'second')
      p.continue()

      p.write('acc')
    })
  })

  describe('in a grouped group', function () {
    describe('with a zero jump', function () {
      var p = new Tokenizer

      it('should trigger on match', function (done) {
        function error (token, idx, type) {
          if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
        }
        p.setDefaultHandler(error)
        p.groupRule(true)
          p.continue(0)
          p.addRule('a', 'first')
          p.continue()
          p.groupRule(true)
            p.addRule('a', function () {
              done()
            })
            p.addRule('a', 'error-1')
          p.groupRule()
          p.addRule('a', 'error-2')
        p.groupRule()

        p.write('aa')
      })
    })
  })

  describe('with a positive jump', function () {
      var p = new Tokenizer

      it('should trigger on match', function (done) {
        function error (token, idx, type) {
          if (/^error/.test(type)) done( new Error( type + ' should not trigger') )
        }
        p.setDefaultHandler(error)
        p.groupRule(true)
          p.continue(1)
          p.addRule('a', 'first')
          p.continue()
          p.groupRule(true)
            p.addRule('a', 'error-1')
            p.addRule('a', 'error-2')
          p.groupRule()
          p.addRule('a', function () {
            done()
          })
        p.groupRule()

        p.write('aa')
      })
    })
})