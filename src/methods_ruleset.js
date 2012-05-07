/**
 * Add a rule as the first one
 *
 * @param {string|number|function()} name of the rule to be added first
 * @param {...string|number|function()} rule item
 * @param {string|number|function()} rule type
 * @return {Atok}
 * @api public
 * @see Atok#addRule
 */
Atok.prototype.addRuleFirst = function (rule, /*rule, ... */ type) {
  this.addRule.apply( this, sliceArguments(arguments, 0) )
  this.rules.unshift( this.rules.pop() )

  return this
}
Atok.prototype._getRuleIndex = function (id) {
  for (var rules = this.rules, i = 0, n = rules.length; i < n; i++)
    if ( (rules[i].type !== null ? rules[i].type : rules[i].handler) === id ) break
  
  return i === n ? -1 : i
}
/**
 * Add a rule before an existing one
 *
 * @param {string|number|function()} name of the rule to add before
 * @param {...string|number|function()} rule item
 * @param {string|number|function()} rule type
 * @return {Atok}
 * @api public
 * @see Atok#addRule
 */
Atok.prototype.addRuleBefore = function (existingRule, rule, /*rule, ... */ type) {
  var i = this._getRuleIndex(existingRule)

  if ( i < 0 )
    return this._error( new Error('Atok#addRuleBefore: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, sliceArguments(arguments, 1) )
  this.rules.splice( i, 0, this.rules.pop() )

  return this
}
/**
 * Add a rule after an existing one
 *
 * @param {string|number|function()} name of the rule to add after
 * @param {...string|number|function()} rule item
 * @param {string|number|function()} rule type
 * @return {Atok}
 * @api public
 * @see Atok#addRule
 */
Atok.prototype.addRuleAfter = function (existingRule, rule, /*rule, ... */ type) {
  var i = this._getRuleIndex(existingRule)

  if ( i < 0 )
    return this._error( new Error('Atok#addRuleAfter: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, sliceArguments(arguments, 1) )
  this.rules.splice( i + 1, 0, this.rules.pop() )

  return this
}
/**
 * Add a rule
 *
 * @param {...string|number|function()} match at current buffer position (String: expect string, Integer: expect n characters, Array: expect one of the items). If not needed, use ''
 * @param {string|number|function()} rule name/id (if no default handler set, emit a data event) or handler (executed when all matches are valid)
 * @return {Atok}
 * @api public
 */
Atok.prototype.addRule = function (/*rule1, rule2, ... type|handler*/) {
  var args = sliceArguments(arguments, 0)

  if (args.length < 1)
    return this._error( new Error('Atok#addRule: Missing arguments (/*rule1, rule2 ...*/ type|handler)') )
  
  var last = args.pop()
  var first = args[0]
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
      return this._error( new Error('Atok#addRule: invalid type/handler, must be Number/String/Function') )
  }

  // Check if the rule is to be created
  for (var i = 0, n = args.length; i < n; i++) {
    // Discard true's, abort on false
    if (args[i] === false) return this
    if (args[i] === true) {
      args.splice(i, 1)
      i--
      n--
    }
  }

  // first === 0: following arguments are ignored
  // Empty buffer rule
  if ( first === 0 )
    this.emptyHandler = RuleString(
        0
      , type
      , handler
      , this
      )
  else
    this.rules.push(
      RuleString(
        args
      , type
      , handler
      , this
      )
    )

  return this
}
/**
 * Remove a rule (first instance only)
 *
 * @param {string} name of the rule to be removed
 * @return {Atok}
 * @api public
 */
Atok.prototype.removeRule = function (/* name ... */) {
  if (arguments.length === 0) return this
  
  for (var idx, i = 0, n = arguments.length; i < n; i++) {
    idx = this._getRuleIndex(arguments[i])
    if (idx >= 0)
      this.rules.splice(idx, 1)
  }

  return this
}
/**
 * Remove all rules
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.clearRule = function () {
  this.clearProps()
  this.rules = []
  this.handler = null
  this.currentRule = null
  return this
}
/**
 * Save all rules
 *
 * @param {string} name of the rule set
 * @return {Atok}
 * @api public
 */
Atok.prototype.saveRuleSet = function (name) {
  if (arguments.length === 0 || name === null)
    return this._error( new Error('Atok#saveRuleSet: invalid rule name supplied') )
  
  // Check and set the continue values
  var rules = this.rules
    , rule, id, j
  for (var i = 0, n = rules.length; i < n; i++) {
    rule = rules[i]
    id = rule.type !== null ? rule.type : rule.handler
    if (rule.continue !== null && typeof rule.continue !== 'number') {
      j = this._getRuleIndex(id)
      if (j < 0)
        this._error( new Error('Atok#saveRuleSet: continue() value not found: ' + id) )
      
      rule.continue = i - j
    }
  }

  this.saved[name] = {
    rules: this.rules
  , emptyHandler: this.emptyHandler
  }
  this.currentRule = name

  return this
}
/**
 * Load a rule set
 *
 * @param {string} name of the rule set
 * @return {Atok}
 * @api public
 */
Atok.prototype.loadRuleSet = function (name) {
  var ruleSet = this.saved[name]
  if (!ruleSet)
    return this._error( new Error('Atok#loadRuleSet: Rule set ' + name + ' not found') )

  this.currentRule = name
  this.rules = ruleSet.rules
  this.emptyHandler = ruleSet.emptyHandler
  // Reset the rule index...
  this.ruleIndex = 0
  this._resetRuleIndex = true

  return this
}
/**
 * Delete a rule set
 *
 * @param {string} name of the rule set
 * @return {Atok}
 * @api public
 */
Atok.prototype.deleteRuleSet = function (name) {
  delete this.saved[name]

  return this
}
/**
 * Get the current rule set
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.getRuleSet = function () {
  return this.currentRule
}
/**
 * Get the list of rule sets
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.getAllRuleSet = function () {
  return this.saved
}
/**
 * Check the existence of a rule
 *
 * @param {...string} name of the rule to check
 * @return {Atok}
 * @api public
 */
Atok.prototype.existsRule = function (/* name ... */) {
  var args = sliceArguments(arguments, 0)
  var self = this

  var res = args.map(function (rule) {
    return self._getRuleIndex(rule) >= 0
  })

  return args.length === 1 ? res[0] : res
}
