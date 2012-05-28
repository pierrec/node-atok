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
  this._rules.unshift( this._rules.pop() )

  return this
}
/**
 * Get the index of a rule by id
 *
 * @param {string|number|function()} rule type
 * @return {number}
 * @api private
 */
Atok.prototype._getRuleIndex = function (id) {
  for (var rules = this._rules, i = 0, n = rules.length; i < n; i++)
    if (rules[i].id === id) break
  
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
  this._rules.splice( i, 0, this._rules.pop() )

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
  this._rules.splice( i + 1, 0, this._rules.pop() )

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
  var type = null
    , handler = this._defaultHandler

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

  this._rulesToResolve = true

  // first === 0: following arguments are ignored
  // Empty buffer rule
  if ( first === 0 )
    this._emptyHandler.push(
      RuleString(
        0
      , type
      , handler
      , this
      )
    )
  else
    this._rules.push(
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
      this._rules.splice(idx, 1)
  }

  this._rulesToResolve = true

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
  this._rules = []
  this._defaultHandler = null
  this.currentRule = null
  this._rulesToResolve = false

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
  

  this._savedRules[name] = {
    rules: this._rules
  , emptyHandler: this._emptyHandler
  }
  this.currentRule = name

  // Resolve and check continues
  this._resolveRules(name)

  return this
}
/**
 * Load a rule set
 *
 * @param {string} name of the rule set
 * @param {number} index to start at
 * @return {Atok}
 * @api public
 */
Atok.prototype.loadRuleSet = function (name, index) {
  var ruleSet = this._savedRules[name]
  if (!ruleSet)
    return this._error( new Error('Atok#loadRuleSet: Rule set ' + name + ' not found') )

  this.currentRule = name
  this._rules = ruleSet.rules
  this._emptyHandler = ruleSet.emptyHandler
  this._rulesToResolve = false
  // Set the rule index
  this._ruleIndex = typeof index === 'number' ? index : 0
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
Atok.prototype.removeRuleSet = function (name) {
  delete this._savedRules[name]
  // Make sure no reference to the rule set exists
  if (this.currentRule === name) this.currentRule = null

  return this
}
/**
 * Resolve a rule or all of them if none specified:
 * - translate non number continue() to numbers
 * - check continue() stay within bounds
 *
 * @param {string} name of the rule set (optional)
 * @api private
 */
Atok.prototype._resolveRules = function (name) {
  // Check and set the continue values
  var rules = name ? this._savedRules[name].rules : this._rules
  var rule, j

  for (var i = 0, n = rules.length; i < n; i++) {
    rule = rules[i]
    if (rule.continue !== null && typeof rule.continue !== 'number') {
      j = this._getRuleIndex(rule.id)
      if (j < 0)
        this._error( new Error('Atok#_resolveRules: continue() value not found: ' + rule.id) )
      
      rule.continue = i - j
    }
    // Check the continue boundaries
    if (rule.continue !== null) {
      j = i + rule.continue + 1
      if (j < 0 || j > rules.length - 1)
        this._error( new Error('Atok#_resolveRules: continue() value out of bounds: ' + rule.continue + ' index ' + i) )
    }
  }

  this._rulesToResolve = false

  // Adjust continue jumps according to groups
  for (i = 0; i < n; i++) {
    rule = rules[i]
    // Check each rule continue property
    if (rule.continue !== null) {
      if (rule.continue > 0) {
        // Positive jump
        for (var j = 1, m = rule.continue + 1; j < m; j++) {
          // Scan all rules from the current one to the target one
          rule.continue += rules[i + j].groupEnd > 0
            ? rules[i + j].groupEnd - rules[i + j].groupStart
            : 0
        }
      } else if (rule.continue < -1) {
        // Negative jump
        for (var j = 1, m = -rule.continue; j < m; j++) {
          // Scan all rules from the current one to the target one
          rule.continue -= rules[i - j].groupEnd > 0
            ? rules[i - j].groupEnd - rules[i - j].groupStart
            : 0
        }
      }
    }
  }
}
/**
 * Bind rules to the same index
 *
 * @param {Boolean} toggle grouping on/off
 * @return {Atok}
 * @api public
 */
Atok.prototype.groupRule = function (flag) {
  var rules = this._rules

  if (flag !== true) {
    // 1 or 0 rule, group is ignored
    if (rules.length - this._groupStart < 2) {
      for (var i = 0, n = rules.length; i < n; i++) {
        rules[i].groupStart = 0
        rules[i].groupEnd = 0
      }
    } else {
      // Set the last index of the group to all rules
      for (var i = this._groupStart, n = rules.length; i < n; i++)
        rules[i].groupEnd = n - 1
    }

    this._groupStart = 0
    this._groupEnd = 0

    return this
  }

  this._groupStart = this._rules.length

  return this
}
