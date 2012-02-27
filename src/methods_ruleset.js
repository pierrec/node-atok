/*
 * Tokenizer public methods
 */
/** chainable, related to: Tokenizer#addRule
 * Tokenizer#addRuleFirst(firstRule, firstMatch[, nextMatch], type)
 * - beforeRule (String | Function): name of the rule to add before
 *
 * Add a rule as the first one
**/
Tknzr.prototype.addRuleFirst = function (rule, /*rule, ... */ type) {
  this.addRule.apply( this, sliceArguments(arguments, 0) )
  this.rules.unshift( this.rules.pop() )

  return this
}
Tknzr.prototype._getRuleIndex = function (id) {
  for (var rules = this.rules, i = 0, n = rules.length; i < n; i++)
    if ( (rules[i].type !== null ? rules[i].type : rules[i].handler) === id ) break
  
  return i === n ? -1 : i
}
/** chainable, related to: Tokenizer#addRule
 * Tokenizer#addRuleBefore(beforeRule, firstMatch[, nextMatch], type)
 * - beforeRule (String | Function): name of the rule to add before
 *
 * Add a rule before an existing one
**/
Tknzr.prototype.addRuleBefore = function (existingRule, rule, /*rule, ... */ type) {
  var i = this._getRuleIndex(existingRule)

  if ( i < 0 )
    return this._error( new Error('Tokenizer#addRuleBefore: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, sliceArguments(arguments, 1) )
  this.rules.splice( i, 0, this.rules.pop() )

  return this
}
/** chainable, related to: Tokenizer#addRule
 * Tokenizer#addRuleAfter(afterRule, firstMatch[, nextMatch], type)
 * - afterRule (String | Function): name of the rule to add after
 *
 * Add a rule after an existing one
**/
Tknzr.prototype.addRuleAfter = function (existingRule, rule, /*rule, ... */ type) {
  var i = this._getRuleIndex(existingRule)

  if ( i < 0 )
    return this._error( new Error('Tokenizer#addRuleAfter: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, sliceArguments(arguments, 1) )
  this.rules.splice( i + 1, 0, this.rules.pop() )

  return this
}
/** chainable
 * Tokenizer#addRule(firstMatch[, nextMatch], type)
 * - firstMatch (String | Integer | Array): match at current buffer position (String: expect string, Integer: expect n characters, Array: expect one of the items). If not needed, use ''
 * - nextMatch (String | Integer | Array): next match after previous matches. Can have as many as required (String: expect string, Integer: expect n characters, Array: expect one of the items)
 * - type (String | Function | Number): rule name/id (if no default handler set, emit a data event) or handler (executed when all matches are valid)
 *
 * Add a rule
**/
Tknzr.prototype.addRule = function (/*rule1, rule2, ... type|handler*/) {
  var args = sliceArguments(arguments, 0)

  if (args.length < 2)
    return this._error( new Error('Tokenizer#addRule: Missing arguments (rule1, /*rule2 ...*/ type|handler)') )
  
  var first = args[0]
  var last = args.pop()
  var type, handler = this.handler

  switch ( typeof(last) ) {
    case 'function':
      handler = last
      break
    case 'number':
    case 'string':
      type = last
      break
    default:
      return this._error( new Error('Tokenizer#addRule: invalid type/handler, must be Number/String/Function') )
  }

  // first <= 0: following arguments are ignored
  if ( first === 0 ) { // Empty buffer rule
    this.emptyHandler = RuleString(
        0
      , type
      , handler
      , this
      )
  } else {
    this.rules.push(
      RuleString(
        args
      , type
      , handler
      , this
      )
    )
  }

  return this
}
/** chainable
 * Tokenizer#removeRule(name)
 * - name (String): name of the rule to be removed
 *
 * Remove a rule
**/
Tknzr.prototype.removeRule = function (/* name ... */) {
  var args = arguments
  var n = args.length

  this.rules = this.rules.filter(function (rule) {
    var type = rule.type !== null ? rule.type : rule.handler
    for (var i = 0; i < n; i++)
      if (args[i] === type) return false
    return true
  })

  return this
}
/** chainable
 * Tokenizer#clearRule()
 *
 * Remove all rules
**/
Tknzr.prototype.clearRule = function () {
  this.clearProps()
  this.rules = []
  this.handler = null
  this.currentRule = null
  return this
}
/** chainable
 * Tokenizer#saveRuleSet(name)
 * - name (String): name of the rule set
 *
 * Save all rules
**/
Tknzr.prototype.saveRuleSet = function (name) {
  if (arguments.length === 0)
    return this._error( new Error('Tokenizer#saveRuleSet: No rule name supplied') )
  
  // Check and set the continue values
  var rules = this.rules
    , rule, id, j
  for (var i = 0, n = rules.length; i < n; i++) {
    rule = rules[i]
    id = rule.type !== null ? rule.type : rule.handler
    if (rule.continue !== null && typeof rule.continue !== 'number') {
      j = this._getRuleIndex(id)
      if (j < 0)
        this._error( new Error('Tokenizer#saveRuleSet: continue() value not found: ' + id) )
      
      rule.continue = i - j - 1
    }
  }

  this.saved[name] = {
    rules: this.rules
  , emptyHandler: this.emptyHandler
  }
  this.currentRule = name

  return this
}
/** chainable
 * Tokenizer#loadRuleSet(name)
 * - name (String): name of the rule set
 *
 * Load a rule set
**/
Tknzr.prototype.loadRuleSet = function (name) {
  var ruleSet = this.saved[name]
  if (!ruleSet)
    return this._error( new Error('Tokenizer#loadRuleSet: Rule set ' + name + ' not found') )

  this.currentRule = name
  this.rules = ruleSet.rules
  this.emptyHandler = ruleSet.emptyHandler
  // Reset the rule index...
  this.ruleIndex = 0

  return this
}
/** chainable
 * Tokenizer#deleteRuleSet(name)
 * - name (String): name of the rule set
 *
 * Delete a rule set
**/
Tknzr.prototype.deleteRuleSet = function (name) {
  delete this.saved[name]

  return this
}
/**
 * Tokenizer#getRuleSet()
 *
 * Get the current rule set
**/
Tknzr.prototype.getRuleSet = function () {
  return this.currentRule
}
/**
 * Tokenizer#getAllRuleSet()
 *
 * Get the list of rule sets
**/
Tknzr.prototype.getAllRuleSet = function () {
  return this.saved
}
/**
 * Tokenizer#existsRule(name[, name2]) -> Boolean
 * - name (String): name of the rule to check
 *
 * Check the existence of a rule
**/
Tknzr.prototype.existsRule = function (/* name ... */) {
  var args = sliceArguments(arguments, 0)
  var self = this

  var res = args.map(function (rule) {
    return self._getRuleIndex(rule) >= 0
  })

  return args.length === 1 ? res[0] : res
}
